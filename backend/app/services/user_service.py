"""
User service for user profile management.
"""
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.user import UserUpdate
from app.utils.security import hash_password


class UserService:
    """Service for user management operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        Get user by ID.
        
        Args:
            user_id: User ID
            
        Returns:
            User object if found, None otherwise
        """
        return self.db.query(User).filter(User.id == user_id).first()
    
    def update_user_profile(self, user_id: int, update_data: UserUpdate) -> User:
        """
        Update user profile.
        
        Args:
            user_id: User ID to update
            update_data: Updated user data
            
        Returns:
            Updated User object
            
        Raises:
            HTTPException: If user not found or validation fails
        """
        user = self.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update fields if provided
        if update_data.username is not None:
            # Check if username is already taken
            existing = self.db.query(User).filter(
                User.username == update_data.username,
                User.id != user_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
            user.username = update_data.username
        
        if update_data.email is not None:
            # Check if email is already taken
            existing = self.db.query(User).filter(
                User.email == update_data.email,
                User.id != user_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already taken"
                )
            user.email = update_data.email
        
        if update_data.phone_number is not None:
            user.phone_number = update_data.phone_number
        
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def delete_user(self, user_id: int) -> bool:
        """
        Delete user account.
        
        Args:
            user_id: User ID to delete
            
        Returns:
            True if deleted successfully
            
        Raises:
            HTTPException: If user not found
        """
        user = self.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        self.db.delete(user)
        self.db.commit()
        
        return True
