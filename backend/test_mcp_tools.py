import sys
import unittest
from backend.db.session import SessionLocal, init_db
from backend.db.models import Document, AuditLog
from backend.mcp_server.server import execute_tool
from backend.seed import seed_database

class TestMCPTools(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        seed_database()

    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_01_search_documents(self):
        res = execute_tool("search_documents", {"query": "payment terms and invoice"}, self.db, user_role="viewer")
        self.assertIn("documents", res)
        self.assertGreater(res["count"], 0)
        print(f"PASS: search_documents found {res['count']} results")

    def test_02_get_document(self):
        doc = self.db.query(Document).filter(Document.is_deleted == False).first()
        self.assertIsNotNone(doc)
        res = execute_tool("get_document", {"doc_id": doc.id}, self.db, user_role="viewer")
        self.assertEqual(res.get("doc_id"), doc.id)
        self.assertIn("full_text", res)
        print(f"PASS: get_document retrieved '{res.get('title')}'")

    def test_03_summarize_document(self):
        doc = self.db.query(Document).filter(Document.category == "Contract", Document.is_deleted == False).first()
        res = execute_tool("summarize_document", {"doc_id": doc.id, "focus": "liability"}, self.db, user_role="viewer")
        self.assertIn("structured_summary", res)
        print(f"PASS: summarize_document on '{doc.title}' with focus 'liability'")

    def test_04_classify_document(self):
        doc = self.db.query(Document).filter(Document.is_deleted == False).first()
        res = execute_tool("classify_document", {"doc_id": doc.id}, self.db, user_role="viewer")
        self.assertIn("predicted_category", res)
        print(f"PASS: classify_document predicted category '{res.get('predicted_category')}' (conf: {res.get('confidence_score')})")

    def test_05_update_metadata_editor(self):
        doc = self.db.query(Document).filter(Document.is_deleted == False).first()
        res = execute_tool("update_metadata", {"doc_id": doc.id, "fields": {"tags": ["TestTag", "Verified"]}}, self.db, user_role="editor")
        self.assertEqual(res.get("status"), "updated")
        print(f"PASS: update_metadata succeeded with editor role")

    def test_06_update_metadata_viewer_denied(self):
        doc = self.db.query(Document).filter(Document.is_deleted == False).first()
        res = execute_tool("update_metadata", {"doc_id": doc.id, "fields": {"tags": ["Illegal"]}}, self.db, user_role="viewer")
        self.assertIn("error", res)
        print(f"PASS: update_metadata correctly denied for viewer role")

    def test_07_list_folder(self):
        res = execute_tool("list_folder", {"path": "/"}, self.db, user_role="viewer")
        self.assertIn("subfolders", res)
        print(f"PASS: list_folder returned subfolders: {res['subfolders']}")

    def test_08_move_document(self):
        doc = self.db.query(Document).filter(Document.is_deleted == False).first()
        orig_folder = doc.folder_path
        res = execute_tool("move_document", {"doc_id": doc.id, "destination_folder": "/Archive"}, self.db, user_role="editor")
        self.assertEqual(res.get("status"), "moved")
        # Move it back
        execute_tool("move_document", {"doc_id": doc.id, "destination_folder": orig_folder}, self.db, user_role="editor")
        print(f"PASS: move_document moved document to '/Archive' and back")

    def test_09_delete_document_rbac(self):
        doc = self.db.query(Document).filter(Document.is_deleted == False).first()
        # Viewer denied
        res_viewer = execute_tool("delete_document", {"doc_id": doc.id}, self.db, user_role="viewer")
        self.assertIn("error", res_viewer)
        # Editor denied (only admin deletes)
        res_editor = execute_tool("delete_document", {"doc_id": doc.id}, self.db, user_role="editor")
        self.assertIn("error", res_editor)
        print(f"PASS: delete_document successfully denied for viewer and editor")

    def test_10_compare_documents(self):
        docs = self.db.query(Document).filter(Document.is_deleted == False).limit(2).all()
        doc_ids = [d.id for d in docs]
        res = execute_tool("compare_documents", {"doc_ids": doc_ids, "criteria": "payment terms"}, self.db, user_role="viewer")
        self.assertIn("matrix", res)
        print(f"PASS: compare_documents generated matrix for {res.get('documents_compared')} docs")

    def test_11_get_audit_log(self):
        res = execute_tool("get_audit_log", {"limit": 10}, self.db, user_role="viewer")
        self.assertIn("logs", res)
        self.assertGreater(res["count"], 0)
        print(f"PASS: get_audit_log retrieved {res['count']} audit logs")

    def test_12_flag_compliance_issues(self):
        res = execute_tool("flag_compliance_issues", {}, self.db, user_role="viewer")
        self.assertIn("issues", res)
        self.assertGreater(res.get("flagged_issues_count", 0), 0)
        print(f"PASS: flag_compliance_issues identified {res['flagged_issues_count']} compliance alerts")

if __name__ == "__main__":
    unittest.main()
