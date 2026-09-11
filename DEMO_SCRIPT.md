# DocMind Nexus — Project Review & Viva Demo Script
> 5 High-Impact Scenarios for Examiners & Technical Demonstrations

This script outlines 5 presentation scenarios to showcase the **Model Context Protocol (MCP)** autonomous engine, hybrid ChromaDB vector retrieval, live role-based access control (RBAC), proactive compliance surveillance, and cryptographically sealed audit ledger.

---

### Prerequisites Before Starting Demo
1. Ensure the backend is running: `python -m backend.main` on `http://127.0.0.1:8000`
2. Ensure the frontend is running: `npm run dev` in `/frontend` on `http://localhost:5173`
3. Open `http://localhost:5173` in your browser.
4. Point out the **DocMind Nexus High-Tech Industrial Design System**:
   - Notice the high-density enterprise command layout (Obsidian Titanium `#0A0C0E` / Porcelain Slate `#F8F9FA`).
   - Notice the Industrial Amber Gold (`#D97706`) and Cyber Emerald (`#059669`) execution indicators.
   - Point out the strict **zero-blue / zero-violet policy** and absence of generic chatbot fluff.

---

### Scenario 1: Multi-Contract Clause Reasoning & Comparison
* **Viva Value:** Proves multi-document synthesis and cross-clause evaluation using the standardized Model Context Protocol (MCP).
* **Navigation:** Click on **"Intelligence Console"** in the top navigation bar or left navigation rail.
* **Role to Select:** Any (`admin`, `editor`, or `viewer`).
* **Trigger:** Click the **"Vendor Contract Comparison"** preset card, or type:
  ```text
  Compare vendor contracts on payment terms, liability, and duration
  ```
* **Behind the Scenes:**
  - Intelligence Console dispatches MCP tool: `compare_documents(doc_ids=[...], criteria="payment terms, liability, and duration")`.
* **What to Showcase to the Examiner:**
  1. The multi-stage **MCP Execution Pipeline DAG Trace** (`compare_documents [2 arguments] ➔ 200 OK`).
  2. Expand the pipeline pill to inspect input arguments and raw JSON output matrix.
  3. Show the synthesized comparative analysis across `Master_Services_Agreement_AcmeCorp.txt`, `Mutual_NDA_TechFlow_AI.txt`, and `Cloud_Infrastructure_SLA_ApexSystems.txt`.
  4. Click the **"Inspect"** button on any of the document citation cards to slide open the **Document & Telemetry Inspector Drawer**.

---

### Scenario 2: Proactive Compliance Surveillance & Risk Radar
* **Viva Value:** Demonstrates automated background surveillance for contract expiration windows and missing authorized signatures.
* **Navigation:** Click the **"Compliance Radar"** tab in the navbar (notice the alert counter badge `[4]`).
* **Actions:**
  1. Point out the **"Critical Exposures"** and **"Upcoming Expirations"** KPI summary cards.
  2. Highlight `Mutual_NDA_TechFlow_AI.txt` flagged for imminent term expiration (<15 days).
  3. Highlight `Information_Security_Policy_2026.txt` flagged for missing authorized signature.
  4. Click **"Trigger Compliance Scan"** to demonstrate real-time background re-scanning across the archival corpus.
  5. Click **"Inspect Document"** on any flagged card to immediately view the contract in the Document Inspector.
* **Alternative Console Trigger:** In the Intelligence Console, click **"Full Compliance Audit"** or run:
  ```text
  Flag compliance issues: scan for expiring contracts and missing signatures
  ```

---

### Scenario 3: Parameter-Conditioned Clause Extraction
* **Viva Value:** Demonstrates focus-targeted clause extraction rather than generic text summarization.
* **Navigation:** Open the **Intelligence Console**.
* **Query to Send:**
  ```text
  Summarize Master_Services_Agreement_AcmeCorp.txt with focus on payment terms
  ```
* **Behind the Scenes:**
  - Engine executes MCP tool: `summarize_document(doc_id="...", focus="payment terms")`.
* **What to Showcase:**
  - The summary isolates Net-30 payment terms, 1.5% late interest penalties, and 15-day dispute windows, while omitting unrelated generic clauses.

---

### Scenario 4: Role-Based Access Control (RBAC) Mutation Denial
* **Viva Value:** Demonstrates strict permission-checked mutations and non-destructive enforcement at the MCP boundary.
* **Setup:**
  1. In the sidebar or top navbar, toggle the **RBAC Context Switcher** to **`viewer`** or **`editor`**.
  2. Notice the clearance badge reflects `READ_ONLY` or `WRITE_AUTH`.
* **Query to Send in Intelligence Console:**
  ```text
  Delete document Information_Security_Policy_2026.txt
  ```
* **What Happens:**
  - Intelligence Console invokes `delete_document(doc_id="...")`.
  - MCP tool validates caller role (`viewer` / `editor`) vs required clearance (`admin`).
  - Tool returns structured permission denial without modifying database or vector store:
    *"Action Denied: Permission Denied: Role 'viewer' is not permitted to delete documents. Requires 'admin' privileges."*
  - The security violation is committed to the immutable audit ledger.
* **Now Switch to `admin` Role:**
  - Switch the role to **`admin`**.
  - Administrative deletion actions now succeed, record state diffs, and soft-delete safely.

---

### Scenario 5: Cryptographically Sealed Audit Ledger & Forensics
* **Viva Value:** Demonstrates enterprise-grade auditability — every AI action is logged with actor, role, parameters, and before/after diffs.
* **Navigation:** Click on **"Audit Ledger"** in the top navigation bar.
* **What to Showcase:**
  1. The **MCP Tool Execution Volume** bar chart in industrial amber.
  2. The **7-Day Activity Trend** area chart in cyber emerald.
  3. The **Forensic Ledger Table**: Show the log of the denied deletion attempt from Scenario 4 marked as `[DENIED]` in red.
  4. Click **"Inspect"** (eye icon) on any record to view the raw JSON parameters, output payload, and database state delta.
