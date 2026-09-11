import logging
from apscheduler.schedulers.background import BackgroundScheduler
from backend.db.session import SessionLocal
from backend.mcp_server.tools import flag_compliance_issues

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()

def run_scheduled_compliance():
    logger.info("Executing scheduled compliance monitor scan...")
    db = SessionLocal()
    try:
        results = flag_compliance_issues(
            db=db,
            user_role="admin",
            user_name="apscheduler-daemon"
        )
        flagged = results.get("flagged_issues_count", 0)
        logger.info(f"Compliance scan completed: {flagged} alerts flagged.")
    except Exception as e:
        logger.error(f"Error in compliance scan job: {e}")
    finally:
        db.close()

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            run_scheduled_compliance,
            "interval",
            hours=12,
            id="compliance_monitor_job",
            replace_existing=True
        )
        scheduler.start()
        logger.info("Compliance APScheduler background job started.")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
