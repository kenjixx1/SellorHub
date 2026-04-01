"""
Address routes - buyer shipping address CRUD.
"""
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.address import AddressCreate, AddressUpdate, AddressResponse
from app.services.address_service import AddressService

router = APIRouter(prefix="/api/addresses", tags=["Addresses"])


@router.get(
    "",
    response_model=List[AddressResponse],
    summary="List my addresses",
    description="Returns all shipping addresses for the current user.",
)
def list_addresses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AddressService(db).list_addresses(current_user.id)


@router.get(
    "/{address_id}",
    response_model=AddressResponse,
    summary="Get address",
)
def get_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AddressService(db).get_address(address_id, current_user.id)


@router.post(
    "",
    response_model=AddressResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create address",
    description="Add a new shipping address.",
)
def create_address(
    data: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AddressService(db).create_address(current_user.id, data)


@router.put(
    "/{address_id}",
    response_model=AddressResponse,
    summary="Update address",
)
def update_address(
    address_id: int,
    data: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AddressService(db).update_address(address_id, current_user.id, data)


@router.delete(
    "/{address_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete address",
)
def delete_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    AddressService(db).delete_address(address_id, current_user.id)
