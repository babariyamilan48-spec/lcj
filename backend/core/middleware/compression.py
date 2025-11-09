"""
High-performance response compression and optimization middleware
"""
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse
import gzip
import json
import time
import logging
from typing import Callable, Any, Dict
import asyncio

logger = logging.getLogger(__name__)

class CompressionMiddleware(BaseHTTPMiddleware):
    """
    High-performance compression middleware with intelligent compression strategies
    """
    
    def __init__(self, app, minimum_size: int = 500, compression_level: int = 6):
        super().__init__(app)
        self.minimum_size = minimum_size
        self.compression_level = compression_level
        self.compressible_types = {
            'application/json',
            'text/plain',
            'text/html',
            'text/css',
            'text/javascript',
            'application/javascript',
            'text/xml',
            'application/xml'
        }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check if client accepts gzip
        accept_encoding = request.headers.get('accept-encoding', '')
        supports_gzip = 'gzip' in accept_encoding.lower()
        
        # Process request
        response = await call_next(request)
        
        # Skip compression for certain conditions
        if not supports_gzip:
            return response
        
        if hasattr(response, 'status_code') and response.status_code < 200 or response.status_code >= 300:
            return response
        
        # Check content type
        content_type = response.headers.get('content-type', '').split(';')[0].strip()
        if content_type not in self.compressible_types:
            return response
        
        # Get response body
        if isinstance(response, StreamingResponse):
            return response  # Skip streaming responses
        
        if hasattr(response, 'body'):
            body = response.body
        else:
            # For JSONResponse and similar
            if hasattr(response, 'render'):
                body = response.render(response.content)
            else:
                return response
        
        # Check minimum size
        if len(body) < self.minimum_size:
            return response
        
        # Compress the body
        try:
            compressed_body = gzip.compress(body, compresslevel=self.compression_level)
            
            # Only use compression if it actually saves space
            if len(compressed_body) < len(body):
                response.headers['content-encoding'] = 'gzip'
                response.headers['content-length'] = str(len(compressed_body))
                
                # Create new response with compressed body
                new_response = Response(
                    content=compressed_body,
                    status_code=response.status_code,
                    headers=dict(response.headers),
                    media_type=response.media_type
                )
                return new_response
        
        except Exception as e:
            logger.error(f"Compression failed: {e}")
        
        return response

class ResponseOptimizationMiddleware(BaseHTTPMiddleware):
    """
    Response optimization middleware for JSON serialization and caching headers
    """
    
    def __init__(self, app):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Add request ID for tracing
        request_id = f"req_{int(time.time() * 1000000)}"
        
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Add performance headers
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Request-ID"] = request_id
        
        # Add caching headers for static content
        if request.url.path.startswith('/static/') or request.url.path.endswith(('.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg')):
            response.headers["Cache-Control"] = "public, max-age=31536000"  # 1 year
        elif request.method == "GET" and response.status_code == 200:
            # Cache GET requests for 5 minutes by default
            response.headers["Cache-Control"] = "public, max-age=300"
        
        # Log slow requests
        if process_time > 1.0:
            logger.warning(f"Slow request: {request.method} {request.url.path} took {process_time:.2f}s")
        
        return response

class JSONOptimizationMiddleware(BaseHTTPMiddleware):
    """
    JSON response optimization middleware
    """
    
    def __init__(self, app):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Optimize JSON responses
        if isinstance(response, JSONResponse):
            try:
                # Use faster JSON serialization
                if hasattr(response, 'content') and isinstance(response.content, dict):
                    # Optimize the JSON serialization
                    optimized_content = self._optimize_json_content(response.content)
                    response.content = optimized_content
            except Exception as e:
                logger.error(f"JSON optimization failed: {e}")
        
        return response
    
    def _optimize_json_content(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Optimize JSON content by removing null values and empty arrays/objects
        """
        if isinstance(content, dict):
            optimized = {}
            for key, value in content.items():
                if value is not None:
                    if isinstance(value, (dict, list)):
                        optimized_value = self._optimize_json_content(value)
                        if optimized_value:  # Only include non-empty containers
                            optimized[key] = optimized_value
                    else:
                        optimized[key] = value
            return optimized
        elif isinstance(content, list):
            return [self._optimize_json_content(item) for item in content if item is not None]
        else:
            return content

# Utility functions for manual optimization
def compress_json_response(data: Any, request: Request) -> Response:
    """
    Manually compress JSON response if client supports it
    """
    accept_encoding = request.headers.get('accept-encoding', '')
    supports_gzip = 'gzip' in accept_encoding.lower()
    
    # Serialize JSON
    json_str = json.dumps(data, separators=(',', ':'), ensure_ascii=False)
    json_bytes = json_str.encode('utf-8')
    
    if supports_gzip and len(json_bytes) > 500:
        try:
            compressed_data = gzip.compress(json_bytes, compresslevel=6)
            if len(compressed_data) < len(json_bytes):
                return Response(
                    content=compressed_data,
                    media_type="application/json",
                    headers={
                        "content-encoding": "gzip",
                        "content-length": str(len(compressed_data))
                    }
                )
        except Exception as e:
            logger.error(f"Manual compression failed: {e}")
    
    return Response(
        content=json_bytes,
        media_type="application/json",
        headers={"content-length": str(len(json_bytes))}
    )

def optimize_large_response(data: Any, max_items: int = 100) -> Any:
    """
    Optimize large responses by limiting items and adding pagination info
    """
    if isinstance(data, dict):
        if 'results' in data and isinstance(data['results'], list):
            if len(data['results']) > max_items:
                data['results'] = data['results'][:max_items]
                data['truncated'] = True
                data['total_available'] = len(data['results'])
        
        # Recursively optimize nested data
        for key, value in data.items():
            if isinstance(value, (dict, list)):
                data[key] = optimize_large_response(value, max_items)
    
    elif isinstance(data, list) and len(data) > max_items:
        return data[:max_items]
    
    return data
