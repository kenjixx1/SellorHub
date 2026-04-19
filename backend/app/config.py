from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional
_ENV_PATH = Path(__file__).resolve().parents[1] / '.env'

class Settings(BaseSettings):
    APP_NAME: str = 'Sellor API'
    APP_VERSION: str = '1.0.0'
    DEBUG: bool = False
    DATABASE_URL: str = 'sqlite:///./sellor.db'
    SECRET_KEY: str = 'your-secret-key-change-in-production'
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    BCRYPT_ROUNDS: int = 12
    CORS_ORIGINS: list[str] = ['http://localhost:5173', 'http://localhost:3000']
    MAX_FILE_SIZE: int = 5 * 1024 * 1024
    ALLOWED_IMAGE_EXTENSIONS: set[str] = {'.jpg', '.jpeg', '.png', '.webp'}
    UPLOAD_DIR: str = 'uploads'
    STORAGE_TYPE: str = 'local'
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: Optional[str] = None
    AWS_REGION: Optional[str] = None
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None
    EMAIL_ENABLED: bool = False
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = 'noreply@sellor.com'
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    class Config:
        env_file = str(_ENV_PATH)
        case_sensitive = True
settings = Settings()