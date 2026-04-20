from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserUpdate, UserResponse
from app.systems.user_system import UserSystem
from app.utils.storage import save_upload_file
router = APIRouter(prefix='/api/users', tags=['Users'])

@router.put('/me', response_model=UserResponse, summary='Update my profile', description='Update profile fields including username, email, phone, and avatar URL.')
def update_my_profile(update_data: UserUpdate, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)):
    system = UserSystem(db)
    return system.update_user_profile(current_user.id, update_data)

@router.post('/me/avatar', response_model=UserResponse, summary='Upload avatar', description='Upload an avatar image. Replaces any existing avatar. Supported: JPEG, PNG, WebP.')
async def upload_avatar(file: UploadFile=File(...), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)):
    image_url = await save_upload_file(file, subfolder='avatars')
    system = UserSystem(db)
    return system.update_user_profile(current_user.id, UserUpdate(avatar_url=image_url))