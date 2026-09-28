import os
import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, status, Request, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
from app.models import User, Complaint, Department, ComplaintHistory, ComplaintEvidence
from app.schemas import (
    UserCreate,
    UserResponse,
    UserLogin,
    LoginResponse,
    DepartmentResponse,
    ComplaintCreate,
    ComplaintResponse,
    ComplaintStatusUpdate,
    ComplaintPriorityUpdate,
    ComplaintAssignmentUpdate,
    ComplaintHistoryResponse,
    ComplaintEvidenceResponse,
)
from app.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

# Upload directory setup
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Ensure tables are created without modifying existing database data
Base.metadata.create_all(bind=engine)
with engine.connect() as conn:
    conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id);"))
    conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS assigned_authority_id INTEGER REFERENCES users(id);"))
    conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'Medium';"))
    conn.execute(text("UPDATE complaints SET priority = 'Medium' WHERE priority IS NULL;"))
    conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;"))
    conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;"))
    conn.execute(text("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS address TEXT;"))
    conn.commit()

# Seed default departments if table is empty
_db = SessionLocal()
if _db.query(Department).count() == 0:
    _db.add_all([
        Department(name="Sanitation", description="Waste management, street sweeping, and sanitation."),
        Department(name="Roads", description="Road maintenance, pothole repairs, and pavement works."),
        Department(name="Water Supply", description="Drinking water pipelines, leakage, and supply schedule."),
        Department(name="Electricity", description="Power supply, transformers, and electrical safety."),
        Department(name="Public Health", description="Mosquito control, vector management, and public health."),
        Department(name="Street Lighting", description="Streetlight pole repairs, LED installations, and maintenance."),
        Department(name="Other", description="General civic issues and miscellaneous grievances.")
    ])
    _db.commit()
_db.close()

app = FastAPI(
    title="CivicPulse API",
    description="Backend API for the CivicPulse smart governance platform",
    version="1.0.0"
)

security = HTTPBearer(auto_error=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token: str | None = None
    if credentials and credentials.credentials:
        token = credentials.credentials
    else:
        # Fallback to Authorization header if Bearer prefix was provided directly
        auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]
            elif len(parts) == 1:
                token = parts[0]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials: invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials: token missing subject",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials: invalid user ID in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_current_authority(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != "authority":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: authority role required"
        )
    return current_user


@app.get("/")
def root():
    return {"message": "CivicPulse API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.get("/users", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()


@app.post("/login", response_model=LoginResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()

    if not existing_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(user.password, existing_user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(
        data={
            "sub": str(existing_user.id),
            "email": existing_user.email,
            "role": existing_user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "message": "Login successful",
        "user_id": existing_user.id,
        "name": existing_user.name,
        "email": existing_user.email,
        "role": existing_user.role
    }


@app.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }


@app.get("/departments", response_model=list[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).order_by(Department.id.asc()).all()


SUPPORTED_CATEGORIES = {
    "Sanitation",
    "Roads",
    "Water Supply",
    "Electricity",
    "Public Health",
    "Street Lighting",
    "Public Safety",
    "Drainage",
    "Other"
}

ALLOWED_PRIORITIES = {"Low", "Medium", "High", "Critical"}


@app.post("/complaints", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(
    complaint: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate category
    if complaint.category not in SUPPORTED_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category '{complaint.category}'. Supported categories are: Sanitation, Roads, Water Supply, Electricity, Public Health, Street Lighting, Public Safety, Drainage, Other."
        )

    # Validate priority if supplied
    if complaint.priority and complaint.priority not in ALLOWED_PRIORITIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid priority '{complaint.priority}'. Allowed priorities are: Low, Medium, High, Critical."
        )

    # Validate coordinates
    if complaint.latitude is not None and not (-90.0 <= complaint.latitude <= 90.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latitude must be between -90 and 90 degrees."
        )

    if complaint.longitude is not None and not (-180.0 <= complaint.longitude <= 180.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Longitude must be between -180 and 180 degrees."
        )

    new_complaint = Complaint(
        title=complaint.title,
        description=complaint.description,
        category=complaint.category,
        priority="Medium",  # Default priority is Medium; authorities can update later
        status=complaint.status or "Pending",
        citizen_id=current_user.id,
        latitude=complaint.latitude,
        longitude=complaint.longitude,
        address=complaint.address
    )

    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    # Record history: complaint created
    history_entry = ComplaintHistory(
        complaint_id=new_complaint.id,
        action="Created",
        old_value=None,
        new_value="Complaint created",
        performed_by=current_user.id
    )
    db.add(history_entry)
    db.commit()

    return new_complaint


@app.get("/complaints", response_model=list[ComplaintResponse])
def get_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "authority":
        return db.query(Complaint).all()
    return db.query(Complaint).filter(Complaint.citizen_id == current_user.id).all()


@app.get("/complaints/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )

    if current_user.role != "authority" and complaint.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )

    return complaint


ALLOWED_COMPLAINT_STATUSES = {"Pending", "In Progress", "Resolved"}


@app.patch("/complaints/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_id: int,
    status_update: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    current_authority: User = Depends(get_current_authority)
):
    if status_update.status not in ALLOWED_COMPLAINT_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{status_update.status}'. Allowed statuses are: Pending, In Progress, Resolved."
        )

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )

    old_status = complaint.status
    new_status = status_update.status

    complaint.status = new_status
    complaint.updated_at = datetime.now(timezone.utc)

    if old_status != new_status:
        db.add(ComplaintHistory(
            complaint_id=complaint.id,
            action="Status Changed",
            old_value=old_status,
            new_value=new_status,
            performed_by=current_authority.id
        ))

    db.commit()
    db.refresh(complaint)

    return complaint


@app.patch("/complaints/{complaint_id}/priority", response_model=ComplaintResponse)
def update_complaint_priority(
    complaint_id: int,
    priority_update: ComplaintPriorityUpdate,
    db: Session = Depends(get_db),
    current_authority: User = Depends(get_current_authority)
):
    if priority_update.priority not in ALLOWED_PRIORITIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid priority '{priority_update.priority}'. Allowed priorities are: Low, Medium, High, Critical."
        )

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )

    old_priority = complaint.priority or "Medium"
    new_priority = priority_update.priority

    complaint.priority = new_priority
    complaint.updated_at = datetime.now(timezone.utc)

    if old_priority != new_priority:
        db.add(ComplaintHistory(
            complaint_id=complaint.id,
            action="Priority Changed",
            old_value=old_priority,
            new_value=new_priority,
            performed_by=current_authority.id
        ))

    db.commit()
    db.refresh(complaint)

    return complaint


@app.patch("/complaints/{complaint_id}/assignment", response_model=ComplaintResponse)
def assign_complaint(
    complaint_id: int,
    assignment: ComplaintAssignmentUpdate,
    db: Session = Depends(get_db),
    current_authority: User = Depends(get_current_authority)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )

    if assignment.department_id is None and assignment.assigned_authority_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one of department_id or assigned_authority_id must be provided"
        )

    # Validate department if provided
    new_dept = None
    if assignment.department_id is not None:
        new_dept = db.query(Department).filter(Department.id == assignment.department_id).first()
        if not new_dept:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Department with id {assignment.department_id} does not exist"
            )

    # Validate assigned authority if provided
    new_auth = None
    if assignment.assigned_authority_id is not None:
        new_auth = db.query(User).filter(User.id == assignment.assigned_authority_id).first()
        if not new_auth:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Authority user with id {assignment.assigned_authority_id} does not exist"
            )
        if new_auth.role != "authority":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Assigned user with id {assignment.assigned_authority_id} must have authority role"
            )

    # Handle department assignment history
    if assignment.department_id is not None and assignment.department_id != complaint.department_id:
        old_dept_obj = db.query(Department).filter(Department.id == complaint.department_id).first() if complaint.department_id else None
        old_dept_name = f"{old_dept_obj.name} Department" if old_dept_obj else None
        new_dept_name = f"{new_dept.name} Department"
        action_name = "Complaint Assigned" if old_dept_obj is None else "Department Changed"

        db.add(ComplaintHistory(
            complaint_id=complaint.id,
            action=action_name,
            old_value=old_dept_name,
            new_value=new_dept_name,
            performed_by=current_authority.id
        ))
        complaint.department_id = assignment.department_id

    # Handle authority assignment history
    if assignment.assigned_authority_id is not None and assignment.assigned_authority_id != complaint.assigned_authority_id:
        old_auth_obj = db.query(User).filter(User.id == complaint.assigned_authority_id).first() if complaint.assigned_authority_id else None
        old_auth_name = old_auth_obj.name if old_auth_obj else None
        new_auth_name = new_auth.name
        action_name = "Authority Assigned" if old_auth_obj is None else "Authority Changed"

        db.add(ComplaintHistory(
            complaint_id=complaint.id,
            action=action_name,
            old_value=old_auth_name,
            new_value=new_auth_name,
            performed_by=current_authority.id
        ))
        complaint.assigned_authority_id = assignment.assigned_authority_id

    complaint.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(complaint)

    return complaint


@app.get("/complaints/{complaint_id}/history", response_model=list[ComplaintHistoryResponse])
def get_complaint_history(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )

    # Only owner citizen or authority can view complaint history
    if current_user.role != "authority" and complaint.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )

    return db.query(ComplaintHistory)\
        .filter(ComplaintHistory.complaint_id == complaint_id)\
        .order_by(ComplaintHistory.created_at.asc(), ComplaintHistory.id.asc())\
        .all()


ALLOWED_EVIDENCE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
ALLOWED_EVIDENCE_MIME_TYPES = {"image/jpeg", "image/png", "application/pdf"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit


@app.post("/complaints/{complaint_id}/evidence", response_model=ComplaintEvidenceResponse, status_code=status.HTTP_201_CREATED)
async def upload_complaint_evidence(
    complaint_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )

    # Only owner citizen or authority can upload evidence
    if current_user.role != "authority" and complaint.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )

    # Validate file extension and MIME type
    original_filename = file.filename or "evidence"
    file_ext = os.path.splitext(original_filename)[1].lower()

    if file_ext not in ALLOWED_EVIDENCE_EXTENSIONS or file.content_type not in ALLOWED_EVIDENCE_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Allowed types are: image/jpeg (.jpg, .jpeg), image/png (.png), application/pdf (.pdf)."
        )

    # Read and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds the 10 MB limit ({len(content)} bytes uploaded)."
        )

    # Generate safe server-side storage filename (prevent path traversal)
    safe_filename = f"{uuid.uuid4().hex}{file_ext}"
    storage_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(storage_path, "wb") as f:
        f.write(content)

    clean_display_name = os.path.basename(original_filename)

    evidence = ComplaintEvidence(
        complaint_id=complaint.id,
        uploaded_by=current_user.id,
        file_name=clean_display_name,
        file_type=file.content_type,
        file_size=len(content),
        file_path=storage_path
    )
    db.add(evidence)

    # Record history
    db.add(ComplaintHistory(
        complaint_id=complaint.id,
        action="Evidence Uploaded",
        old_value=None,
        new_value=clean_display_name,
        performed_by=current_user.id
    ))

    db.commit()
    db.refresh(evidence)

    return evidence


@app.get("/complaints/{complaint_id}/evidence", response_model=list[ComplaintEvidenceResponse])
def get_complaint_evidence_list(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )

    # Access control: owner citizen or authority
    if current_user.role != "authority" and complaint.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )

    return db.query(ComplaintEvidence)\
        .filter(ComplaintEvidence.complaint_id == complaint_id)\
        .order_by(ComplaintEvidence.created_at.asc())\
        .all()


@app.get("/complaints/{complaint_id}/evidence/{evidence_id}")
def download_complaint_evidence(
    complaint_id: int,
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )

    if current_user.role != "authority" and complaint.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )

    evidence = db.query(ComplaintEvidence)\
        .filter(ComplaintEvidence.id == evidence_id, ComplaintEvidence.complaint_id == complaint_id)\
        .first()

    if not evidence or not os.path.exists(evidence.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence file not found"
        )

    return FileResponse(
        path=evidence.file_path,
        media_type=evidence.file_type,
        filename=evidence.file_name
    )
