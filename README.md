# DocMind Nexus — Enterprise Document Intelligence & Governance Platform
> Powered by Model Context Protocol (MCP) • Hybrid ChromaDB Vector Pipeline • Strict RBAC Security Guardrails

**DocMind Nexus** is an autonomous enterprise document operations and governance platform. Rather than relying on static CRUD interfaces or generic conversational AI wrappers, DocMind Nexus exposes an autonomous intelligence engine backed by **11 standardized Model Context Protocol (MCP) tools**. All document mutations, semantic analyses, multi-clause contract comparisons, and risk classifications are dispatched through structured JSON-RPC tool protocols with strict role-based access control (RBAC) and immutable forensic audit logging.

Built with an engineered **High-Tech Industrial Design System** (Obsidian Titanium `#0A0C0E` / Porcelain Slate `#F8F9FA` with Industrial Amber Gold `#D97706` and Cyber Emerald `#059669` — strictly zero blue, zero violet, zero purple), DocMind Nexus provides a mission-critical operations deck for high-density document intelligence.

---

## 🏛 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  DOCMIND NEXUS CLIENT                                   │
│                        (React 19 • Vite • TypeScript • Tailwind CSS)                    │
│                                                                                         │
│  ┌───────────────────────┬───────────────────────┬───────────────────────────────────┐  │
│  │  Enterprise Sidebar   │  Navbar & Telemetry   │   Document Inspector Drawer       │  │
│  │  - Workspace Nav Rail │  - 11 Tools Status    │   - Full Clause Text & Line Num   │  │
│  │  - Live RBAC Switcher │  - ChromaDB Status    │   - SHA-256 Checksum & Versions   │  │
│  │  - System Diagnostics │  - Quick Ingest Modal │   - Vector & Raw JSON Schema      │  │
│  └───────────────────────┴───────────────────────┴───────────────────────────────────┘  │
│                                            │                                            │
│        ┌───────────────────────────────────┴───────────────────────────────────┐        │
│        ▼                                                                       ▼        │
│  [Intelligence Console]     [Document Matrix]     [Audit Ledger]     [Compliance Radar] │
│  - MCP Tool Arsenal (11)    - Directory Tree      - Forensic Stream  - 90-Day Expiries  │
│  - Execution DAG Pipeline   - Category Filters    - Success Rate Bar - Signature Checks │
│  - Interactive Cards        - Multi-format Ingest - Diff Inspector   - Automated Scan   │
└────────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             HTTP REST API (FastAPI)                     WebSocket Pipeline (/ws/chat)
             - Document CRUD & Parsing                   - Bidirectional Agent Streaming
             - Auth & JWT Verification                   - Live Stage Status Events
             - Forensic Audit Endpoints                  - Tool Dispatch & Synthesis
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                      ┌─────────────────────────────────────────────┐
                      │             MCP PROTOCOL CORE               │
                      │          (11 Standardized Tools)            │
                      │   - Parameter Schema Validation             │
                      │   - Context-Aware Role Authorization        │
                      │   - Immutable Forensic Ledger Logging       │
                      └──────────────────────┬──────────────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    ▼                        ▼                        ▼
         SQL Database (SQLite)     Vector Store (ChromaDB)       Local Vault Storage
         - Documents & Metadata    - 384-Dim Chunk Embeddings    - Raw PDF, DOCX, TXT
         - Version History Diff    - Cosine Semantic Search      - Normalized Text Store
         - Forensic Audit Ledger   - Clause Retrieval            - Document Artifacts
         - User Credentials & RBAC
```

---

## 🛠 Standard Model Context Protocol (MCP) Tool Arsenal

DocMind Nexus implements 11 standardized MCP tools adhering to the Model Context Protocol specification:

| # | Tool Name | Parameters | Clearance | Forensic Action | Description |
|---|---|---|---|---|---|
| **1** | `search_documents` | `query: str`, `filters: dict`, `limit: int` | `Viewer+` | Read-only | Hybrid semantic vector search + metadata filtering via ChromaDB. |
| **2** | `get_document` | `doc_id: str` | `Viewer+` | Read-only | Retrieves full text content, metadata, version history, and compliance status. |
| **3** | `summarize_document` | `doc_id: str`, `focus: str` | `Viewer+` | Read-only | Parameter-conditioned extraction (e.g., payment terms, liabilities, termination). |
| **4** | `classify_document` | `doc_id: str` | `Editor+` | Mutation | Analyzes clause patterns and assigns categories with confidence scores. |
| **5** | `update_metadata` | `doc_id: str`, `fields: dict` | `Editor+` | Mutation | Updates tags, folder paths, and metadata attributes with version increment. |
| **6** | `list_folder` | `folder_path: str` | `Viewer+` | Read-only | Hierarchical tree navigation across archival repository directories. |
| **7** | `move_document` | `doc_id: str`, `destination_folder: str` | `Editor+` | Mutation | Relocates document to a new directory hierarchy and logs state diff. |
| **8** | `delete_document` | `doc_id: str` | `Admin` | Destructive | Soft-deletes document, purges vector index entries, and records security audit. |
| **9** | `compare_documents` | `doc_ids: list`, `criteria: str` | `Viewer+` | Read-only | Cross-document clause evaluation matrix (compares MSA, SLA, NDA side-by-side). |
| **10** | `get_audit_log` | `limit: int`, `tool_name: str`, `status: str` | `Admin` | Read-only | Queries the immutable cryptographic execution audit trail with filter criteria. |
| **11** | `flag_compliance_issues` | *None* | `Viewer+` | Read-only | Audits all agreements for expirations (<90 days) and missing authorized signatures. |

---

## 💻 Core Platform Modules

### 1. Autonomous MCP Intelligence Console
- **Direct Command Deck**: Execute natural language commands or click curated presets (`Compare Vendor Contracts`, `Full Compliance Audit`, `Focused Clause Summary`, `RBAC Policy Check`).
- **MCP DAG Pipeline Execution Trace**: Shows multi-stage execution breakdowns (`compare_documents [2 arguments] ➔ 200 OK`) with expandable input arguments and raw output matrices.
- **Interactive Action Cards**: Direct citation cards rendered inline with quick-launch triggers to inspect documents in the sidebar drawer.

### 2. Enterprise Document Matrix & Vault
- **Directory Hierarchy**: Categorized navigation across `/Contracts`, `/Finance`, `/Policies`, `/Engineering`, and `/HR`.
- **Multi-Format Ingestion**: Ingests PDF, DOCX, and TXT files with text parsing, chunking, ChromaDB vector indexing, and automatic classification.
- **Category Matrix Badges**: Color-coded badges for Contract, Financial, Invoice, Policy, Technical, and HR documents.

### 3. Document & Telemetry Inspector Drawer
- **Multi-Tab Inspection**: View raw document text, metadata & security attributes, or vector JSON schemas.
- **Cryptographic Details**: Displays SHA-256 file checksums, version history counts, categorization confidence, and compliance notes.
- **Quick Controls**: One-click text copy, JSON export, and raw file download.

### 4. Audit & Governance Ledger
- **Forensic Execution History**: Immutable log of every tool execution, caller role, timestamp, parameters, and status (`SUCCESS` vs `DENIED`).
- **Interactive Analytics**: Real-time volume charts, success rates, RBAC denial counters, and 7-day activity trends.
- **State Diff Inspector**: Click any audit record to inspect the exact input payload, return matrix, and database state delta.

### 5. Compliance & Legal Risk Radar
- **Proactive Continuous Surveillance**: Automated APScheduler worker continuously monitors contract expirations and missing signatures.
- **Risk Severity Meter**: Categorizes vulnerabilities into **CRITICAL EXPOSURES** (expired contracts, missing signoffs) and **UPCOMING EXPIRATIONS** (<90 days).
- **One-Click Remediation**: Deep links directly into the Document Inspector for immediate legal review.

---

## 🔒 Role-Based Access Control (RBAC) Matrix

DocMind Nexus enforces strict RBAC at both the API layer and the MCP tool execution boundary:

| Operation / MCP Tool | Viewer (`viewer`) | Editor (`editor`) | Admin (`admin`) |
|---|:---:|:---:|:---:|
| Semantic Search & Summarization | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| Cross-Document Clause Diff | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| Compliance Risk Scan | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| Ingest Document (Upload) | ❌ Denied (`403`) | ✅ Allowed | ✅ Allowed |
| Update Metadata & Tags | ❌ Denied (`403`) | ✅ Allowed | ✅ Allowed |
| Move Folder Location | ❌ Denied (`403`) | ✅ Allowed | ✅ Allowed |
| Document Classification | ❌ Denied (`403`) | ✅ Allowed | ✅ Allowed |
| Soft-Delete Document | ❌ Denied (`403`) | ❌ Denied (`403`) | ✅ Allowed |
| Query Full Audit Ledger | ❌ Denied (`403`) | ❌ Denied (`403`) | ✅ Allowed |

### Default Credentials for Testing:
| Role | Username | Password | Context |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Full root access, document deletion, audit oversight |
| **Editor** | `editor` | `editor123` | Ingest, modify metadata, reorganize directories |
| **Viewer** | `viewer` | `viewer123` | Read-only semantic search, summarize, compare |

*(You can also toggle between roles instantly in the top navbar or sidebar to test live RBAC permission enforcement without re-logging).*

---

## 📂 Repository Layout

```
.
├── backend/
│   ├── api/                 # FastAPI routes (auth, documents, audit, chat websocket)
│   ├── auth/                # JWT security, password hashing, and RBAC middleware
│   ├── db/                  # SQLAlchemy models (Document, Version, AuditLog, User)
│   ├── ingestion/           # Document parser (PDF, DOCX, TXT), chunker & classifier
│   ├── mcp_server/          # Standard MCP server: 11 tool definitions & execution engine
│   ├── scheduler/           # APScheduler background worker for compliance scans
│   ├── storage/             # Local vault file storage
│   ├── vector_store/        # ChromaDB persistent vector repository & embeddings
│   ├── config.py            # System configuration & environment settings
│   ├── main.py              # Application entry point & lifespan manager
│   ├── seed.py              # Realistic sample dataset seeder (6 enterprise documents)
│   └── test_mcp_tools.py    # Comprehensive test suite for all 11 MCP tools
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AgentMarginChat.tsx         # Autonomous MCP Intelligence Console
│   │   │   ├── AuditDashboard.tsx          # Audit & Governance Ledger
│   │   │   ├── CompliancePanel.tsx         # Compliance & Legal Risk Radar
│   │   │   ├── DocumentInspectorDrawer.tsx # Document & Telemetry Inspector Drawer
│   │   │   ├── DocumentLibrary.tsx         # Enterprise Document Matrix & Vault
│   │   │   ├── EnterpriseSidebar.tsx       # Enterprise Navigation Rail & RBAC Switcher
│   │   │   ├── Navbar.tsx                  # Header bar with live telemetry ticker
│   │   │   └── UploadModal.tsx             # Enterprise Multi-Stage Ingestion Pipeline
│   │   ├── theme/
│   │   │   └── colors.tsx                  # Industrial Amber & Cyber Emerald design tokens
│   │   ├── types.ts                        # Unified TypeScript domain definitions
│   │   ├── App.tsx                         # Core application container
│   │   └── index.css                       # Enterprise Design System rules (Zero Blue/Violet)
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── DEMO_SCRIPT.md           # 5 Step-by-step viva presentation scenarios
└── README.md
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Python**: 3.11 or 3.12
- **Node.js**: 18+ and npm
- **OS**: Windows, macOS, or Linux

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Initialize & Seed Database

```bash
# Initializes SQLite database and seeds 6 realistic enterprise documents + 3 RBAC users
python -m backend.seed
```

### 3. Run Backend API Server

```bash
# Runs FastAPI + Uvicorn server on http://127.0.0.1:8000
python -m backend.main
```

### 4. Run Frontend Application

In a separate terminal:
```bash
# Navigate to frontend directory
cd frontend

# Install Node modules
npm install

# Start Vite development server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Automated Testing & Verification

### Run Backend MCP Unit Tests
To verify all 11 MCP tools, RBAC enforcement policies, and ChromaDB vector operations:
```bash
python -m unittest backend/test_mcp_tools.py
```
*(All 12 test suites will run and pass).*

### Verify Production Frontend Build
```bash
cd frontend
npm run build
```
*(Runs TypeScript strict check + Vite production bundle with 0 errors).*

### Verify Color Compliance Policy
To confirm the strict zero-blue/zero-violet design system constraint:
```bash
# Search for forbidden color keywords in the frontend source
grep -ri "blue\|violet\|purple\|indigo" frontend/src
```
*(Returns 0 matches — strict compliance verified).*

---

## 🎬 Viva & Demo Presentation

For an examiner walkthrough showcasing cross-document comparative analysis, proactive compliance detection, and RBAC mutation denial, refer to **[DEMO_SCRIPT.md](DEMO_SCRIPT.md)**.
