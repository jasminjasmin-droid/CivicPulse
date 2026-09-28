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


class DepartmentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: str
    priority: Optional[str] = "Medium"
    status: Optional[str] = "Pending"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None


class ComplaintResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    priority: str = "Medium"
    status: str
    citizen_id: int
    department_id: Optional[int] = None
    assigned_authority_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ComplaintStatusUpdate(BaseModel):
    status: str


class ComplaintPriorityUpdate(BaseModel):
    priority: str


class ComplaintAssignmentUpdate(BaseModel):
    department_id: Optional[int] = None
    assigned_authority_id: Optional[int] = None


class ComplaintHistoryResponse(BaseModel):
    id: int
    complaint_id: int
    action: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    performed_by: int
    created_at: datetime
    performed_by_name: Optional[str] = None

    class Config:
        from_attributes = True


class ComplaintEvidenceResponse(BaseModel):
    id: int
    complaint_id: int
    uploaded_by: int
    file_name: str
    file_type: str
    file_size: int
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    complaint_id: Optional[int] = None
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationReadAllResponse(BaseModel):
    message: str
    updated_count: int


class NotificationUnreadCountResponse(BaseModel):
    unread_count: int


class CitizenDashboardResponse(BaseModel):
    total: int
    pending: int
    in_progress: int
    resolved: int


class AuthorityDashboardResponse(BaseModel):
    total: int
    pending: int
    in_progress: int
    resolved: int
    high_priority: int
    critical_priority: int



