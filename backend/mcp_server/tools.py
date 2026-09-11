import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from backend.db.models import Document, DocumentVersion, AuditLog, User
from backend.vector_store.chroma_client import vector_store
from backend.ingestion.pipeline import classify_text

ROLE_PERMISSIONS = {
    "admin": {"search_documents", "get_document", "summarize_document", "classify_document",
              "update_metadata", "list_folder", "move_document", "delete_document",
              "compare_documents", "get_audit_log", "flag_compliance_issues"},
    "editor": {"search_documents", "get_document", "summarize_document", "classify_document",
               "update_metadata", "list_folder", "move_document", "compare_documents",
               "get_audit_log", "flag_compliance_issues"},
    "viewer": {"search_documents", "get_document", "summarize_document", "classify_document",
               "list_folder", "compare_documents", "get_audit_log", "flag_compliance_issues"}
}

def log_audit_entry(
    db: Session,
    tool_name: str,
    user_name: str,
    user_role: str,
    input_payload: dict,
    output_payload: dict,
    status: str,
    diff_summary: str = "",
    user_id: Optional[str] = None
):
    try:
        entry = AuditLog(
            user_id=user_id,
            user_name=user_name,
            user_role=user_role,
            tool_name=tool_name,
            input_payload=input_payload,
            output_payload=output_payload,
            status=status,
            diff_summary=diff_summary,
            timestamp=datetime.utcnow()
        )
        db.add(entry)
        db.commit()
    except Exception as e:
        db.rollback()

def check_permission(tool_name: str, user_role: str) -> bool:
    allowed = ROLE_PERMISSIONS.get(user_role, set())
    return tool_name in allowed

# --- 1. search_documents ---
def search_documents(
    db: Session,
    query: str,
    filters: Optional[Dict[str, Any]] = None,
    user_role: str = "viewer",
    user_name: str = "agent",
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    if not check_permission("search_documents", user_role):
        log_audit_entry(db, "search_documents", user_name, user_role, {"query": query, "filters": filters}, {"error": "Permission Denied"}, "DENIED")
        return {"error": f"Role '{user_role}' is not authorized to execute search_documents"}

    filters = filters or {}
    type_filter = filters.get("type") or filters.get("category")
    owner_filter = filters.get("owner")
    tags_filter = filters.get("tags")
    folder_filter = filters.get("folder")

    # Vector search first
    vector_results = vector_store.search(query=query, n_results=10)
    matched_doc_ids = {r["doc_id"]: r for r in vector_results if r.get("doc_id")}

    # Query DB for non-deleted documents
    q = db.query(Document).filter(Document.is_deleted == False)
    if type_filter:
        q = q.filter(Document.category.ilike(f"%{type_filter}%"))
    if folder_filter:
        q = q.filter(Document.folder_path.startswith(folder_filter))

    docs = q.all()
    results = []

    for doc in docs:
        # Check text match or vector match
        vec_match = matched_doc_ids.get(doc.id)
        rel_score = vec_match["relevance_score"] if vec_match else 0.0
        
        # Keyword scoring fallback/boost
        snippet = ""
        if vec_match:
            snippet = vec_match["snippet"]
        else:
            # Simple content snippet search
            lower_query = query.lower()
            lower_content = (doc.content_text or "").lower()
            idx = lower_content.find(lower_query)
            if idx != -1:
                start = max(0, idx - 100)
                end = min(len(doc.content_text), idx + len(query) + 150)
                snippet = doc.content_text[start:end].strip()
                rel_score = max(rel_score, 0.75)
            elif lower_query in doc.title.lower():
                snippet = f"Title match: {doc.title}"
                rel_score = max(rel_score, 0.65)
            elif not query.strip():
                snippet = (doc.content_text or "")[:200]
                rel_score = 0.50

        # Filter by owner or tags if supplied
        if owner_filter and doc.owner and doc.owner.username != owner_filter:
            continue
        if tags_filter:
            doc_tags = [t.lower() for t in (doc.tags or [])]
            if not any(t.lower() in doc_tags for t in tags_filter):
                continue

        if rel_score > 0.0 or not query.strip():
            results.append({
                "doc_id": doc.id,
                "title": doc.title,
                "category": doc.category,
                "folder_path": doc.folder_path,
                "tags": doc.tags or [],
                "snippet": snippet[:350],
                "relevance_score": rel_score,
                "expiration_date": doc.expiration_date.strftime("%Y-%m-%d") if doc.expiration_date else None,
                "has_signature": doc.has_signature
            })

    results.sort(key=lambda x: x["relevance_score"], reverse=True)
    out = {"count": len(results), "documents": results[:10]}
    log_audit_entry(db, "search_documents", user_name, user_role, {"query": query, "filters": filters}, {"matches_found": len(results)}, "SUCCESS", user_id=user_id)
    return out

# --- 2. get_document ---
def get_document(
    db: Session,
    doc_id: str,
    user_role: str = "viewer",
    user_name: str = "agent",
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    if not check_permission("get_document", user_role):
        log_audit_entry(db, "get_document", user_name, user_role, {"doc_id": doc_id}, {"error": "Permission Denied"}, "DENIED")
        return {"error": f"Role '{user_role}' is not authorized to execute get_document"}

    doc = db.query(Document).filter(Document.id == doc_id, Document.is_deleted == False).first()
    if not doc:
        return {"error": f"Document with ID '{doc_id}' not found"}

    versions = [{
        "version_num": v.version_num,
        "summary_diff": v.summary_diff,
        "created_by": v.created_by,
        "created_at": v.created_at.strftime("%Y-%m-%d %H:%M:%S")
    } for v in doc.versions]

    out = {
        "doc_id": doc.id,
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
        "versions": versions,
        "full_text": doc.content_text
    }
    log_audit_entry(db, "get_document", user_name, user_role, {"doc_id": doc_id}, {"title": doc.title}, "SUCCESS", user_id=user_id)
    return out

# --- 3. summarize_document ---
def summarize_document(
    db: Session,
    doc_id: str,
    focus: Optional[str] = None,
    user_role: str = "viewer",
    user_name: str = "agent",
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    if not check_permission("summarize_document", user_role):
        log_audit_entry(db, "summarize_document", user_name, user_role, {"doc_id": doc_id, "focus": focus}, {"error": "Permission Denied"}, "DENIED")
        return {"error": f"Role '{user_role}' is not authorized to execute summarize_document"}

    doc = db.query(Document).filter(Document.id == doc_id, Document.is_deleted == False).first()
    if not doc:
        return {"error": f"Document with ID '{doc_id}' not found"}

    text = doc.content_text or ""
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    # Extract sections matching focus or general summary
    key_points = []
    lower_focus = (focus or "").lower()

    if lower_focus:
        for line in lines:
            if any(term in line.lower() for term in lower_focus.split()):
                if len(line) > 20 and line not in key_points:
                    key_points.append(line)
        if not key_points:
            key_points = lines[:5]
    else:
        # General summary points
        for line in lines[:8]:
            if len(line) > 25 and not line.startswith("#"):
                key_points.append(line)

    summary_text = (
        f"**Summary of '{doc.title}'** (Category: {doc.category})\n"
        f"- Focus: {focus if focus else 'General Overview'}\n"
        f"- Expiration: {doc.expiration_date.strftime('%Y-%m-%d') if doc.expiration_date else 'None / Perpetual'}\n"
        f"- Signatures: {'Verified' if doc.has_signature else 'Missing signature'}\n\n"
        f"**Key Findings:**\n" + "\n".join(f"• {pt[:250]}" for pt in key_points[:6])
    )

    out = {
        "doc_id": doc.id,
        "title": doc.title,
        "category": doc.category,
        "focus": focus or "General",
        "structured_summary": summary_text,
        "key_points": key_points[:6],
        "compliance_status": {
            "has_signature": doc.has_signature,
            "expiration_date": doc.expiration_date.strftime("%Y-%m-%d") if doc.expiration_date else None
        }
    }
    log_audit_entry(db, "summarize_document", user_name, user_role, {"doc_id": doc_id, "focus": focus}, {"points_extracted": len(key_points)}, "SUCCESS", user_id=user_id)
    return out

# --- 4. classify_document ---
def classify_document(
    db: Session,
    doc_id: str,
    user_role: str = "viewer",
    user_name: str = "agent",
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    if not check_permission("classify_document", user_role):
        log_audit_entry(db, "classify_document", user_name, user_role, {"doc_id": doc_id}, {"error": "Permission Denied"}, "DENIED")
        return {"error": f"Role '{user_role}' is not authorized to execute classify_document"}

    doc = db.query(Document).filter(Document.id == doc_id, Document.is_deleted == False).first()
    if not doc:
        return {"error": f"Document with ID '{doc_id}' not found"}

    cat, confidence = classify_text(doc.content_text or doc.title)
    
    # Auto-update if unclassified
    if doc.category in ["General", "Unclassified"]:
        doc.category = cat
        db.commit()

    out = {
        "doc_id": doc.id,
        "title": doc.title,
        "predicted_category": cat,
        "confidence_score": confidence,
        "previous_category": doc.category
    }
    log_audit_entry(db, "classify_document", user_name, user_role, {"doc_id": doc_id}, out, "SUCCESS", user_id=user_id)
    return out

# --- 5. update_metadata ---
def update_metadata(
    db: Session,
    doc_id: str,
    fields: Dict[str, Any],
    user_role: str = "editor",
    user_name: str = "agent",
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    if not check_permission("update_metadata", user_role):
        log_audit_entry(db, "update_metadata", user_name, user_role, {"doc_id": doc_id, "fields": fields}, {"error": "Permission Denied"}, "DENIED")
        return {"error": f"Role '{user_role}' is not authorized to execute update_metadata"}

    doc = db.query(Document).filter(Document.id == doc_id, Document.is_deleted == False).first()
    if not doc:
        return {"error": f"Document with ID '{doc_id}' not found"}

    diffs = []
    for key, val in fields.items():
        if hasattr(doc, key):
            old_val = getattr(doc, key)
            if key == "tags" and isinstance(val, list):
                setattr(doc, key, val)
                diffs.append(f"tags: {old_val} -> {val}")
            elif key == "expiration_date" and isinstance(val, str):
                try:
                    exp_dt = datetime.strptime(val, "%Y-%m-%d")
                    setattr(doc, key, exp_dt)
                    diffs.append(f"expiration_date: {old_val} -> {val}")
                except ValueError:
                    pass
            else:
                setattr(doc, key, val)
                diffs.append(f"{key}: {old_val} -> {val}")

    doc.updated_at = datetime.utcnow()
    db.commit()

    diff_str = "; ".join(diffs)
    out = {"doc_id": doc.id, "status": "updated", "changes": diffs}
    log_audit_entry(db, "update_metadata", user_name, user_role, {"doc_id": doc_id, "fields": fields}, out, "SUCCESS", diff_summary=diff_str, user_id=user_id)
    return out

# --- 6. list_folder ---
def list_folder(
    db: Session,
    path: str = "/",
    user_role: str = "viewer",
    user_name: str = "agent",
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    if not check_permission("list_folder", user_role):
        log_audit_entry(db, "list_folder", user_name, user_role, {"path": path}, {"error": "Permission Denied"}, "DENIED")
        return {"error": f"Role '{user_role}' is not authorized to execute list_folder"}

    clean_path = "/" + path.strip("/")
    if clean_path != "/":
        clean_path = clean_path + "/"

    docs = db.query(Document).filter(Document.is_deleted == False).all()
    
    subfolders = set()
    files_in_folder = []

    for d in docs:
        doc_folder = "/" + d.folder_path.strip("/")
        if not doc_folder.endswith("/"):
            doc_folder += "/"

        if doc_folder == clean_path or (clean_path == "/" and doc_folder == "/"):
            files_in_folder.append({
                "doc_id": d.id,
                "title": d.title,
                "category": d.category,
                "tags": d.tags or [],
                "file_size": d.file_size,
                "updated_at": d.updated_at.strftime("%Y-%m-%d")
            })
        elif doc_folder.startswith(clean_path):
            remainder = doc_folder[len(clean_path):].strip("/")
            top_child = remainder.split("/")[0]
            if top_child:
                subfolders.add(top_child)

    tree = {
        "current_path": path,
        "subfolders": sorted(list(subfolders)),
        "files": files_in_folder,
        "total_files_in_path": len(files_in_folder)
    }
    log_audit_entry(db, "list_folder", user_name, user_role, {"path": path}, {"subfolders": len(subfolders), "files": len(files_in_folder)}, "SUCCESS", user_id=user_id)
    return tree

# --- 7. move_document ---
def move_document(
    db: Session,
    doc_id: str,
    destination_folder: str,
    user_role: str = "editor",
    user_name: str = "agent",
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    if not check_permission("move_document", user_role):
        log_audit_entry(db, "move_document", user_name, user_role, {"doc_id": doc_id, "destination": destination_folder}, {"error": "Permission Denied"}, "DENIED")
        return {"error": f"Role '{user_role}' is not authorized to execute move_document"}

    doc = db.query(Document).filter(Document.id == doc_id, Document.is_deleted == False).first()
    if not doc:
        return {"error": f"Document with ID '{doc_id}' not found"}

    old_folder = doc.folder_path
    clean_dest = "/" + destination_folder.strip("/")
    doc.folder_path = clean_dest
    doc.updated_at = datetime.utcnow()
    db.commit()

    diff_str = f"folder_path: '{old_folder}' -> '{clean_dest}'"
    out = {
        "doc_id": doc.id,
        "title": doc.title,
        "old_folder": old_folder,
        "new_folder": clean_dest,
        "status": "moved"
    }
    log_audit_entry(db, "move_document", user_name, user_role, {"doc_id": doc_id, "destination": clean_dest}, out, "SUCCESS", diff_summary=diff_str, user_id=user_id)
    return out

# --- 8. delete_document ---
def delete_document(
    db: Session,
    doc_id: str,
    user_role: str = "admin",
    user_name: str = "agent",
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    # RBAC: Only Admin can delete
    if not check_permission("delete_document", user_role) or user_role != "admin":
        log_audit_entry(db, "delete_document", user_name, user_role, {"doc_id": doc_id}, {"error": "Permission Denied: Only Admin can delete documents"}, "DENIED")
        return {"error": f"Permission Denied: Role '{user_role}' is not permitted to delete documents. Requires 'admin' privileges."}

    doc = db.query(Document).filter(Document.id == doc_id, Document.is_deleted == False).first()
    if not doc:
        return {"error": f"Document with ID '{doc_id}' not found"}

    doc.is_deleted = True
    doc.updated_at = datetime.utcnow()
    db.commit()

    # Remove vector chunks
    vector_store.delete_document(doc_id)

    diff_str = f"Document '{doc.title}' soft-deleted (is_deleted: False -> True)"
    out = {
        "doc_id": doc.id,
        "title": doc.title,
        "status": "soft_deleted",
        "message": f"Document '{doc.title}' successfully moved to trash"
    }
    log_audit_entry(db, "delete_document", user_name, user_role, {"doc_id": doc_id}, out, "SUCCESS", diff_summary=diff_str, user_id=user_id)
    return out

# --- 9. compare_documents ---
def compare_documents(
    db: Session,
    doc_ids: List[str],
    criteria: str = "payment terms, liability, and duration",
    user_role: str = "viewer",
    user_name: str = "agent",
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    if not check_permission("compare_documents", user_role):
        log_audit_entry(db, "compare_documents", user_name, user_role, {"doc_ids": doc_ids, "criteria": criteria}, {"error": "Permission Denied"}, "DENIED")
        return {"error": f"Role '{user_role}' is not authorized to execute compare_documents"}

    docs = db.query(Document).filter(Document.id.in_(doc_ids), Document.is_deleted == False).all()
    if not docs:
        return {"error": "No matching documents found to compare"}

    comparison_matrix = []
    for doc in docs:
        text = doc.content_text or ""
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        matched_lines = []
        for word in criteria.lower().split():
            if len(word) > 3:
                for line in lines:
                    if word in line.lower() and line not in matched_lines:
                        matched_lines.append(line)

        snippet_summary = " ".join(matched_lines[:3]) if matched_lines else (lines[0] if lines else "No text")
        comparison_matrix.append({
            "doc_id": doc.id,
            "title": doc.title,
            "category": doc.category,
            "expiration_date": doc.expiration_date.strftime("%Y-%m-%d") if doc.expiration_date else "N/A",
            "has_signature": doc.has_signature,
            "criteria_analysis": snippet_summary[:300]
        })

    out = {
        "criteria": criteria,
        "documents_compared": len(comparison_matrix),
        "matrix": comparison_matrix,
        "synthesis": f"Comparison of {len(comparison_matrix)} documents across '{criteria}' completed. Review matrix entries for individual clause comparisons."
    }
    log_audit_entry(db, "compare_documents", user_name, user_role, {"doc_ids": doc_ids, "criteria": criteria}, {"compared_count": len(docs)}, "SUCCESS", user_id=user_id)
    return out

# --- 10. get_audit_log ---
def get_audit_log(
    db: Session,
    filters: Optional[Dict[str, Any]] = None,
    limit: int = 50,
    user_role: str = "viewer",
    user_name: str = "agent",
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    if not check_permission("get_audit_log", user_role):
        return {"error": f"Role '{user_role}' is not authorized to execute get_audit_log"}

    filters = filters or {}
    q = db.query(AuditLog)

    tool_filter = filters.get("tool_name")
    status_filter = filters.get("status")
    user_filter = filters.get("user_name")

    if tool_filter:
        q = q.filter(AuditLog.tool_name == tool_filter)
    if status_filter:
        q = q.filter(AuditLog.status == status_filter)
    if user_filter:
        q = q.filter(AuditLog.user_name == user_filter)

    logs = q.order_by(desc(AuditLog.timestamp)).limit(limit).all()

    formatted = [{
        "id": l.id,
        "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "user_name": l.user_name,
        "user_role": l.user_role,
        "tool_name": l.tool_name,
        "status": l.status,
        "diff_summary": l.diff_summary,
        "input_payload": l.input_payload,
        "output_payload": l.output_payload
    } for l in logs]

    return {"count": len(formatted), "logs": formatted}

# --- 11. flag_compliance_issues ---
def flag_compliance_issues(
    db: Session,
    user_role: str = "viewer",
    user_name: str = "compliance-agent",
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    if not check_permission("flag_compliance_issues", user_role):
        log_audit_entry(db, "flag_compliance_issues", user_name, user_role, {}, {"error": "Permission Denied"}, "DENIED")
        return {"error": f"Role '{user_role}' is not authorized to execute flag_compliance_issues"}

    docs = db.query(Document).filter(Document.is_deleted == False).all()
    now = datetime.utcnow()
    expiring_soon_threshold = now + timedelta(days=90)

    issues = []

    for d in docs:
        doc_issues = []
        # Missing signature check for contracts & policies
        if d.category in ["Contract", "Policy", "HR"] and not d.has_signature:
            doc_issues.append("Missing required authorized signature")

        # Expiration checks
        if d.expiration_date:
            if d.expiration_date < now:
                doc_issues.append(f"EXPIRED on {d.expiration_date.strftime('%Y-%m-%d')}")
            elif d.expiration_date <= expiring_soon_threshold:
                days_left = (d.expiration_date - now).days
                doc_issues.append(f"Expiring in {days_left} days ({d.expiration_date.strftime('%Y-%m-%d')})")

        # Tag checks
        if not d.tags or len(d.tags) == 0:
            doc_issues.append("Missing taxonomy tags")

        if doc_issues:
            issues.append({
                "doc_id": d.id,
                "title": d.title,
                "category": d.category,
                "folder_path": d.folder_path,
                "issues": doc_issues,
                "severity": "HIGH" if any("EXPIRED" in i or "Missing required" in i for i in doc_issues) else "MEDIUM"
            })

    out = {
        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
        "total_documents_scanned": len(docs),
        "flagged_issues_count": len(issues),
        "issues": issues
    }
    log_audit_entry(db, "flag_compliance_issues", user_name, user_role, {}, {"flagged_count": len(issues)}, "SUCCESS", user_id=user_id)
    return out
