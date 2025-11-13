"""
Celery tasks for AI report generation.
Handles asynchronous AI insight generation to prevent blocking API requests.
"""

import logging
from typing import Dict, Any
from datetime import datetime

from celery import current_task
from core.celery_app import celery_app
from core.services.ai_service import AIInsightService

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, name='core.tasks.ai_report_tasks.generate_ai_insights_task', queue='default')
def generate_ai_insights_task(self, test_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Asynchronous task for generating AI-powered personality insights.
    
    Args:
        test_data: Dictionary containing test information:
            - test_type: str
            - test_id: str  
            - answers: List[Any]
            - results: Dict[str, Any]
            - user_id: Optional[str]
    
    Returns:
        Dict containing success status, insights, and metadata
    """
    try:
        # Update task state to indicate processing has started
        self.update_state(
            state='PROCESSING',
            meta={
                'status': 'Generating AI insights...',
                'progress': 10,
                'test_type': test_data.get('test_type'),
                'user_id': test_data.get('user_id')
            }
        )
        
        logger.info(f"Starting AI insights generation for test {test_data.get('test_id')} - Task ID: {self.request.id}")
        
        # Initialize AI service
        ai_service = AIInsightService()
        
        # Update progress
        self.update_state(
            state='PROCESSING',
            meta={
                'status': 'AI service initialized, generating insights...',
                'progress': 30,
                'test_type': test_data.get('test_type'),
                'user_id': test_data.get('user_id')
            }
        )
        
        # Update progress before AI generation
        self.update_state(
            state='PROCESSING',
            meta={
                'status': 'Sending request to AI service...',
                'progress': 40,
                'test_type': test_data.get('test_type'),
                'user_id': test_data.get('user_id')
            }
        )
        
        # Generate insights using the existing business logic
        result = ai_service.generate_insights(test_data)
        
        # Update progress after AI generation
        self.update_state(
            state='PROCESSING',
            meta={
                'status': 'Processing AI response...',
                'progress': 70,
                'test_type': test_data.get('test_type'),
                'user_id': test_data.get('user_id')
            }
        )
        
        # Update progress before database storage
        self.update_state(
            state='PROCESSING',
            meta={
                'status': 'Storing insights in database...',
                'progress': 85,
                'test_type': test_data.get('test_type'),
                'user_id': test_data.get('user_id')
            }
        )
        
        # Store individual AI insights in database if generation was successful
        if result.get("success") and test_data.get('user_id'):
            try:
                # Import here to avoid circular imports
                import asyncio
                import sys
                import os
                
                # Add the backend directory to the Python path if not already there
                backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                if backend_dir not in sys.path:
                    sys.path.append(backend_dir)
                
                from results_service.app.services.result_service import ResultService
                
                # Store the individual AI insights
                stored_result = asyncio.run(ResultService.store_ai_insights(
                    user_id=test_data.get('user_id'),
                    insights_data=result["insights"],
                    generated_at=result.get("generated_at"),
                    model=result.get("model"),
                    test_results_used=[test_data.get('test_id')],
                    generation_duration=None,
                    insights_type="individual"
                ))
                
                if stored_result:
                    logger.info(f"Individual AI insights stored successfully in database for user {test_data.get('user_id')}")
                    result['stored_in_db'] = True
                    result['db_record_id'] = stored_result.get('id')
                else:
                    logger.warning(f"Failed to store individual AI insights in database for user {test_data.get('user_id')}")
                    result['stored_in_db'] = False
                    
            except Exception as storage_error:
                logger.error(f"Error storing individual AI insights for user {test_data.get('user_id')}: {str(storage_error)}")
                result['stored_in_db'] = False
                result['storage_error'] = str(storage_error)
        
        # Final progress update
        self.update_state(
            state='PROCESSING',
            meta={
                'status': 'Finalizing insights...',
                'progress': 95,
                'test_type': test_data.get('test_type'),
                'user_id': test_data.get('user_id')
            }
        )
        
        # Add task metadata to result
        result['task_id'] = self.request.id
        result['completed_at'] = datetime.utcnow().isoformat()
        
        logger.info(f"AI insights generation completed successfully - Task ID: {self.request.id}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error in AI insights generation task {self.request.id}: {str(e)}")
        
        # Return error result - Celery will handle the exception state
        return {
            "success": False,
            "error": f"AI service is temporarily unavailable: {str(e)}",
            "task_id": self.request.id,
            "completed_at": datetime.utcnow().isoformat(),
            "test_type": test_data.get('test_type'),
            "user_id": test_data.get('user_id')
        }

@celery_app.task(bind=True, name='core.tasks.ai_report_tasks.generate_comprehensive_ai_insights_task')
def generate_comprehensive_ai_insights_task(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Asynchronous task for generating comprehensive AI insights based on all completed tests.
    
    Args:
        request_data: Dictionary containing:
            - user_id: str
            - all_test_results: Dict[str, Any]
    
    Returns:
        Dict containing success status, comprehensive insights, and metadata
    """
    try:
        user_id = request_data.get('user_id')
        
        # Log task start
        logger.info(f"Starting comprehensive AI insights for user {user_id}")
        
        # Update task state to indicate processing has started
        self.update_state(
            state='PROCESSING',
            meta={
                'status': 'Starting comprehensive AI analysis...',
                'progress': 10,
                'user_id': user_id,
                'test_count': len(request_data.get('all_test_results', {}))
            }
        )
        
        logger.info(f"Starting comprehensive AI insights generation for user {user_id} - Task ID: {self.request.id}")
        
        # Initialize AI service
        ai_service = AIInsightService()
        
        # Update progress
        self.update_state(
            state='PROCESSING',
            meta={
                'status': 'Analyzing all test results...',
                'progress': 30,
                'user_id': user_id,
                'test_count': len(request_data.get('all_test_results', {}))
            }
        )
        
        # Update progress before AI generation
        self.update_state(
            state='PROCESSING',
            meta={
                'status': 'Generating comprehensive AI analysis...',
                'progress': 50,
                'user_id': user_id,
                'test_count': len(request_data.get('all_test_results', {}))
            }
        )
        
        # Generate comprehensive insights using existing business logic
        result = ai_service.generate_comprehensive_insights(request_data)
        
        # Update progress after AI generation
        self.update_state(
            state='PROCESSING',
            meta={
                'status': 'Processing comprehensive insights...',
                'progress': 70,
                'user_id': user_id,
                'test_count': len(request_data.get('all_test_results', {}))
            }
        )
        
        # Update progress before database storage
        self.update_state(
            state='PROCESSING',
            meta={
                'status': 'Storing AI insights in database...',
                'progress': 80,
                'user_id': user_id,
                'test_count': len(request_data.get('all_test_results', {}))
            }
        )
        
        # Store AI insights in database if generation was successful
        if result.get("success"):
            try:
                # Import here to avoid circular imports
                import asyncio
                import sys
                import os
                
                # Add the backend directory to the Python path if not already there
                backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                if backend_dir not in sys.path:
                    sys.path.append(backend_dir)
                
                from results_service.app.services.result_service import ResultService
                
                # Store the AI insights
                stored_result = asyncio.run(ResultService.store_ai_insights(
                    user_id=user_id,
                    insights_data=result["insights"],
                    generated_at=result.get("generated_at"),
                    model=result.get("model"),
                    test_results_used=list(request_data.get('all_test_results', {}).keys()),
                    generation_duration=None,  # Could calculate from task start time
                    insights_type="comprehensive"
                ))
                
                if stored_result:
                    logger.info(f"AI insights stored successfully in database for user {user_id}")
                    result['stored_in_db'] = True
                    result['db_record_id'] = stored_result.get('id')
                else:
                    logger.warning(f"Failed to store AI insights in database for user {user_id}")
                    result['stored_in_db'] = False
                    
            except Exception as storage_error:
                logger.error(f"Error storing AI insights for user {user_id}: {str(storage_error)}")
                result['stored_in_db'] = False
                result['storage_error'] = str(storage_error)
        
        # Update progress to completion
        self.update_state(
            state='PROCESSING',
            meta={
                'status': 'Finalizing comprehensive report...',
                'progress': 95,
                'user_id': user_id,
                'test_count': len(request_data.get('all_test_results', {}))
            }
        )
        
        # Add task metadata to result
        result['task_id'] = self.request.id
        result['completed_at'] = datetime.utcnow().isoformat()
        result['user_id'] = user_id
        
        logger.info(f"Comprehensive AI insights generation completed successfully - Task ID: {self.request.id}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error in comprehensive AI insights generation task {self.request.id}: {str(e)}")
        
        # Return error result - Celery will handle the exception state
        return {
            "success": False,
            "error": f"AI service is temporarily unavailable: {str(e)}",
            "task_id": self.request.id,
            "completed_at": datetime.utcnow().isoformat(),
            "user_id": request_data.get('user_id'),
            "test_count": len(request_data.get('all_test_results', {}))
        }

@celery_app.task(bind=True, name='core.tasks.ai_report_tasks.get_task_status')
def get_task_status(self, task_id: str) -> Dict[str, Any]:
    """
    Get the status of a running or completed task.
    
    Args:
        task_id: The Celery task ID to check
        
    Returns:
        Dict containing task status and metadata
    """
    try:
        # Get task result using Celery's AsyncResult
        from celery.result import AsyncResult
        
        task_result = AsyncResult(task_id, app=celery_app)
        
        response = {
            'task_id': task_id,
            'status': task_result.status,
            'ready': task_result.ready(),
            'successful': task_result.successful() if task_result.ready() else None,
            'failed': task_result.failed() if task_result.ready() else None,
        }
        
        if task_result.ready():
            if task_result.successful():
                response['result'] = task_result.result
            else:
                response['error'] = str(task_result.info)
        else:
            # Task is still running, get progress info
            response['info'] = task_result.info
            
        return response
        
    except Exception as e:
        logger.error(f"Error getting task status for {task_id}: {str(e)}")
        return {
            'task_id': task_id,
            'status': 'ERROR',
            'error': str(e),
            'ready': True,
            'successful': False,
            'failed': True
        }
