from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.config import settings
from app.database import engine, Base
from app.routers import auth, stores, products, product_groups, inquiries, admin, users, cart, orders, addresses, ratings
import app.models

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## Sellor API

Multi-store e-commerce platform for small sellers in Southeast Asia.

### Features
- Authentication - Register, login, JWT-based auth
- Stores - Create and manage your online store
- Products - List products with images and categories
- Inquiries - Buyer-seller communication
- Admin - Platform administration and moderation

### Roles
- Buyer - Browse stores, search products, submit inquiries
- Seller - Manage store, products, and view inquiries (requires approval)
- Admin - Full platform access including user and content moderation
    """,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_dir = Path(settings.UPLOAD_DIR)
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount(f"/{settings.UPLOAD_DIR}", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(stores.router)
app.include_router(products.router)
app.include_router(product_groups.router)
app.include_router(inquiries.router)
app.include_router(admin.router)
app.include_router(users.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(addresses.router)
app.include_router(ratings.router)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/api/health",
    }
