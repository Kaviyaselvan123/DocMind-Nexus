from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from backend.db.session import get_db
from backend.db.models import AuditLog
from backend.auth.security import get_current_user
from backend.mcp_server.tools import flag_compliance_issues, get_audit_log

router = APIRouter()

@router.get("/logs")
def get_logs(
    tool_name: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    filters = {}
    if tool_name:
        filters["tool_name"] = tool_name
    if status:
        filters["status"] = status
    return get_audit_log(db, filters=filters, limit=limit)

@router.get("/stats")
def get_audit_stats(db: Session = Depends(get_db)):
    total_calls = db.query(AuditLog).count()
    success_calls = db.query(AuditLog).filter(AuditLog.status == "SUCCESS").count()
    denied_calls = db.query(AuditLog).filter(AuditLog.status == "DENIED").count()
    error_calls = db.query(AuditLog).filter(AuditLog.status == "ERROR").count()

    # Tool breakdown for Recharts bar chart
    tool_counts = (
        db.query(AuditLog.tool_name, func.count(AuditLog.id))
        .group_by(AuditLog.tool_name)
        .order_by(desc(func.count(AuditLog.id)))
        .all()
    )
    tool_distribution = [{"tool": t, "count": c} for t, c in tool_counts]

    # Role breakdown for pie chart
    role_counts = (
        db.query(AuditLog.user_role, func.count(AuditLog.id))
        .group_by(AuditLog.user_role)
        .all()
    )
    role_distribution = [{"role": r or "unknown", "count": c} for r, c in role_counts]

    # Timeline (last 7 days activity)
    timeline_data = []
    now = datetime.utcnow()
    for i in range(6, -1, -1):
        day = (now - timedelta(days=i)).strftime("%b %d")
        start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0)
        end = (now - timedelta(days=i)).replace(hour=23, minute=59, second=59)
        day_count = (
            db.query(AuditLog)
            .filter(AuditLog.timestamp >= start, AuditLog.timestamp <= end)
            .count()
        )
        timeline_data.append({"day": day, "executions": day_count})

    return {
        "total_executions": total_calls,
        "success_rate": round((success_calls / total_calls * 100) if total_calls > 0 else 100, 1),
        "denied_count": denied_calls,
        "error_count": error_calls,
        "tool_distribution": tool_distribution,
        "role_distribution": role_distribution,
        "timeline": timeline_data
    }

@router.post("/compliance/scan")
def trigger_compliance_scan(db: Session = Depends(get_db)):
    return flag_compliance_issues(db, user_role="admin", user_name="compliance-scheduler")
