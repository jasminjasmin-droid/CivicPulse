import os
import uuid
from datetime import datetime, timezone, time
from typing import Union

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    status,
    Request,
    UploadFile,
    File,
)
from fastapi.responses import FileResponse
from fastapi import status as http_status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import text, func, case
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
from app.models import (
    User,
    Complaint,
    Department,
    ComplaintHistory,
    ComplaintEvidence,
    Notification,
)
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
    NotificationResponse,
    NotificationReadAllResponse,
    NotificationUnreadCountResponse,
    CitizenDashboardResponse,
    AuthorityDashboardResponse,
)
from app.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)


# ============================================================
# UPLOAD DIRECTORY SETUP
# ============================================================

UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "uploads",
)

os.makedirs(UPLOAD_DIR, exist_ok=True)


# ============================================================
# DATABASE SETUP
# ============================================================

# Create missing tables without deleting existing data
Base.metadata.create_all(bind=engine)

# Add required columns safely if they do not already exist
with engine.connect() as conn:
    conn.execute(
        text(
            "ALTER TABLE complaints "
            "ADD COLUMN IF NOT EXISTS department_id INTEGER "
            "REFERENCES departments(id);"
        )
    )

    conn.execute(
        text(
            "ALTER TABLE complaints "
            "ADD COLUMN IF NOT EXISTS assigned_authority_id INTEGER "
            "REFERENCES users(id);"
        )
    )

    conn.execute(
        text(
            "ALTER TABLE complaints "
            "ADD COLUMN IF NOT EXISTS priority VARCHAR(20) "
            "DEFAULT 'Medium';"
        )
    )

    conn.execute(
        text(
            "UPDATE complaints "
            "SET priority = 'Medium' "
            "WHERE priority IS NULL;"
        )
    )

    conn.execute(
        text(
            "ALTER TABLE complaints "
            "ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;"
        )
    )

    conn.execute(
        text(
            "ALTER TABLE complaints "
            "ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;"
        )
    )

    conn.execute(
        text(
            "ALTER TABLE complaints "
            "ADD COLUMN IF NOT EXISTS address TEXT;"
        )
    )

    conn.commit()


# ============================================================
# SEED DEFAULT DEPARTMENTS
# ============================================================

_db = SessionLocal()

if _db.query(Department).count() == 0:
    _db.add_all(
        [
            Department(
                name="Sanitation",
                description="Waste management, street sweeping, and sanitation.",
            ),
            Department(
                name="Roads",
                description="Road maintenance, pothole repairs, and pavement works.",
            ),
            Department(
                name="Water Supply",
                description="Drinking water pipelines, leakage, and supply schedule.",
            ),
            Department(
                name="Electricity",
                description="Power supply, transformers, and electrical safety.",
            ),
            Department(
                name="Public Health",
                description="Mosquito control, vector management, and public health.",
            ),
            Department(
                name="Street Lighting",
                description="Streetlight pole repairs, LED installations, and maintenance.",
            ),
            Department(
                name="Other",
                description="General civic issues and miscellaneous grievances.",
            ),
        ]
    )

    _db.commit()

_db.close()


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="CivicPulse API",
    description="Backend API for the CivicPulse smart governance platform",
    version="1.0.0",
)

security = HTTPBearer(auto_error=False)


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# AUTHENTICATION
# ============================================================

def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:

    token: str | None = None

    if credentials and credentials.credentials:
        token = credentials.credentials

    else:
        # Fallback to Authorization header
        auth_header = (
            request.headers.get("Authorization")
            or request.headers.get("authorization")
        )

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
    current_user: User = Depends(get_current_user),
) -> User:

    if current_user.role != "authority":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: authority role required",
        )

    return current_user


# ============================================================
# ROOT / HEALTH
# ============================================================

@app.get("/")
def root():
    return {"message": "CivicPulse API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# ============================================================
# USERS
# ============================================================

@app.post("/users", response_model=UserResponse)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
):

    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        role=user.role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.get("/users", response_model=list[UserResponse])
def get_users(
    db: Session = Depends(get_db),
):
    return db.query(User).all()


# ============================================================
# LOGIN
# ============================================================

@app.post("/login", response_model=LoginResponse)
def login(
    user: UserLogin,
    db: Session = Depends(get_db),
):

    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not verify_password(
        user.password,
        existing_user.password,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        data={
            "sub": str(existing_user.id),
            "email": existing_user.email,
            "role": existing_user.role,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "message": "Login successful",
        "user_id": existing_user.id,
        "name": existing_user.name,
        "email": existing_user.email,
        "role": existing_user.role,
    }


# ============================================================
# CURRENT USER
# ============================================================

@app.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user),
):

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
    }


# ============================================================
# DEPARTMENTS
# ============================================================

@app.get(
    "/departments",
    response_model=list[DepartmentResponse],
)
def get_departments(
    db: Session = Depends(get_db),
):

    return (
        db.query(Department)
        .order_by(Department.id.asc())
        .all()
    )


# ============================================================
# COMPLAINT CONFIGURATION
# ============================================================

SUPPORTED_CATEGORIES = {
    "Sanitation",
    "Roads",
    "Water Supply",
    "Electricity",
    "Public Health",
    "Street Lighting",
    "Public Safety",
    "Drainage",
    "Other",
}

ALLOWED_PRIORITIES = {
    "Low",
    "Medium",
    "High",
    "Critical",
}

ALLOWED_COMPLAINT_STATUSES = {
    "Pending",
    "In Progress",
    "Resolved",
}


# ============================================================
# CREATE COMPLAINT
# ============================================================

@app.post(
    "/complaints",
    response_model=ComplaintResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_complaint(
    complaint: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # --------------------------------------------------------
    # Validate category
    # --------------------------------------------------------

    if complaint.category not in SUPPORTED_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid category '{complaint.category}'. "
                "Supported categories are: "
                "Sanitation, Roads, Water Supply, Electricity, "
                "Public Health, Street Lighting, Public Safety, "
                "Drainage, Other."
            ),
        )

    # --------------------------------------------------------
    # Validate priority
    # --------------------------------------------------------

    if complaint.priority and complaint.priority not in ALLOWED_PRIORITIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid priority '{complaint.priority}'. "
                "Allowed priorities are: "
                "Low, Medium, High, Critical."
            ),
        )

    # --------------------------------------------------------
    # Validate latitude
    # --------------------------------------------------------

    if (
        complaint.latitude is not None
        and not (-90.0 <= complaint.latitude <= 90.0)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latitude must be between -90 and 90 degrees.",
        )

    # --------------------------------------------------------
    # Validate longitude
    # --------------------------------------------------------

    if (
        complaint.longitude is not None
        and not (-180.0 <= complaint.longitude <= 180.0)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Longitude must be between -180 and 180 degrees.",
        )

    # --------------------------------------------------------
    # Create complaint
    # --------------------------------------------------------

    new_complaint = Complaint(
        title=complaint.title,
        description=complaint.description,
        category=complaint.category,

        # Use supplied priority if available,
        # otherwise default to Medium
        priority=complaint.priority or "Medium",

        status=complaint.status or "Pending",

        citizen_id=current_user.id,

        latitude=complaint.latitude,
        longitude=complaint.longitude,
        address=complaint.address,
    )

    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    # --------------------------------------------------------
    # Complaint creation history
    # --------------------------------------------------------

    history_entry = ComplaintHistory(
        complaint_id=new_complaint.id,
        action="Created",
        old_value=None,
        new_value="Complaint created",
        performed_by=current_user.id,
    )

    db.add(history_entry)
    db.commit()

    return new_complaint


# ============================================================
# HELPER: DATE PARSER
# ============================================================

def parse_date_param(
    param_name: str,
    value: str | None,
    is_end: bool = False,
) -> datetime | None:
    if not value or not value.strip():
        return None
    val = value.strip()
    try:
        if len(val) == 10:
            parsed_d = datetime.strptime(val, "%Y-%m-%d").date()
            if is_end:
                return datetime.combine(parsed_d, time.max)
            else:
                return datetime.combine(parsed_d, time.min)
        dt = datetime.fromisoformat(val)
        return dt
    except Exception:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date format for '{param_name}'. Expected YYYY-MM-DD or ISO 8601.",
        )


# ============================================================
# DASHBOARD
# ============================================================

@app.get(
    "/dashboard",
    response_model=Union[AuthorityDashboardResponse, CitizenDashboardResponse],
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "authority":
        row = (
            db.query(
                func.count(Complaint.id).label("total"),
                func.count(case((Complaint.status == "Pending", 1))).label("pending"),
                func.count(case((Complaint.status == "In Progress", 1))).label("in_progress"),
                func.count(case((Complaint.status == "Resolved", 1))).label("resolved"),
                func.count(case((Complaint.priority == "High", 1))).label("high_priority"),
                func.count(case((Complaint.priority == "Critical", 1))).label("critical_priority"),
            )
            .first()
        )
        return AuthorityDashboardResponse(
            total=row.total or 0,
            pending=row.pending or 0,
            in_progress=row.in_progress or 0,
            resolved=row.resolved or 0,
            high_priority=row.high_priority or 0,
            critical_priority=row.critical_priority or 0,
        )

    row = (
        db.query(
            func.count(Complaint.id).label("total"),
            func.count(case((Complaint.status == "Pending", 1))).label("pending"),
            func.count(case((Complaint.status == "In Progress", 1))).label("in_progress"),
            func.count(case((Complaint.status == "Resolved", 1))).label("resolved"),
        )
        .filter(Complaint.citizen_id == current_user.id)
        .first()
    )
    return CitizenDashboardResponse(
        total=row.total or 0,
        pending=row.pending or 0,
        in_progress=row.in_progress or 0,
        resolved=row.resolved or 0,
    )


# ============================================================
# GET COMPLAINTS + ADVANCED FILTERS + SEARCH
# ============================================================

@app.get(
    "/complaints",
    response_model=list[ComplaintResponse],
)
def get_complaints(
    search: str | None = None,
    status: str | None = None,
    category: str | None = None,
    priority: str | None = None,
    department_id: str | None = None,
    assigned_authority_id: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # Keep existing access control
    # --------------------------------------------------------
    if current_user.role == "authority":
        query = db.query(Complaint)
    else:
        query = db.query(Complaint).filter(
            Complaint.citizen_id == current_user.id
        )

    # --------------------------------------------------------
    # Filter: search (title + description)
    # --------------------------------------------------------
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            (Complaint.title.ilike(search_term))
            | (Complaint.description.ilike(search_term))
        )

    # --------------------------------------------------------
    # Filter: status (case-insensitive, validated)
    # --------------------------------------------------------
    if status is not None and status.strip() != "":
        st = status.strip().lower()
        status_map = {s.lower(): s for s in ALLOWED_COMPLAINT_STATUSES}
        if st not in status_map:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid status '{status}'. "
                    "Allowed statuses are: Pending, In Progress, Resolved."
                ),
            )
        query = query.filter(Complaint.status.ilike(status_map[st]))

    # --------------------------------------------------------
    # Filter: category (case-insensitive substring)
    # --------------------------------------------------------
    if category is not None and category.strip() != "":
        cat_term = f"%{category.strip()}%"
        query = query.filter(Complaint.category.ilike(cat_term))

    # --------------------------------------------------------
    # Filter: priority (case-insensitive, validated)
    # --------------------------------------------------------
    if priority is not None and priority.strip() != "":
        pr = priority.strip().lower()
        priority_map = {p.lower(): p for p in ALLOWED_PRIORITIES}
        if pr not in priority_map:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid priority '{priority}'. "
                    "Allowed priorities are: Low, Medium, High, Critical."
                ),
            )
        query = query.filter(Complaint.priority.ilike(priority_map[pr]))

    # --------------------------------------------------------
    # Filter: department_id (integer validated)
    # --------------------------------------------------------
    if department_id is not None and str(department_id).strip() != "":
        try:
            parsed_dept_id = int(str(department_id).strip())
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid department_id '{department_id}': must be an integer.",
            )
        query = query.filter(Complaint.department_id == parsed_dept_id)

    # --------------------------------------------------------
    # Filter: assigned_authority_id (integer validated)
    # --------------------------------------------------------
    if assigned_authority_id is not None and str(assigned_authority_id).strip() != "":
        try:
            parsed_auth_id = int(str(assigned_authority_id).strip())
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid assigned_authority_id '{assigned_authority_id}': must be an integer.",
            )
        query = query.filter(Complaint.assigned_authority_id == parsed_auth_id)

    # --------------------------------------------------------
    # Filter: start_date / end_date (inclusive, validated)
    # --------------------------------------------------------
    dt_start: datetime | None = None
    dt_end: datetime | None = None

    if start_date is not None and start_date.strip() != "":
        dt_start = parse_date_param("start_date", start_date, is_end=False)

    if end_date is not None and end_date.strip() != "":
        dt_end = parse_date_param("end_date", end_date, is_end=True)

    if dt_start and dt_end:
        s_cmp = dt_start.replace(tzinfo=None) if dt_start.tzinfo else dt_start
        e_cmp = dt_end.replace(tzinfo=None) if dt_end.tzinfo else dt_end
        if s_cmp > e_cmp:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Invalid date range: 'start_date' cannot be after 'end_date'.",
            )

    if dt_start:
        query = query.filter(Complaint.created_at >= dt_start)

    if dt_end:
        query = query.filter(Complaint.created_at <= dt_end)

    return query.all()



# ============================================================
# GET SINGLE COMPLAINT
# ============================================================

@app.get(
    "/complaints/{complaint_id}",
    response_model=ComplaintResponse,
)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    complaint = (
        db.query(Complaint)
        .filter(Complaint.id == complaint_id)
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    if (
        current_user.role != "authority"
        and complaint.citizen_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    return complaint


# ============================================================
# UPDATE COMPLAINT STATUS
# ============================================================

@app.patch(
    "/complaints/{complaint_id}/status",
    response_model=ComplaintResponse,
)
def update_complaint_status(
    complaint_id: int,
    status_update: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    current_authority: User = Depends(get_current_authority),
):

    if status_update.status not in ALLOWED_COMPLAINT_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid status '{status_update.status}'. "
                "Allowed statuses are: "
                "Pending, In Progress, Resolved."
            ),
        )

    complaint = (
        db.query(Complaint)
        .filter(Complaint.id == complaint_id)
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    old_status = complaint.status
    new_status = status_update.status

    if old_status != new_status:
        complaint.status = new_status
        complaint.updated_at = datetime.now(timezone.utc)

        db.add(
            ComplaintHistory(
                complaint_id=complaint.id,
                action="Status Changed",
                old_value=old_status,
                new_value=new_status,
                performed_by=current_authority.id,
            )
        )

        db.add(
            Notification(
                user_id=complaint.citizen_id,
                complaint_id=complaint.id,
                message=f"Complaint #{complaint.id} status changed from '{old_status}' to '{new_status}'.",
                is_read=False,
            )
        )

        db.commit()
        db.refresh(complaint)

    return complaint


# ============================================================
# UPDATE COMPLAINT PRIORITY
# ============================================================

@app.patch(
    "/complaints/{complaint_id}/priority",
    response_model=ComplaintResponse,
)
def update_complaint_priority(
    complaint_id: int,
    priority_update: ComplaintPriorityUpdate,
    db: Session = Depends(get_db),
    current_authority: User = Depends(get_current_authority),
):

    if priority_update.priority not in ALLOWED_PRIORITIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid priority '{priority_update.priority}'. "
                "Allowed priorities are: "
                "Low, Medium, High, Critical."
            ),
        )

    complaint = (
        db.query(Complaint)
        .filter(Complaint.id == complaint_id)
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    old_priority = complaint.priority or "Medium"
    new_priority = priority_update.priority

    if old_priority != new_priority:
        complaint.priority = new_priority
        complaint.updated_at = datetime.now(timezone.utc)

        db.add(
            ComplaintHistory(
                complaint_id=complaint.id,
                action="Priority Changed",
                old_value=old_priority,
                new_value=new_priority,
                performed_by=current_authority.id,
            )
        )

        db.add(
            Notification(
                user_id=complaint.citizen_id,
                complaint_id=complaint.id,
                message=f"Complaint #{complaint.id} priority changed from '{old_priority}' to '{new_priority}'.",
                is_read=False,
            )
        )

        db.commit()
        db.refresh(complaint)

    return complaint


# ============================================================
# ASSIGN COMPLAINT
# ============================================================

@app.patch(
    "/complaints/{complaint_id}/assignment",
    response_model=ComplaintResponse,
)
def assign_complaint(
    complaint_id: int,
    assignment: ComplaintAssignmentUpdate,
    db: Session = Depends(get_db),
    current_authority: User = Depends(get_current_authority),
):

    complaint = (
        db.query(Complaint)
        .filter(Complaint.id == complaint_id)
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    if (
        assignment.department_id is None
        and assignment.assigned_authority_id is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "At least one of department_id or "
                "assigned_authority_id must be provided"
            ),
        )

    # --------------------------------------------------------
    # Validate department
    # --------------------------------------------------------

    new_dept = None

    if assignment.department_id is not None:

        new_dept = (
            db.query(Department)
            .filter(
                Department.id == assignment.department_id
            )
            .first()
        )

        if not new_dept:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Department with id "
                    f"{assignment.department_id} does not exist"
                ),
            )

    # --------------------------------------------------------
    # Validate authority
    # --------------------------------------------------------

    new_auth = None

    if assignment.assigned_authority_id is not None:

        new_auth = (
            db.query(User)
            .filter(
                User.id == assignment.assigned_authority_id
            )
            .first()
        )

        if not new_auth:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Authority user with id "
                    f"{assignment.assigned_authority_id} "
                    "does not exist"
                ),
            )

        if new_auth.role != "authority":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Assigned user with id "
                    f"{assignment.assigned_authority_id} "
                    "must have authority role"
                ),
            )

    has_changed = False

    # --------------------------------------------------------
    # Department assignment history
    # --------------------------------------------------------

    if (
        assignment.department_id is not None
        and assignment.department_id != complaint.department_id
    ):
        has_changed = True

        old_dept_obj = (
            db.query(Department)
            .filter(
                Department.id == complaint.department_id
            )
            .first()
            if complaint.department_id
            else None
        )

        old_dept_name = (
            f"{old_dept_obj.name} Department"
            if old_dept_obj
            else None
        )

        new_dept_name = f"{new_dept.name} Department"

        action_name = (
            "Complaint Assigned"
            if old_dept_obj is None
            else "Department Changed"
        )

        db.add(
            ComplaintHistory(
                complaint_id=complaint.id,
                action=action_name,
                old_value=old_dept_name,
                new_value=new_dept_name,
                performed_by=current_authority.id,
            )
        )

        db.add(
            Notification(
                user_id=complaint.citizen_id,
                complaint_id=complaint.id,
                message=f"Complaint #{complaint.id} department updated to '{new_dept.name}'.",
                is_read=False,
            )
        )

        complaint.department_id = assignment.department_id

    # --------------------------------------------------------
    # Authority assignment history
    # --------------------------------------------------------

    if (
        assignment.assigned_authority_id is not None
        and assignment.assigned_authority_id
        != complaint.assigned_authority_id
    ):
        has_changed = True

        old_auth_obj = (
            db.query(User)
            .filter(
                User.id == complaint.assigned_authority_id
            )
            .first()
            if complaint.assigned_authority_id
            else None
        )

        old_auth_name = (
            old_auth_obj.name
            if old_auth_obj
            else None
        )

        new_auth_name = new_auth.name

        action_name = (
            "Authority Assigned"
            if old_auth_obj is None
            else "Authority Changed"
        )

        db.add(
            ComplaintHistory(
                complaint_id=complaint.id,
                action=action_name,
                old_value=old_auth_name,
                new_value=new_auth_name,
                performed_by=current_authority.id,
            )
        )

        db.add(
            Notification(
                user_id=complaint.citizen_id,
                complaint_id=complaint.id,
                message=f"Complaint #{complaint.id} assigned to authority officer '{new_auth.name}'.",
                is_read=False,
            )
        )

        complaint.assigned_authority_id = (
            assignment.assigned_authority_id
        )

    if has_changed:
        complaint.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(complaint)

    return complaint


# ============================================================
# COMPLAINT HISTORY
# ============================================================

@app.get(
    "/complaints/{complaint_id}/history",
    response_model=list[ComplaintHistoryResponse],
)
def get_complaint_history(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    complaint = (
        db.query(Complaint)
        .filter(Complaint.id == complaint_id)
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    # Only owner citizen or authority can view history
    if (
        current_user.role != "authority"
        and complaint.citizen_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    return (
        db.query(ComplaintHistory)
        .filter(
            ComplaintHistory.complaint_id == complaint_id
        )
        .order_by(
            ComplaintHistory.created_at.asc(),
            ComplaintHistory.id.asc(),
        )
        .all()
    )


# ============================================================
# EVIDENCE CONFIGURATION
# ============================================================

ALLOWED_EVIDENCE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".pdf",
}

ALLOWED_EVIDENCE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "application/pdf",
}

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


# ============================================================
# UPLOAD COMPLAINT EVIDENCE
# ============================================================

@app.post(
    "/complaints/{complaint_id}/evidence",
    response_model=ComplaintEvidenceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_complaint_evidence(
    complaint_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    complaint = (
        db.query(Complaint)
        .filter(Complaint.id == complaint_id)
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    # Only owner citizen or authority can upload evidence
    if (
        current_user.role != "authority"
        and complaint.citizen_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    # --------------------------------------------------------
    # Validate file type
    # --------------------------------------------------------

    original_filename = file.filename or "evidence"

    file_ext = os.path.splitext(
        original_filename
    )[1].lower()

    if (
        file_ext not in ALLOWED_EVIDENCE_EXTENSIONS
        or file.content_type not in ALLOWED_EVIDENCE_MIME_TYPES
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Unsupported file type. "
                "Allowed types are: "
                "image/jpeg (.jpg, .jpeg), "
                "image/png (.png), "
                "application/pdf (.pdf)."
            ),
        )

    # --------------------------------------------------------
    # Read and validate file size
    # --------------------------------------------------------

    content = await file.read()

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "File size exceeds the 10 MB limit "
                f"({len(content)} bytes uploaded)."
            ),
        )

    # --------------------------------------------------------
    # Safe server-side filename
    # --------------------------------------------------------

    safe_filename = f"{uuid.uuid4().hex}{file_ext}"

    storage_path = os.path.join(
        UPLOAD_DIR,
        safe_filename,
    )

    with open(storage_path, "wb") as f:
        f.write(content)

    clean_display_name = os.path.basename(
        original_filename
    )

    # --------------------------------------------------------
    # Save evidence metadata
    # --------------------------------------------------------

    evidence = ComplaintEvidence(
        complaint_id=complaint.id,
        uploaded_by=current_user.id,
        file_name=clean_display_name,
        file_type=file.content_type,
        file_size=len(content),
        file_path=storage_path,
    )

    db.add(evidence)

    # --------------------------------------------------------
    # Evidence history
    # --------------------------------------------------------

    db.add(
        ComplaintHistory(
            complaint_id=complaint.id,
            action="Evidence Uploaded",
            old_value=None,
            new_value=clean_display_name,
            performed_by=current_user.id,
        )
    )

    db.commit()
    db.refresh(evidence)

    return evidence


# ============================================================
# GET COMPLAINT EVIDENCE
# ============================================================

@app.get(
    "/complaints/{complaint_id}/evidence",
    response_model=list[ComplaintEvidenceResponse],
)
def get_complaint_evidence_list(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    complaint = (
        db.query(Complaint)
        .filter(Complaint.id == complaint_id)
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    # Owner citizen or authority only
    if (
        current_user.role != "authority"
        and complaint.citizen_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    return (
        db.query(ComplaintEvidence)
        .filter(
            ComplaintEvidence.complaint_id == complaint_id
        )
        .order_by(
            ComplaintEvidence.created_at.asc()
        )
        .all()
    )


# ============================================================
# DOWNLOAD COMPLAINT EVIDENCE
# ============================================================

@app.get(
    "/complaints/{complaint_id}/evidence/{evidence_id}"
)
def download_complaint_evidence(
    complaint_id: int,
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    complaint = (
        db.query(Complaint)
        .filter(Complaint.id == complaint_id)
        .first()
    )

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    if (
        current_user.role != "authority"
        and complaint.citizen_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    evidence = (
        db.query(ComplaintEvidence)
        .filter(
            ComplaintEvidence.id == evidence_id,
            ComplaintEvidence.complaint_id == complaint_id,
        )
        .first()
    )

    if (
        not evidence
        or not os.path.exists(evidence.file_path)
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence file not found",
        )

    return FileResponse(
        path=evidence.file_path,
        media_type=evidence.file_type,
        filename=evidence.file_name,
    )


# ============================================================
# NOTIFICATIONS
# ============================================================

@app.get(
    "/notifications",
    response_model=list[NotificationResponse],
)
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@app.get(
    "/notifications/unread-count",
    response_model=NotificationUnreadCountResponse,
)
def get_unread_notification_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    unread_count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
        .count()
    )
    return {"unread_count": unread_count}


@app.patch(
    "/notifications/read-all",
    response_model=NotificationReadAllResponse,
)
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated_count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
        .update(
            {"is_read": True},
            synchronize_session=False,
        )
    )
    db.commit()

    return {
        "message": "All notifications marked as read",
        "updated_count": updated_count,
    }


@app.patch(
    "/notifications/{notification_id}/read",
    response_model=NotificationResponse,
)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id)
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    if not notification.is_read:
        notification.is_read = True
        db.commit()
        db.refresh(notification)

    return notification