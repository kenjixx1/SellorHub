# Claude Summary: SellorHub (Sellor)

SellorHub is a multi-store e-commerce platform for small sellers in Southeast Asia. Sellers create an online store (unique public URL) and manage product listings via a seller dashboard. Buyers discover stores/products, browse and filter listings, and contact sellers using an inquiry system. Admins oversee approvals and moderation.

## MVP scope (implemented in code scaffolding)
- Authentication (register/login, JWT)
- Store browsing + seller store management
- Product catalog (CRUD), product images, product categories/groups
- Buyer inquiries (submit inquiry, seller views & updates status)
- Admin endpoints (platform stats, users, approvals, moderation)

## Tech stack (per PRD + existing code)
- Frontend: React + TypeScript (Vite scaffold exists, not feature-complete yet)
- Backend: FastAPI (Python)
- Database: SQLite
- ORM: SQLAlchemy
- Validation: Pydantic
- Auth security: JWT + bcrypt password hashing

## Current backend structure
Backend code lives under `backend/app/`:
- `config.py`: All app settings via `pydantic_settings.BaseSettings` (reads `.env`)
- `database.py`: SQLAlchemy engine, `SessionLocal`, `Base`, `get_db()` dependency
  - **Known bug**: `pool_size` and `max_overflow` in `create_engine` are incompatible with SQLite — remove them
- `models/`: SQLAlchemy ORM classes for the DB schema
  - MVP: `user.py`, `store.py`, `product_group.py`, `product.py`, `product_image.py`, `inquiry.py`
  - Post-MVP: `address.py`, `order.py`, `order_item.py`, `order_status_history.py`, `shipment.py`
- `schemas/`: Pydantic request/response models
  - MVP: `user.py`, `store.py`, `product_group.py`, `product.py`, `product_image.py`, `inquiry.py`
  - Post-MVP: `address.py`, `order.py`
- `services/`: business logic layer (DB operations & core rules)
  - `auth_service.py`, `user_service.py`, `store_service.py`, `product_group_service.py`, `product_service.py`, `inquiry_service.py`, `admin_service.py`
- `routers/`: FastAPI route definitions (API endpoints)
  - `auth.py`, `stores.py`, `products.py`, `product_groups.py`, `inquiries.py`, `admin.py`
- `dependencies.py`: JWT auth helpers, role checks, pagination helper
- `utils/`: security (JWT/password) and storage (file upload helpers)
- `main.py`: FastAPI entry point, CORS/static uploads, includes all routers

## API endpoints reference
All current endpoints are documented in:
- `backend/API_ENDPOINTS.md`
Also available via Swagger UI at:
- `http://localhost:8000/docs`

## How to run locally (typical flow)
1. `cd backend`
2. `pip install -r requirements.txt`
3. Copy env file: `cp .env.example .env` (then edit `DATABASE_URL` and `SECRET_KEY`)
4. Start API server:
   - `uvicorn app.main:app --reload`
5. Open `http://localhost:8000/docs`

## Notes / next work that typically follows
- Create Alembic migrations properly (current `main.py` creates tables using `Base.metadata.create_all`; migrations are the production path)
- Implement missing email notifications and more robust moderation fields (only placeholders/TODOs exist)
- Frontend UI pages + routing + API integration (current frontend is only a scaffold)
- Add tests (unit + integration) and tighten validation/business rules

