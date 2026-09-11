import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="viewer", nullable=False)  # admin, editor, viewer
    created_at = Column(DateTime, default=datetime.utcnow)

    documents = relationship("Document", back_populates="owner")
    audit_logs = relationship("AuditLog", back_populates="user")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False, index=True)
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer, default=0)
    mime_type = Column(String(100), default="application/pdf")
    category = Column(String(50), default="General", index=True)  # Contract, Financial, Policy, HR, Technical, etc.
    folder_path = Column(String(255), default="/", index=True)
    tags = Column(JSON, default=list)  # list of strings
    expiration_date = Column(DateTime, nullable=True)
    has_signature = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False, index=True)
    content_text = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=True)

    owner = relationship("User", back_populates="documents")
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")

class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    doc_id = Column(String(36), ForeignKey("documents.id"), nullable=False)
    version_num = Column(Integer, default=1)
    file_path = Column(String(512), nullable=False)
    summary_diff = Column(Text, default="")
    created_by = Column(String(64), default="system")
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="versions")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    user_name = Column(String(64), default="agent")
    user_role = Column(String(20), default="viewer")
    tool_name = Column(String(64), index=True, nullable=False)
    input_payload = Column(JSON, default=dict)
    output_payload = Column(JSON, default=dict)
    status = Column(String(20), default="SUCCESS")  # SUCCESS, DENIED, ERROR
    diff_summary = Column(Text, default="")

    user = relationship("User", back_populates="audit_logs")
