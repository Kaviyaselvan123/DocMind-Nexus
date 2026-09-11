import os
import uuid
import shutil
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.config import settings
from backend.db.session import get_db
from backend.db.models import Document, DocumentVersion, User
from backend.auth.security import get_current_user, require_role
from backend.ingestion.pipeline import (
    extract_text_from_file, chunk_text, classify_text, extract_metadata_heuristics
)
from backend.vector_store.chroma_client import vector_store
from backend.mcp_server.tools import log_audit_entry

router = APIRouter()

class DocumentOut(BaseModel):
    id: str
    title: str
    category: str
    folder_path: str
    tags: List[str]
    file_size: int
    mime_type: str
    expiration_date: Optional[str]
    has_signature: bool
    created_at: str
    updated_at: str
    version_count: int

    class Config:
        from_attributes = True

@router.get("/", response_model=List[DocumentOut])
def list_documents(
    category: Optional[str] = None,
    folder: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Document).filter(Document.is_deleted == False)
    if category:
        q = q.filter(Document.category.ilike(f"%{category}%"))
    if folder:
        q = q.filter(Document.folder_path.startswith(folder))
    if search:
        q = q.filter(Document.title.ilike(f"%{search}%"))

    docs = q.order_by(desc(Document.created_at)).all()
    results = []
    for d in docs:
        results.append(DocumentOut(
            id=d.id,
            title=d.title,
            category=d.category,
            folder_path=d.folder_path,
            tags=d.tags or [],
            file_size=d.file_size,
            mime_type=d.mime_type,
            expiration_date=d.expiration_date.strftime("%Y-%m-%d") if d.expiration_date else None,
            has_signature=d.has_signature,
            created_at=d.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            updated_at=d.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
            version_count=len(d.versions)
        ))
    return results

@router.get("/{doc_id}")
def get_document_detail(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id, Document.is_deleted == False).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    versions = [{
        "version_num": v.version_num,
        "summary_diff": v.summary_diff,
        "created_by": v.created_by,
        "created_at": v.created_at.strftime("%Y-%m-%d %H:%M:%S")
    } for v in doc.versions]

    return {
        "id": doc.id,
        "title": doc.title,
        "category": doc.category,
        "folder_path": doc.folder_path,
        "tags": doc.tags or [],
        "file_size": doc.file_size,
        "mime_type": doc.mime_type,
        "expiration_date": doc.expiration_date.strftime("%Y-%m-%d") if doc.expiration_date else None,
        "has_signature": doc.has_signature,
        "created_at": doc.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": doc.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
        "content_text": doc.content_text,
        "versions": versions
    }

@router.get("/{doc_id}/download")
def download_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id, Document.is_deleted == False).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document file not found on disk")
    return FileResponse(doc.file_path, filename=doc.title)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    folder_path: str = Form("/"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail=f"Upload not permitted for role '{user.role}'")

    doc_id = str(uuid.uuid4())
    safe_filename = f"{doc_id}_{Path(file.filename).name}"
    save_path = Path(settings.STORAGE_PATH) / safe_filename

    # Save file to disk
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(save_path)
    mime_type = file.content_type or "application/octet-stream"

    # Ingestion Pipeline
    # 1. Parse text
    extracted_text = extract_text_from_file(str(save_path))
    if not extracted_text:
        extracted_text = f"Document content for {file.filename}"

    # 2. Chunk text
    chunks = chunk_text(extracted_text, chunk_size=settings.CHUNK_SIZE, overlap=settings.CHUNK_OVERLAP)

    # 3. Vector Embeddings
    chunk_metas = [{"title": file.filename, "folder_path": folder_path} for _ in chunks]
    vector_store.add_chunks(doc_id=doc_id, chunks=chunks, metadatas=chunk_metas)

    # 4. Auto-classification
    predicted_cat, conf = classify_text(extracted_text)

    # 5. Metadata heuristics
    heuristics = extract_metadata_heuristics(extracted_text)

    # Clean folder path
    clean_folder = "/" + folder_path.strip("/")

    # 6. Database record
    new_doc = Document(
        id=doc_id,
        title=file.filename,
        file_path=str(save_path),
        file_size=file_size,
        mime_type=mime_type,
        category=predicted_cat,
        folder_path=clean_folder,
        tags=heuristics["tags"],
        expiration_date=heuristics["expiration_date"],
        has_signature=heuristics["has_signature"],
        content_text=extracted_text,
        owner_id=user.id if hasattr(user, "id") else None
    )
    db.add(new_doc)

    # Initial version
    initial_version = DocumentVersion(
        doc_id=doc_id,
        version_num=1,
        file_path=str(save_path),
        summary_diff="Initial upload and auto-classification",
        created_by=user.username if hasattr(user, "username") else "user"
    )
    db.add(initial_version)
    db.commit()

    # Log audit entry
    log_audit_entry(
        db=db,
        tool_name="upload_document",
        user_name=user.username if hasattr(user, "username") else "user",
        user_role=user.role if hasattr(user, "role") else "editor",
        input_payload={"filename": file.filename, "folder": clean_folder, "size": file_size},
        output_payload={"doc_id": doc_id, "category": predicted_cat, "confidence": conf, "chunks": len(chunks)},
        status="SUCCESS",
        diff_summary=f"Created document '{file.filename}' in '{clean_folder}'",
        user_id=user.id if hasattr(user, "id") else None
    )

    return {
        "status": "Ready",
        "doc_id": doc_id,
        "title": file.filename,
        "category": predicted_cat,
        "confidence": conf,
        "chunks_indexed": len(chunks),
        "tags": heuristics["tags"],
        "has_signature": heuristics["has_signature"],
        "expiration_date": heuristics["expiration_date"].strftime("%Y-%m-%d") if heuristics["expiration_date"] else None
    }
