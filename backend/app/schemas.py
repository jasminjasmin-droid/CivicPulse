from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "citizen"


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    message: str = "Login successful"
    user_id: int
    name: str
    email: EmailStr
    role: str


class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: str
    status: Optional[str] = "Pending"


class ComplaintResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    status: str
    citizen_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ComplaintStatusUpdate(BaseModel):
    status: str

