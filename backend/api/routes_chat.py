import json
import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
import anthropic

from backend.config import settings
from backend.db.session import SessionLocal
from backend.db.models import Document, User
from backend.mcp_server.server import MCP_TOOL_DEFINITIONS, execute_tool

logger = logging.getLogger(__name__)
router = APIRouter()

def intelligent_local_agent(
    prompt: str,
    db: Session,
    user_role: str = "viewer",
    user_name: str = "agent",
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """Intelligent fallback agent when Claude API key is not configured or in offline demo mode.
    Accurately maps intent to MCP tools, executes them with permissions, and synthesizes answers.
    """
    lower = prompt.lower().strip()
    tool_calls_executed = []
    final_text = ""
    cards = []

    # 1. Flag compliance issues / audit check
    if any(k in lower for k in ["compliance", "expiring", "expired", "missing signature", "flag issue"]):
        tool_name = "flag_compliance_issues"
        args = {}
        res = execute_tool(tool_name, args, db, user_role, user_name, user_id)
        tool_calls_executed.append({"tool": tool_name, "args": args, "result": res})
        
        count = res.get("flagged_issues_count", 0)
        issues = res.get("issues", [])
        final_text = f"### Compliance Audit Report\n\nScanned **{res.get('total_documents_scanned', 0)} documents** in the library. Identified **{count} compliance alerts**:\n\n"
        for idx, issue in enumerate(issues[:5], 1):
            severity = issue.get("severity", "MEDIUM")
            issues_str = "; ".join(issue.get("issues", []))
            final_text += f"{idx}. **{issue.get('title')}** `[{severity}]`\n   - Issues: *{issues_str}*\n   - Folder: `{issue.get('folder_path')}`\n"
            cards.append({
                "doc_id": issue.get("doc_id"),
                "title": issue.get("title"),
                "category": issue.get("category"),
                "badge": severity,
                "badge_type": "danger" if severity == "HIGH" else "warning"
            })

    # 2. Compare documents
    elif any(k in lower for k in ["compare", "difference between", "comparison"]) and ("contract" in lower or "doc" in lower or "agreement" in lower or "vendor" in lower):
        # find matching docs to compare
        docs = db.query(Document).filter(Document.is_deleted == False).limit(3).all()
        doc_ids = [d.id for d in docs]
        criteria = "payment terms, liability, and duration"
        if "payment" in lower:
            criteria = "payment terms, invoice schedules, and penalties"
        elif "liability" in lower:
            criteria = "liability clauses and indemnification"

        tool_name = "compare_documents"
        args = {"doc_ids": doc_ids, "criteria": criteria}
        res = execute_tool(tool_name, args, db, user_role, user_name, user_id)
        tool_calls_executed.append({"tool": tool_name, "args": args, "result": res})

        final_text = f"### Cross-Document Comparative Analysis\n\n**Evaluated Criteria:** *{criteria}*\n\n"
        for m in res.get("matrix", []):
            final_text += f"- **{m.get('title')}** ({m.get('category')}):\n  > {m.get('criteria_analysis')}\n"
            cards.append({
                "doc_id": m.get("doc_id"),
                "title": m.get("title"),
                "category": m.get("category"),
                "badge": "Compared",
                "badge_type": "accent"
            })

    # 3. Delete document (RBAC demo)
    elif any(k in lower for k in ["delete", "remove doc", "trash"]):
        # Find target doc from query
        words = lower.replace("delete", "").replace("document", "").strip().split()
        target_name = words[0] if words else ""
        doc = db.query(Document).filter(Document.title.ilike(f"%{target_name}%"), Document.is_deleted == False).first()
        if not doc:
            doc = db.query(Document).filter(Document.is_deleted == False).first()

        if doc:
            tool_name = "delete_document"
            args = {"doc_id": doc.id}
            res = execute_tool(tool_name, args, db, user_role, user_name, user_id)
            tool_calls_executed.append({"tool": tool_name, "args": args, "result": res})
            if "error" in res:
                final_text = f"**Action Denied**: {res['error']}\n\n*Audit record logged: User '{user_name}' with role '{user_role}' attempted deletion of `{doc.title}`.*"
            else:
                final_text = f"**Success**: Document **{doc.title}** has been soft-deleted and removed from the active vector search index."
        else:
            final_text = "Could not locate the document to delete."

    # 4. Summarize document
    elif any(k in lower for k in ["summarize", "summary", "brief"]):
        # Extract focus if any
        focus = None
        for f in ["risk", "payment", "date", "liability", "term", "compliance"]:
            if f in lower:
                focus = f
                break

        # Find doc
        doc = None
        for word in lower.split():
            if len(word) > 3:
                doc = db.query(Document).filter(Document.title.ilike(f"%{word}%"), Document.is_deleted == False).first()
                if doc:
                    break
        if not doc:
            doc = db.query(Document).filter(Document.is_deleted == False).first()

        if doc:
            tool_name = "summarize_document"
            args = {"doc_id": doc.id, "focus": focus}
            res = execute_tool(tool_name, args, db, user_role, user_name, user_id)
            tool_calls_executed.append({"tool": tool_name, "args": args, "result": res})
            final_text = res.get("structured_summary", "Summary generated.")
            cards.append({
                "doc_id": doc.id,
                "title": doc.title,
                "category": doc.category,
                "badge": "Summarized",
                "badge_type": "accent"
            })
        else:
            final_text = "No active document found in the library to summarize."

    # 5. List folder
    elif any(k in lower for k in ["folder", "list dir", "browse", "directory", "tree"]):
        path = "/"
        for p in ["/contracts", "/finance", "/policies", "/engineering"]:
            if p.strip("/") in lower:
                path = p
                break
        tool_name = "list_folder"
        args = {"path": path}
        res = execute_tool(tool_name, args, db, user_role, user_name, user_id)
        tool_calls_executed.append({"tool": tool_name, "args": args, "result": res})
        final_text = f"### Directory Listing for `{path}`\n\n"
        if res.get("subfolders"):
            final_text += "**Subfolders:** " + ", ".join(f"`{sf}`" for sf in res["subfolders"]) + "\n\n"
        final_text += f"**Files ({len(res.get('files', []))}):**\n"
        for f in res.get("files", []):
            final_text += f"- **{f['title']}** ({f['category']}) - *{f.get('updated_at')}*\n"
            cards.append({
                "doc_id": f["doc_id"],
                "title": f["title"],
                "category": f["category"],
                "badge": f["category"],
                "badge_type": "neutral"
            })

    # 6. Audit log lookup
    elif any(k in lower for k in ["audit", "log", "history", "who changed", "activity"]):
        tool_name = "get_audit_log"
        args = {"limit": 10}
        res = execute_tool(tool_name, args, db, user_role, user_name, user_id)
        tool_calls_executed.append({"tool": tool_name, "args": args, "result": res})
        logs = res.get("logs", [])
        final_text = f"### Recent Audit Ledger Entries ({len(logs)} retrieved)\n\n"
        for l in logs[:5]:
            status_tag = f"`{l['status']}`"
            final_text += f"- **{l['timestamp']}** | `{l['tool_name']}` by **{l['user_name']}** ({l['user_role']}) -> {status_tag} {l.get('diff_summary')}\n"

    # Default: Search documents
    else:
        tool_name = "search_documents"
        args = {"query": prompt}
        res = execute_tool(tool_name, args, db, user_role, user_name, user_id)
        tool_calls_executed.append({"tool": tool_name, "args": args, "result": res})
        
        docs = res.get("documents", [])
        if docs:
            final_text = f"I discovered **{len(docs)} relevant documents** for *\"{prompt}\"* using MCP semantic search:\n\n"
            for d in docs[:4]:
                rel_pct = int(d.get("relevance_score", 0.7) * 100)
                final_text += f"- **{d['title']}** (`{d['category']}`) — Match: **{rel_pct}%**\n  > {d.get('snippet', '')[:160]}...\n\n"
                cards.append({
                    "doc_id": d["doc_id"],
                    "title": d["title"],
                    "category": d["category"],
                    "badge": f"{rel_pct}% Match",
                    "badge_type": "success" if rel_pct > 80 else "accent"
                })
        else:
            final_text = f"No documents matched the query *\"{prompt}\"*. Try querying with broad terms like 'contract', 'SLA', 'policy', or 'invoice'."

    return {
        "reply": final_text,
        "tool_calls": tool_calls_executed,
        "cards": cards
    }

async def run_claude_agent(
    prompt: str,
    history: List[Dict[str, Any]],
    db: Session,
    user_role: str,
    user_name: str,
    user_id: Optional[str],
    websocket: WebSocket
) -> Dict[str, Any]:
    """Orchestrates Claude API as the MCP client with streaming tool execution."""
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    
    # Format tools for Anthropic API
    anthropic_tools = []
    for t in MCP_TOOL_DEFINITIONS:
        anthropic_tools.append({
            "name": t["name"],
            "description": t["description"],
            "input_schema": t["inputSchema"]
        })

    system_prompt = (
        f"You are DocMind AI, an expert archival document management assistant powered by Model Context Protocol (MCP).\n"
        f"The current user is '{user_name}' with role '{user_role}'.\n"
        f"Always use the provided MCP tools to inspect, summarize, classify, compare, search, or mutate documents.\n"
        f"If the user asks for a mutation (move, update, delete) and their role is not authorized, explain the denial clearly."
    )

    messages = []
    for h in history[-6:]:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": prompt})

    tool_calls_executed = []
    cards = []

    # Send initial status
    await websocket.send_json({
        "type": "status",
        "content": "Claude agent is analyzing request and choosing MCP tools..."
    })

    response = client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=2048,
        system=system_prompt,
        messages=messages,
        tools=anthropic_tools
    )

    # Check for tool use
    assistant_contents = []
    for block in response.content:
        if block.type == "text":
            assistant_contents.append(block.text)
        elif block.type == "tool_use":
            tool_name = block.name
            tool_args = block.input
            tool_use_id = block.id

            await websocket.send_json({
                "type": "tool_start",
                "tool": tool_name,
                "args": tool_args
            })

            # Execute tool against MCP server
            result = execute_tool(tool_name, tool_args, db, user_role, user_name, user_id)
            tool_calls_executed.append({"tool": tool_name, "args": tool_args, "result": result})

            await websocket.send_json({
                "type": "tool_done",
                "tool": tool_name,
                "result": result
            })

            # Pass tool result back to Claude for final synthesis
            messages.append({"role": "assistant", "content": response.content})
            messages.append({
                "role": "user",
                "content": [
                    {
                        "type": "tool_result",
                        "tool_use_id": tool_use_id,
                        "content": json.dumps(result)
                    }
                ]
            })

            followup = client.messages.create(
                model=settings.CLAUDE_MODEL,
                max_tokens=2048,
                system=system_prompt,
                messages=messages
            )
            for fb in followup.content:
                if fb.type == "text":
                    assistant_contents.append(fb.text)

    final_text = "\n\n".join(assistant_contents)
    return {
        "reply": final_text,
        "tool_calls": tool_calls_executed,
        "cards": cards
    }

@router.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket):
    await websocket.accept()
    db = SessionLocal()
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            prompt = payload.get("message", "")
            user_role = payload.get("user_role", "admin")  # Default to admin for smooth testing
            user_name = payload.get("user_name", "Kaviy")
            user_id = payload.get("user_id", "demo-user-1")
            history = payload.get("history", [])

            await websocket.send_json({
                "type": "status",
                "content": f"Processing request with MCP agent (Role: {user_role})..."
            })

            if settings.ANTHROPIC_API_KEY and len(settings.ANTHROPIC_API_KEY.strip()) > 10:
                try:
                    res = await run_claude_agent(
                        prompt=prompt,
                        history=history,
                        db=db,
                        user_role=user_role,
                        user_name=user_name,
                        user_id=user_id,
                        websocket=websocket
                    )
                except Exception as e:
                    logger.error(f"Error invoking Claude API: {e}. Falling back to intelligent agent.")
                    res = intelligent_local_agent(prompt, db, user_role, user_name, user_id)
            else:
                # Intelligent MCP-connected agent
                res = intelligent_local_agent(prompt, db, user_role, user_name, user_id)

            await websocket.send_json({
                "type": "message",
                "content": res["reply"],
                "tool_calls": res["tool_calls"],
                "cards": res.get("cards", [])
            })

    except WebSocketDisconnect:
        logger.info("Chat websocket disconnected")
    except Exception as e:
        logger.error(f"Chat websocket error: {e}")
    finally:
        db.close()
