"""
Seeds iniciais para desenvolvimento local.
Execute com: python seeds.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv

load_dotenv()

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.base import Base
import app.db.models  # noqa: F401 — metadata para create_all
from app.db.session import SessionLocal, engine
from app.models.client import Client
from app.models.user import User, UserRole


def run_seeds(db: Session) -> None:
    # --- Users ---
    admin = User(
        email="admin@grubba.com",
        full_name="Administrador",
        hashed_password=hash_password("admin123"),
        role=UserRole.admin,
        is_active=True,
    )
    collaborator = User(
        email="colaborador@grubba.com",
        full_name="Colaborador Padrão",
        hashed_password=hash_password("collab123"),
        role=UserRole.collaborator,
        is_active=True,
    )
    db.add_all([admin, collaborator])
    db.flush()

    # --- Clients ---
    clients = [
        Client(name="Importadora Atlas S.A.", cnpj="12.345.678/0001-99", email="contato@atlas.com.br"),
        Client(name="Exportadora Mar Azul Ltda", cnpj="98.765.432/0001-11", email="ops@marazul.com.br"),
        Client(name="Comércio Global Portos ME", cnpj="55.555.555/0001-55"),
    ]
    db.add_all(clients)
    db.commit()

    print("✓ Seeds criados com sucesso:")
    print(f"  Admin:        admin@grubba.com / admin123")
    print(f"  Colaborador:  colaborador@grubba.com / collab123")
    print(f"  Clientes:     {len(clients)} cadastrados")


if __name__ == "__main__":
    print("Criando tabelas e rodando seeds...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        run_seeds(db)
    except Exception as e:
        db.rollback()
        print(f"Erro: {e}")
        raise
    finally:
        db.close()
