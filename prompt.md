# PROJECT BUILD PROMPT — for Google Antigravity

Copy everything below into Antigravity as your project prompt.

---

## PROJECT TITLE
**DocMind AI — Intelligent Document Management System powered by Model Context Protocol (MCP)**

## ROLE / INSTRUCTION TO THE AGENT
Act as a senior full-stack AI engineer. Build a complete, production-quality **AI Document Management System** where an LLM agent manages documents (upload, search, summarize, classify, organize, update, delete) through **MCP tools**, not a traditional CRUD-only UI. The system must be fully functional end-to-end: ingestion pipeline, MCP server with real tools, backend APIs, database, vector search, and a distinctive themed frontend. Build it in phases and explain each phase briefly before generating code.

---

## 1. PROJECT OVERVIEW
DocMind AI lets users upload documents (PDF, DOCX, scanned images) and interact with their entire document library conversationally — "find," "summarize," "compare," "tag," "flag expiring contracts," "reorganize into folders" — through an AI agent that calls standardized MCP tools against the backend. Every AI action (search, edit, delete, move) is executed through an MCP Server, logged for audit, and permission-checked.

**Core differentiators to build in:**
- Cross-document reasoning ("compare these 3 vendor contracts on payment terms")
- Proactive compliance agent (auto-flags expiring/missing-signature docs on a schedule)
- Full audit trail dashboard (every AI tool call visualized: who asked, what tool ran, what changed)
- Role-based AI responses (same query → different results based on user's access level)
- Version history with AI-generated diff summaries between document versions

---

## 2. TECH STACK (use exactly this unless a better fit is justified)
| Layer | Technology |
|---|---|
| MCP Server | Python MCP SDK (`mcp` package), JSON-RPC over stdio/SSE |
| MCP Client / Agent orchestration | Claude API (Anthropic), LangChain for chaining if needed |
| Backend API | FastAPI (Python) |
| Vector DB | ChromaDB (local, free, embeddable) |
| Metadata DB | PostgreSQL (SQLAlchemy ORM) |
| File Storage | Local filesystem abstraction (swappable to S3 later) |
| OCR / Parsing | PyMuPDF (text PDFs), Tesseract OCR (scanned docs), python-docx |
| Auth | JWT-based, role field in user table (admin / editor / viewer) |
| Frontend | React + TypeScript + Tailwind CSS |
| Charts/audit visualizations | Recharts |
| Realtime chat interface | WebSocket connection between frontend and backend agent endpoint |

---

## 3. MCP SERVER — TOOLS TO IMPLEMENT (exact tool contracts)
Build these as real MCP tools with proper JSON schemas, not mocked:

1. `search_documents(query: str, filters: {type, owner, date_range, tags})` → returns ranked list with snippet + relevance score
2. `get_document(doc_id: str)` → full text + metadata
3. `summarize_document(doc_id: str, focus: Optional[str])` → structured summary; `focus` allows "risks," "dates," "payment terms," etc.
4. `classify_document(doc_id: str)` → returns predicted category + confidence score
5. `update_metadata(doc_id: str, fields: dict)` → permission-checked write
6. `list_folder(path: str)` → tree structure
7. `move_document(doc_id: str, destination_folder: str)`
8. `delete_document(doc_id: str)` → soft delete, permission-checked, logged
9. `compare_documents(doc_ids: List[str], criteria: str)` → cross-document reasoning output
10. `get_audit_log(filters)` → returns tool-call history for the dashboard
11. `flag_compliance_issues()` → scheduled/on-demand scan for expiring dates, missing signatures

Each tool must: validate input schema → check caller's role/permission → execute against DB/storage/vector index → write an audit log entry → return structured JSON.

---

## 4. ARCHITECTURE (build to this structure)
```
User (Chat UI) → MCP Client (Claude agent, decides which tool(s) to call)
              → MCP Server (exposes the 11 tools above)
                   → Vector Store (ChromaDB) — semantic search/embeddings
                   → Metadata DB (PostgreSQL) — tags, owner, ACL, dates, versions
                   → File Storage — raw documents
              → Ingestion Pipeline (OCR → parse → chunk → embed → auto-classify → store)
              → Audit Log Store — every tool call, actor, timestamp, before/after diff
```
Backend folder structure to generate:
```
/backend
  /mcp_server        → tool definitions, schemas, server entrypoint
  /api                → FastAPI routes (auth, chat endpoint, document CRUD fallback)
  /ingestion           → OCR, parsing, chunking, embedding pipeline
  /db                  → SQLAlchemy models, migrations
  /vector_store        → ChromaDB wrapper
  /auth                → JWT, role middleware
  /audit               → logging middleware, log models
/frontend
  /src/components       → Chat UI, Document Library grid, Audit Dashboard, Upload flow
  /src/theme             → design tokens (see Section 6)
```

---

## 5. WORKFLOWS TO IMPLEMENT

**A. Ingestion workflow**
Upload → detect file type → OCR if scanned → extract text → chunk (~500 tokens) → generate embeddings → store vectors in ChromaDB → store metadata in Postgres → auto-classify via `classify_document` → show status live in UI (progress states: Uploading → Parsing → Embedding → Classified → Ready)

**B. Conversational query workflow**
User types in chat → sent to backend agent endpoint → Claude (MCP client) selects & calls tool(s) → results streamed back over WebSocket → rendered as chat bubbles + inline document cards (not just plain text)

**C. Action/write workflow**
User asks for a mutation (rename, move, delete, tag) → agent calls the relevant tool → role check → if permitted, executes + logs; if not, agent responds with a clear denial + reason, no destructive action taken

**D. Compliance monitoring workflow**
Background scheduler (APScheduler) runs `flag_compliance_issues()` daily → results pushed to a notifications panel in the UI

**E. Audit workflow**
Every tool call → structured log entry {timestamp, user, tool, input, output, before/after diff} → visualized in a dedicated Audit Dashboard page with filters and a timeline chart

---

## 6. UI / UX — THEME SPECIFICATION (explicit: do NOT use blue, violet, indigo, or purple anywhere)

**Theme name:** "Archive Warm" — an editorial, paper-and-ink inspired aesthetic instead of the generic SaaS blue/violet look.

**Palette:**
- Background (light mode): `#FAF6EF` (warm ivory paper)
- Background (dark mode): `#1E1B16` (deep espresso charcoal)
- Primary accent: `#B5551E` (burnt terracotta / rust — used for primary buttons, active states)
- Secondary accent: `#4A6B4D` (deep moss green — used for success states, tags)
- Warning/compliance-flag color: `#C99A3A` (aged brass/amber)
- Danger: `#9C3B3B` (brick red, not neon)
- Text primary: `#2B2620` (near-black warm brown, light mode) / `#F1EBDD` (dark mode)
- Borders/dividers: `#D8CFBF` (light) / `#3A342B` (dark)
- Card surfaces: subtle off-white `#F3EEE3` with a thin 1px rust-tinted border, soft paper-grain texture via CSS noise overlay (very subtle, low opacity)

**Typography:**
- Headings: a serif font (e.g., "Fraunces" or "Lora") — gives it an editorial, archival document feel
- Body/UI: a clean sans-serif (e.g., "Inter" or "IBM Plex Sans")
- Monospace (for audit log/JSON views): "IBM Plex Mono"

**Visual language:**
- Rounded corners kept small (4–6px) — favor a structured, document/ledger feel over "bubbly SaaS" look
- Icons: line-style, not filled, in ink-brown or rust tones
- Document cards styled like index cards / folder tabs
- Chat interface styled like an annotated margin/notebook rather than a generic messenger bubble UI
- Audit dashboard uses a timeline/ledger visual metaphor (like a receipt log), charts in terracotta/moss/amber only
- Dark mode should feel like a "reading room at night" — warm charcoal, not cold slate/navy

**Explicitly avoid:** blue, violet, indigo, purple, cyan, or any default Tailwind `blue-*`/`indigo-*`/`violet-*` classes. Also avoid glassmorphism/neon glow effects — keep it grounded, tactile, paper-like.

---

## 7. BUILD PHASES (ask the agent to proceed in this order)
1. Scaffold backend (FastAPI + Postgres + Chroma) and DB models
2. Build ingestion pipeline (OCR/parsing/chunking/embedding)
3. Build MCP server with all 11 tools, test each independently
4. Wire Claude as MCP client via a `/chat` WebSocket endpoint
5. Build frontend shell with the Archive Warm theme (design tokens first, then components)
6. Build Document Library, Chat UI, Upload flow
7. Build Audit Dashboard + Compliance notifications panel
8. Add auth + role-based permission checks across all tools
9. Write README with setup instructions, `.env.example`, and architecture diagram

---

## 8. DELIVERABLES EXPECTED FROM ANTIGRAVITY
- Full working repo (backend + frontend)
- Seed script with 5–10 sample documents for demo
- README with architecture diagram and setup steps
- A short DEMO_SCRIPT.md listing 5 sample chat queries to showcase during a project review/viva
