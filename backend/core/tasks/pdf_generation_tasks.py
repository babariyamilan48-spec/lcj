"""
Celery tasks for PDF report generation.
Handles asynchronous PDF generation to prevent blocking API requests.
"""

import logging
import sys
import os
from typing import Dict, Any, Optional
from datetime import datetime

from celery import current_task
from core.celery_app import celery_app

# Ensure backend directory is in path for Celery workers
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, name='generate_pdf_report_task')
def generate_pdf_report_task(
    self, 
    user_id: str, 
    report_format: str = "pdf",
    include_ai_insights: bool = True,
    test_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Asynchronous task for generating PDF reports.
    
    Args:
        user_id: User ID to generate report for
        report_format: Report format (pdf, json, csv, markdown)
        include_ai_insights: Whether to include AI insights
        test_id: Optional specific test ID
    
    Returns:
        Dict containing success status, file path/content, and metadata
    """
    try:
        # Update task state to indicate processing has started
        self.update_state(
            state='PROCESSING',
            meta={
                'status': 'Starting PDF report generation...',
                'progress': 10,
                'user_id': user_id,
                'format': report_format
            }
        )
        
        logger.info(f"Starting PDF report generation for user {user_id} - Task ID: {self.request.id}")
        
        # Import here to avoid circular imports
        from results_service.app.services.result_service import ResultService  # noqa: E402
        
        # Update progress
        self.update_state(
            state='PROCESSING',
            meta={
                'status': 'Gathering user data...',
                'progress': 30,
                'user_id': user_id,
                'format': report_format
            }
        )
        
        # Generate the report data using existing business logic
        # Note: We need to handle async calls in Celery tasks differently
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            report_data = loop.run_until_complete(
                ResultService.generate_comprehensive_report(
                    user_id=user_id,
                    include_ai_insights=include_ai_insights,
                    test_id=test_id
                )
            )
        finally:
            loop.close()
        
        # Update progress
        self.update_state(
            state='PROCESSING',
            meta={
                'status': f'Generating {report_format.upper()} file...',
                'progress': 60,
                'user_id': user_id,
                'format': report_format
            }
        )
        
        # Generate the appropriate format
        if report_format.lower() == "pdf":
            # Handle async PDF generation
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                pdf_buffer = loop.run_until_complete(
                    ResultService.generate_pdf_report(report_data)
                )
            finally:
                loop.close()
            
            result = {
                'success': True,
                'content_type': 'application/pdf',
                'content': pdf_buffer,
                'filename': f'user_report_{user_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
            }
        elif report_format.lower() == "json":
            import json
            json_content = json.dumps(report_data, indent=2, default=str)
            result = {
                'success': True,
                'content_type': 'application/json',
                'content': json_content.encode('utf-8'),
                'filename': f'user_report_{user_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
            }
        elif report_format.lower() == "csv":
            # Handle async CSV generation
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                csv_content = loop.run_until_complete(
                    ResultService.generate_csv_report(report_data)
                )
            finally:
                loop.close()
            
            result = {
                'success': True,
                'content_type': 'text/csv',
                'content': csv_content.encode('utf-8'),
                'filename': f'user_report_{user_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
            }
        elif report_format.lower() in ["markdown", "md"]:
            from results_service.app.services.markdown_report_service import MarkdownReportService
            # Handle async Markdown generation
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                markdown_content = loop.run_until_complete(
                    MarkdownReportService.generate_markdown_report(report_data)
                )
            finally:
                loop.close()
            
            result = {
                'success': True,
                'content_type': 'text/markdown',
                'content': markdown_content.encode('utf-8'),
                'filename': f'user_report_{user_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.md'
            }
        else:
            raise ValueError(f"Unsupported format: {report_format}")
        
        # Update progress
        self.update_state(
            state='PROCESSING',
            meta={
                'status': 'Finalizing report...',
                'progress': 90,
                'user_id': user_id,
                'format': report_format
            }
        )
        
        # Add task metadata
        result.update({
            'task_id': self.request.id,
            'completed_at': datetime.utcnow().isoformat(),
            'user_id': user_id,
            'format': report_format,
            'include_ai_insights': include_ai_insights,
            'test_id': test_id
        })
        
        logger.info(f"PDF report generation completed successfully - Task ID: {self.request.id}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error in PDF report generation task {self.request.id}: {str(e)}")
        
        # Update task state to failed
        self.update_state(
            state='FAILURE',
            meta={
                'status': f'Failed to generate report: {str(e)}',
                'progress': 100,
                'error': str(e),
                'user_id': user_id,
                'format': report_format
            }
        )
        
        # Return error result
        return {
            'success': False,
            'error': str(e),
            'task_id': self.request.id,
            'completed_at': datetime.utcnow().isoformat(),
            'user_id': user_id,
            'format': report_format
        }

@celery_app.task(bind=True, name='generate_comprehensive_pdf_task')
def generate_comprehensive_pdf_task(
    self,
    user_id: str,
    test_results: Dict[str, Any],
    ai_insights: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Asynchronous task for generating comprehensive PDF reports with AI insights.
    
    Args:
        user_id: User ID
        test_results: All test results data
        ai_insights: AI insights data
    
    Returns:
        Dict containing success status, PDF content, and metadata
    """
    try:
        # Update task state
        self.update_state(
            state='PROCESSING',
            meta={
                'status': 'Starting comprehensive PDF generation...',
                'progress': 10,
                'user_id': user_id
            }
        )
        
        logger.info(f"Starting comprehensive PDF generation for user {user_id} - Task ID: {self.request.id}")
        
        # Import here to avoid circular imports
        from results_service.app.services.pdf_generator import PDFGeneratorService
        
        # Update progress
        self.update_state(
            state='PROCESSING',
            meta={
                'status': 'Generating comprehensive PDF...',
                'progress': 50,
                'user_id': user_id
            }
        )
        
        # Generate PDF using existing business logic
        pdf_path = PDFGeneratorService.generate_comprehensive_report_pdf(
            test_results=test_results,
            ai_insights=ai_insights,
            user_id=user_id
        )
        
        # Read the generated PDF file
        with open(pdf_path, 'rb') as pdf_file:
            pdf_content = pdf_file.read()
        
        # Clean up the temporary file
        import os
        os.remove(pdf_path)
        
        result = {
            'success': True,
            'content_type': 'application/pdf',
            'content': pdf_content,
            'filename': f'comprehensive_report_user_{user_id}_{datetime.now().strftime("%Y%m%d")}.pdf',
            'task_id': self.request.id,
            'completed_at': datetime.utcnow().isoformat(),
            'user_id': user_id
        }
        
        logger.info(f"Comprehensive PDF generation completed successfully - Task ID: {self.request.id}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error in comprehensive PDF generation task {self.request.id}: {str(e)}")
        
        # Update task state to failed
        self.update_state(
            state='FAILURE',
            meta={
                'status': f'Failed to generate comprehensive PDF: {str(e)}',
                'progress': 100,
                'error': str(e),
                'user_id': user_id
            }
        )
        
        return {
            'success': False,
            'error': str(e),
            'task_id': self.request.id,
            'completed_at': datetime.utcnow().isoformat(),
            'user_id': user_id
        }
