from fastapi import APIRouter
from contact_service.app.api.v1.endpoints import contact

api_router = APIRouter()
api_router.include_router(contact.router, prefix="/contacts", tags=["contacts"])

router = api_router  # Export as 'router' for gateway compatibility
