import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
import app.db.models  # noqa: F401 — metadata completa para create_all
from app.db.session import get_db
from app.main import app

SQLITE_TEST_URL = "sqlite:///./test.db"

engine = create_engine(SQLITE_TEST_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def admin_token(client):
    from app.core.security import hash_password
    from app.models.user import User, UserRole

    db = TestingSession()
    user = User(
        email="admin@grubba.com",
        full_name="Admin",
        hashed_password=hash_password("admin123"),
        role=UserRole.admin,
    )
    db.add(user)
    db.commit()
    db.close()

    resp = client.post("/api/v1/auth/login", json={"email": "admin@grubba.com", "password": "admin123"})
    return resp.json()["access_token"]


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}
