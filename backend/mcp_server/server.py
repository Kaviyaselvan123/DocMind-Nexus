import json
import asyncio
from typing import Any, Dict, List
from sqlalchemy.orm import Session

from backend.mcp_server import tools as mcp_tools
from backend.db.session import SessionLocal

MCP_TOOL_DEFINITIONS = [
    {
        "name": "search_documents",
        "description": "Searches document library using hybrid vector semantic search and metadata filters. Returns ranked results with snippets and relevance scores.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query or natural language description"},
                "filters": {
                    "type": "object",
                    "properties": {
                        "type": {"type": "string", "description": "Document category (e.g. Contract, Financial, Policy, HR, Technical)"},
                        "owner": {"type": "string", "description": "Owner username"},
                        "tags": {"type": "array", "items": {"type": "string"}, "description": "List of tags to filter by"},
                        "folder": {"type": "string", "description": "Folder path prefix (e.g. /Contracts)"}
                    }
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "get_document",
        "description": "Retrieves the complete text content and metadata of a specific document by its doc_id.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "doc_id": {"type": "string", "description": "Unique document identifier"}
            },
            "required": ["doc_id"]
        }
    },
    {
        "name": "summarize_document",
        "description": "Generates a structured summary of a document, optionally tailored to a specific focus area (e.g. 'risks', 'payment terms', 'compliance dates').",
        "inputSchema": {
            "type": "object",
            "properties": {
                "doc_id": {"type": "string", "description": "Unique document identifier"},
                "focus": {"type": "string", "description": "Optional focus area (e.g. 'risks', 'termination', 'payment terms')"}
            },
            "required": ["doc_id"]
        }
    },
    {
        "name": "classify_document",
        "description": "Analyzes document content and returns predicted category (Contract, Financial, Policy, HR, etc.) and confidence score.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "doc_id": {"type": "string", "description": "Unique document identifier"}
            },
            "required": ["doc_id"]
        }
    },
    {
        "name": "update_metadata",
        "description": "Updates document metadata fields (e.g. title, category, tags, expiration_date, has_signature). Requires editor/admin role.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "doc_id": {"type": "string", "description": "Unique document identifier"},
                "fields": {"type": "object", "description": "Dictionary of fields to update (e.g. {'tags': ['Vendor', 'Q3'], 'category': 'Contract'})"}
            },
            "required": ["doc_id", "fields"]
        }
    },
    {
        "name": "list_folder",
        "description": "Returns the hierarchical tree structure and documents contained inside a folder path.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Folder path (e.g. '/' or '/Contracts')"}
            }
        }
    },
    {
        "name": "move_document",
        "description": "Moves a document to a new destination folder. Requires editor/admin role.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "doc_id": {"type": "string", "description": "Unique document identifier"},
                "destination_folder": {"type": "string", "description": "Target folder path (e.g. '/Archive' or '/Contracts/2026')"}
            },
            "required": ["doc_id", "destination_folder"]
        }
    },
    {
        "name": "delete_document",
        "description": "Performs a soft delete of a document and removes its vector embeddings. Requires admin role.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "doc_id": {"type": "string", "description": "Unique document identifier"}
            },
            "required": ["doc_id"]
        }
    },
    {
        "name": "compare_documents",
        "description": "Performs cross-document comparative analysis between multiple documents based on specified criteria (e.g. payment terms, liability, SLA).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "doc_ids": {"type": "array", "items": {"type": "string"}, "description": "List of doc_ids to compare"},
                "criteria": {"type": "string", "description": "Comparison criteria or clauses to evaluate"}
            },
            "required": ["doc_ids"]
        }
    },
    {
        "name": "get_audit_log",
        "description": "Retrieves the immutable audit ledger of AI tool executions with inputs, outputs, caller role, and diff summaries.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "filters": {"type": "object", "description": "Optional filters: {'tool_name': '...', 'status': '...', 'user_name': '...'}"},
                "limit": {"type": "integer", "description": "Max entries to return (default 50)"}
            }
        }
    },
    {
        "name": "flag_compliance_issues",
        "description": "Scans document library for compliance anomalies such as expiring contracts, missing signatures, or untagged policies.",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    }
]

def execute_tool(
    tool_name: str,
    arguments: Dict[str, Any],
    db: Session,
    user_role: str = "viewer",
    user_name: str = "agent",
    user_id: str = None
) -> Dict[str, Any]:
    """Central dispatcher for tool execution with role enforcement and database context."""
    if tool_name == "search_documents":
        return mcp_tools.search_documents(
            db,
            query=arguments.get("query", ""),
            filters=arguments.get("filters"),
            user_role=user_role,
            user_name=user_name,
            user_id=user_id
        )
    elif tool_name == "get_document":
        return mcp_tools.get_document(
            db,
            doc_id=arguments.get("doc_id", ""),
            user_role=user_role,
            user_name=user_name,
            user_id=user_id
        )
    elif tool_name == "summarize_document":
        return mcp_tools.summarize_document(
            db,
            doc_id=arguments.get("doc_id", ""),
            focus=arguments.get("focus"),
            user_role=user_role,
            user_name=user_name,
            user_id=user_id
        )
    elif tool_name == "classify_document":
        return mcp_tools.classify_document(
            db,
            doc_id=arguments.get("doc_id", ""),
            user_role=user_role,
            user_name=user_name,
            user_id=user_id
        )
    elif tool_name == "update_metadata":
        return mcp_tools.update_metadata(
            db,
            doc_id=arguments.get("doc_id", ""),
            fields=arguments.get("fields", {}),
            user_role=user_role,
            user_name=user_name,
            user_id=user_id
        )
    elif tool_name == "list_folder":
        return mcp_tools.list_folder(
            db,
            path=arguments.get("path", "/"),
            user_role=user_role,
            user_name=user_name,
            user_id=user_id
        )
    elif tool_name == "move_document":
        return mcp_tools.move_document(
            db,
            doc_id=arguments.get("doc_id", ""),
            destination_folder=arguments.get("destination_folder", "/"),
            user_role=user_role,
            user_name=user_name,
            user_id=user_id
        )
    elif tool_name == "delete_document":
        return mcp_tools.delete_document(
            db,
            doc_id=arguments.get("doc_id", ""),
            user_role=user_role,
            user_name=user_name,
            user_id=user_id
        )
    elif tool_name == "compare_documents":
        return mcp_tools.compare_documents(
            db,
            doc_ids=arguments.get("doc_ids", []),
            criteria=arguments.get("criteria", "payment terms, liability, and duration"),
            user_role=user_role,
            user_name=user_name,
            user_id=user_id
        )
    elif tool_name == "get_audit_log":
        return mcp_tools.get_audit_log(
            db,
            filters=arguments.get("filters"),
            limit=arguments.get("limit", 50),
            user_role=user_role,
            user_name=user_name,
            user_id=user_id
        )
    elif tool_name == "flag_compliance_issues":
        return mcp_tools.flag_compliance_issues(
            db,
            user_role=user_role,
            user_name=user_name,
            user_id=user_id
        )
    else:
        return {"error": f"Unknown MCP tool: '{tool_name}'"}
