"""
Scheduler service using APScheduler to run background tasks.
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from ..services.interest_calculation_service import InterestCalculationService
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def run_interest_check():
    """Job to run the interest check logic."""
    try:
        logger.info("Scheduler: Running interest calculation job...")
        service = InterestCalculationService()
        result = service.check_and_process_all_due_dates()
        logger.info(f"Scheduler: Job finished. Result: {result}")
    except Exception as e:
        logger.error(f"Scheduler: Job failed with error: {str(e)}")

def start_scheduler():
    """Start the background scheduler."""
    # Run every 1 hour
    trigger = IntervalTrigger(hours=1)
    
    # Add job if not already added (though replace_existing=True handles updates)
    scheduler.add_job(
        run_interest_check,
        trigger=trigger,
        id='interest_check_job',
        name='Check Investment Due Dates',
        replace_existing=True
    )
    
    if not scheduler.running:
        scheduler.start()
        logger.info("Scheduler started.")

def shutdown_scheduler():
    """Shutdown the scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler shut down.")
