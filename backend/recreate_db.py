from core.database import Base, engine

# ✅ Import all models so Base.metadata knows them
# from models import user, question, option  # import every model file you have
from question_service.app.models import test, test_section, test_dimension, question, option
from auth_service.app.models.user import User , RefreshToken , EmailOTP

print("Dropping all tables...")
Base.metadata.drop_all(bind=engine)

print("Creating all tables...")
Base.metadata.create_all(bind=engine)

print("Database reset complete ✅")