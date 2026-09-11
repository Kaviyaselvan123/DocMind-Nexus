import os
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from backend.config import settings
from backend.db.session import SessionLocal, init_db
from backend.db.models import User, Document, DocumentVersion, AuditLog
from backend.auth.security import get_password_hash
from backend.ingestion.pipeline import chunk_text, classify_text, extract_metadata_heuristics
from backend.vector_store.chroma_client import vector_store

SAMPLE_DOCUMENTS = [
    {
        "filename": "Master_Services_Agreement_AcmeCorp.txt",
        "category": "Contract",
        "folder": "/Contracts",
        "has_signature": True,
        "days_to_expire": 365,
        "content": """MASTER SERVICES AGREEMENT (MSA)
Between: Acme Innovations Inc. ("Client") and NovaSoft Technologies LLC ("Provider").
Effective Date: January 15, 2026.
Expiration Date: January 15, 2027.

1. SCOPE OF SERVICES
Provider shall deliver cloud architecture consulting, custom AI document pipelines, and dedicated site reliability engineering as described in Statements of Work.

2. PAYMENT TERMS & SCHEDULE
All invoices are payable Net-30 from date of invoice. Late payments shall accrue interest at 1.5% per month or the maximum rate permitted by law. In the event of billing disputes, Client must notify Provider in writing within 15 calendar days.

3. CONFIDENTIALITY & DATA PROTECTION
Both parties agree to protect proprietary data using industry-standard AES-256 encryption. Client data shall not be retained or used for external model training.

4. LIMITATION OF LIABILITY
Neither party's aggregate liability under this Agreement shall exceed the total fees paid by Client in the preceding twelve (12) month period, excluding breaches of confidentiality and gross negligence.

5. TERMINATION
Either party may terminate this Agreement without cause upon sixty (60) days prior written notice.

SIGNATURES:
Signed by: Arthur Pendelton, Chief Technology Officer, Acme Innovations Inc.
Authorized Signatory: Elena Rostova, VP Enterprise Sales, NovaSoft Technologies LLC
/s/ Arthur Pendelton
/s/ Elena Rostova
"""
    },
    {
        "filename": "Mutual_NDA_TechFlow_AI.txt",
        "category": "Contract",
        "folder": "/Contracts",
        "has_signature": True,
        "days_to_expire": 14,  # Expiring in 2 weeks! Flagged in compliance!
        "content": """MUTUAL NON-DISCLOSURE AGREEMENT (NDA)
Parties: DocMind AI Labs & TechFlow Systems Ltd.
Effective Date: March 25, 2025.
Expiration Date: March 25, 2026.

1. PURPOSE
The parties wish to explore a strategic collaboration regarding Model Context Protocol (MCP) server federation and enterprise document indexing.

2. CONFIDENTIAL INFORMATION
"Confidential Information" encompasses proprietary source code, vector embedding strategies, customer metadata, and technical schematics.

3. TERM AND EXPIRATION
This Agreement expires on March 25, 2026. Upon expiration, all proprietary information must be returned or certified destroyed within 10 business days.

4. GOVERNING LAW
This agreement is governed by the laws of the State of Delaware.

SIGNATURES:
Signed by: Marcus Vance, CEO, TechFlow Systems Ltd.
Signed by: Sarah Lin, Head of Legal, DocMind AI
/s/ Marcus Vance
/s/ Sarah Lin
"""
    },
    {
        "filename": "Cloud_Infrastructure_SLA_ApexSystems.txt",
        "category": "Technical",
        "folder": "/Engineering",
        "has_signature": True,
        "days_to_expire": 500,
        "content": """SERVICE LEVEL AGREEMENT (SLA) — CLOUD RUNTIME
Vendor: Apex Cloud Infrastructure Ltd.
Client: DocMind Enterprise

1. AVAILABILITY COMMITMENT
Apex guarantees an Monthly Uptime Percentage of at least 99.95% for compute instances, vector search clusters, and database endpoints.

2. PENALTIES & SERVICE CREDITS
- Uptime < 99.95% but >= 99.0%: 10% Service Credit.
- Uptime < 99.0% but >= 95.0%: 25% Service Credit.
- Uptime < 95.0%: 50% Service Credit applied to next billing cycle.

3. INCIDENT RESPONSE TIERS
- Severity 1 (Critical Outage): Initial response within 15 minutes. 24/7 engineering escalation.
- Severity 2 (Major Degradation): Initial response within 1 hour.
- Severity 3 (Minor Ticket): Initial response within 8 business hours.

4. BACKUP & DISASTER RECOVERY
Automated snapshot backups every 6 hours with Recovery Point Objective (RPO) of 6 hours and Recovery Time Objective (RTO) of 1 hour.

SIGNATURES:
Authorized Signatory: David Kim, Chief Infrastructure Officer, Apex Systems
/s/ David Kim
"""
    },
    {
        "filename": "Information_Security_Policy_2026.txt",
        "category": "Policy",
        "folder": "/Policies",
        "has_signature": False,  # Missing signature! Flagged in compliance!
        "days_to_expire": 300,
        "content": """GLOBAL INFORMATION SECURITY & GOVERNANCE POLICY
Document Reference: POL-SEC-2026-V1
Classification: Confidential — Internal Enterprise Only

1. OBJECTIVE & MANDATE
Establish comprehensive baseline controls for access to document repositories, API keys, Model Context Protocol endpoints, and database clusters.

2. ACCESS CONTROL & ROLE-BASED ACCESS (RBAC)
- Admin: Full administrative rights, document deletion, and audit ledger clearance.
- Editor: Document upload, metadata modifications, categorization, and folder moves.
- Viewer: Read-only access, semantic queries, summaries, and comparison analysis.

3. ENCRYPTION AT REST AND IN TRANSIT
All metadata stores and document blobs must be encrypted using TLS 1.3 in transit and AES-256 at rest. Zero unencrypted credentials permitted in environment repositories.

4. COMPLIANCE AUDITING
Quarterly compliance scans must verify signature verification, certificate expiration, and contract lifecycle status.

STATUS: DRAFT AWAITING EXECUTIVE SIGN-OFF
Authorized Signatory: [PENDING SIGNATURE — CISO OFFICE]
"""
    },
    {
        "filename": "Q3_Enterprise_Software_License_Invoice.txt",
        "category": "Invoice",
        "folder": "/Finance",
        "has_signature": True,
        "days_to_expire": 30,
        "content": """INVOICE: INV-2026-0891
Vendor: Datastream Systems International
Bill To: DocMind Enterprise Finance Dept.
Date of Issue: February 10, 2026
Due Date: March 12, 2026

ITEMIZED CHARGES:
1. Enterprise ChromaDB Vector Cluster (Q3 License): $18,500.00
2. MCP Gateway Proxy Bandwidth (10M requests): $4,200.00
3. Dedicated Claude Agent Ingestion Workers (5 Nodes): $15,300.00
4. Support & Maintenance (Net-30 Tier): $2,000.00

SUBTOTAL: $40,000.00
TAX (8.25%): $3,300.00
TOTAL AMOUNT DUE: $43,300.00

Payment Remittance: Wire transfer to Wells Fargo Account #98234-1029, Routing #121000358.
Authorized by: Billing Dept, Datastream Systems
/s/ Datastream Financial Ops
"""
    },
    {
        "filename": "Senior_ML_Architect_Employment_Agreement.txt",
        "category": "HR",
        "folder": "/HR",
        "has_signature": False,  # Missing signature! Flagged in compliance!
        "days_to_expire": None,
        "content": """EMPLOYMENT AGREEMENT
Between: DocMind AI Inc. and Candidate: Dr. Julian Sterling
Position: Principal Machine Learning Architect

1. COMMENCEMENT & DUTIES
Employee shall serve as Principal Architect leading MCP agent tooling, retrieval augmented generation, and vector database scaling.

2. COMPENSATION & BENEFITS
- Base Salary: $240,000 per annum, payable semi-monthly.
- Equity Grant: 50,000 Stock Options vesting over 4 years with a 1-year cliff.
- Paid Time Off (PTO): 25 days annual leave plus standard statutory holidays.

3. INTELLECTUAL PROPERTY ASSIGNMENT
All inventions, model architectures, tool wrappers, and code authored during employment shall belong exclusively to DocMind AI Inc.

4. NON-SOLICITATION
For twelve (12) months following termination, employee shall not directly solicit clients or coworkers.

STATUS: OFFER ISSUED — AWAITING CANDIDATE COUNTER-SIGNATURE
Signed by: HR Operations Director
Candidate Signature: [UNSIGNED — AWAITING COUNTER-SIGNATURE]
"""
    }
]

def seed_database():
    init_db()
    db = SessionLocal()
    try:
        # 1. Create Default Users with different RBAC roles
        users_to_create = [
            ("admin", "admin@docmind.ai", "admin123", "admin"),
            ("editor", "editor@docmind.ai", "editor123", "editor"),
            ("viewer", "viewer@docmind.ai", "viewer123", "viewer"),
        ]
        created_users = {}
        for username, email, pwd, role in users_to_create:
            existing = db.query(User).filter(User.username == username).first()
            if not existing:
                u = User(
                    username=username,
                    email=email,
                    hashed_password=get_password_hash(pwd),
                    role=role
                )
                db.add(u)
                db.commit()
                db.refresh(u)
                created_users[role] = u
                print(f"Created user: {username} ({role})")
            else:
                created_users[role] = existing

        admin_user = created_users.get("admin")

        # 2. Seed Sample Documents
        storage_dir = Path(settings.STORAGE_PATH)
        storage_dir.mkdir(parents=True, exist_ok=True)

        for item in SAMPLE_DOCUMENTS:
            existing_doc = db.query(Document).filter(Document.title == item["filename"]).first()
            if existing_doc:
                print(f"Document '{item['filename']}' already exists. Skipping.")
                continue

            # Write file to storage
            file_path = storage_dir / item["filename"]
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(item["content"])

            file_size = os.path.getsize(file_path)
            doc_id = str(uuid.uuid4())

            # Chunks & Vector Store
            chunks = chunk_text(item["content"], chunk_size=settings.CHUNK_SIZE, overlap=settings.CHUNK_OVERLAP)
            chunk_metas = [{"title": item["filename"], "category": item["category"], "folder_path": item["folder"]} for _ in chunks]
            vector_store.add_chunks(doc_id=doc_id, chunks=chunks, metadatas=chunk_metas)

            # Metadata heuristics
            heuristics = extract_metadata_heuristics(item["content"])
            expiration_date = None
            if item.get("days_to_expire") is not None:
                expiration_date = datetime.utcnow() + timedelta(days=item["days_to_expire"])
            elif heuristics["expiration_date"]:
                expiration_date = heuristics["expiration_date"]

            has_signature = item.get("has_signature", heuristics["has_signature"])

            new_doc = Document(
                id=doc_id,
                title=item["filename"],
                file_path=str(file_path),
                file_size=file_size,
                mime_type="text/plain",
                category=item["category"],
                folder_path=item["folder"],
                tags=heuristics["tags"],
                expiration_date=expiration_date,
                has_signature=has_signature,
                content_text=item["content"],
                owner_id=admin_user.id if admin_user else None
            )
            db.add(new_doc)

            # Version 1
            ver = DocumentVersion(
                doc_id=doc_id,
                version_num=1,
                file_path=str(file_path),
                summary_diff="Initial ingestion and auto-classification",
                created_by="system-seed"
            )
            db.add(ver)

            # Audit log entry for seeding
            audit = AuditLog(
                user_id=admin_user.id if admin_user else None,
                user_name="system-seed",
                user_role="admin",
                tool_name="upload_document",
                input_payload={"filename": item["filename"], "folder": item["folder"]},
                output_payload={"doc_id": doc_id, "category": item["category"], "chunks": len(chunks)},
                status="SUCCESS",
                diff_summary=f"Seeded document '{item['filename']}' into {item['folder']}"
            )
            db.add(audit)

            print(f"Seeded: {item['filename']} -> {item['category']} ({len(chunks)} chunks, Signature: {has_signature})")

        db.commit()
        print("Database seeding completed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
