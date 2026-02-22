# Sellor Backend API

FastAPI backend for the Sellor multi-store e-commerce platform.

## Project Structure

```
backend/
├── app/
│   ├── models/          # SQLAlchemy ORM models ✅
│   ├── schemas/         # Pydantic request/response schemas ✅
│   ├── services/        # Business logic layer ✅
│   ├── routers/         # API route handlers ✅
│   │   ├── auth.py      # POST /register, /login, GET /me
│   │   ├── stores.py    # Store browsing + seller management
│   │   ├── products.py  # Product search + seller management
│   │   ├── product_groups.py  # Category management
│   │   ├── inquiries.py # Buyer inquiries + seller view
│   │   └── admin.py     # Admin panel endpoints
│   ├── utils/           # Utility functions (security, storage) ✅
│   ├── config.py        # Application configuration ✅
│   ├── database.py      # Database connection ✅
│   ├── dependencies.py  # FastAPI dependencies ✅
│   └── main.py          # FastAPI app entry point ✅
├── alembic/             # Database migrations (to be initialized)
├── tests/               # Unit and integration tests (to be created)
├── requirements.txt     # Python dependencies ✅
└── .env.example         # Environment variables template ✅
```

## Setup Instructions

### 1. Prerequisites

- Python 3.11 or higher
- PostgreSQL 15 or higher
- Virtual environment tool (venv or conda)

### 2. Installation

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings
# Important: Change SECRET_KEY in production!
```

### 4. Database Setup

```bash
# Create PostgreSQL database
createdb sellor_db

# Or using psql:
psql -U postgres
CREATE DATABASE sellor_db;
CREATE USER sellor_user WITH PASSWORD 'sellor_password';
GRANT ALL PRIVILEGES ON DATABASE sellor_db TO sellor_user;
\q
```

### 5. Initialize Database Migrations

```bash
# Initialize Alembic
alembic init alembic

# Edit alembic.ini - set sqlalchemy.url to your DATABASE_URL
# Or use env var: sqlalchemy.url = 

# Edit alembic/env.py to import your models:
# Add these lines:
#   from app.database import Base
#   from app.models import *  # Import all models
#   target_metadata = Base.metadata

# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

### 6. Run Development Server

```bash
# Run with uvicorn (hot reload enabled)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Interactive docs (Swagger): http://localhost:8000/docs
- Alternative docs (ReDoc): http://localhost:8000/redoc

## Development Workflow

### Creating Database Migrations

```bash
# After modifying models, create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_auth.py
```

## API Structure

### Planned Routes

- **Authentication** (`/api/auth`)
  - POST `/register` - User registration
  - POST `/login` - User login
  - GET `/me` - Get current user

- **Stores** (`/api/stores`)
  - POST `/` - Create store
  - GET `/{slug}` - Get store by slug
  - PUT `/{id}` - Update store
  - GET `/` - List all stores

- **Products** (`/api/products`)
  - POST `/` - Create product
  - GET `/{id}` - Get product
  - PUT `/{id}` - Update product
  - DELETE `/{id}` - Delete product
  - GET `/` - Search and filter products

- **Product Groups** (`/api/product-groups`)
  - POST `/` - Create category
  - GET `/stores/{id}/groups` - Get store categories

- **Inquiries** (`/api/inquiries`)
  - POST `/` - Submit inquiry
  - GET `/` - Get seller's inquiries
  - PUT `/{id}` - Update inquiry status

- **Admin** (`/api/admin`)
  - GET `/users` - List users
  - PUT `/users/{id}/approve-seller` - Approve seller
  - GET `/stores` - List all stores
  - GET `/stats` - Platform statistics

## Key Features

### Authentication & Authorization

- JWT-based authentication
- Role-based access control (buyer, seller, admin)
- Seller approval workflow
- Password hashing with bcrypt

### File Upload

- Supports multiple storage backends:
  - Local filesystem (development)
  - AWS S3 (production)
  - Cloudinary (alternative)
- Image validation (size, format)
- Unique filename generation

### Database

- SQLAlchemy ORM models
- Alembic migrations
- PostgreSQL with proper indexing
- Relationship management

### Security

- Password strength validation
- JWT token expiration
- Input validation with Pydantic
- SQL injection prevention

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT secret (generate with `openssl rand -hex 32`)
- `STORAGE_TYPE` - File storage backend (local, s3, cloudinary)
- `CORS_ORIGINS` - Allowed frontend origins

## Models Overview

### MVP Models (Implemented)
- **User** - User accounts (buyer/seller/admin)
- **Store** - Seller stores with unique slugs
- **ProductGroup** - Product categories within stores
- **Product** - Product listings
- **ProductImage** - Multiple images per product
- **Inquiry** - Buyer-seller communication

### Post-MVP Models (Phase 2)
- **Address** - Shipping addresses
- **Order** - Order transactions
- **OrderItem** - Order line items
- **OrderStatusHistory** - Order tracking
- **Shipment** - Shipping information

## Dependencies

Core dependencies:
- **FastAPI** - Web framework
- **SQLAlchemy** - ORM
- **Pydantic** - Data validation
- **Alembic** - Database migrations
- **python-jose** - JWT implementation
- **passlib** - Password hashing
- **psycopg2** - PostgreSQL adapter

See `requirements.txt` for complete list.

## Next Steps

1. ✅ Models and schemas created
2. ✅ Service layer implemented (business logic)
3. ✅ Router layer implemented (API endpoints)
4. ✅ main.py FastAPI application entry point
5. ⬜ Install dependencies and configure environment
6. ⬜ Initialize Alembic migrations and run them
7. ⬜ Add email notification service
8. ⬜ Write unit tests
9. ⬜ Write integration tests
10. ⬜ Deploy to production

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Project PRD](../PRD.md)
- [Database Schema](./database-structure.md)
- [Classes Summary](./CLASSES_SUMMARY.md)
- [Services Summary](./SERVICES_SUMMARY.md) ⭐ NEW

## License

See LICENSE file in project root.
