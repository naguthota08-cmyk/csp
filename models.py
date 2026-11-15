"""
Smart Poultry Farm Management System - SQLAlchemy Models
Complete database models for MySQL 8 & SQLite compatibility.
All 12 tables with relationships, indexes, constraints, and audit timestamps.
"""

from datetime import datetime, date, timezone
from decimal import Decimal
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import (
    CheckConstraint, UniqueConstraint, Index, event
)
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

# ------------------------------------------------------------------------------
# 1. User Model
# ------------------------------------------------------------------------------
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=True, index=True)
    phone = db.Column(db.String(50), unique=True, nullable=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="farmer") # 'farmer', 'veterinarian', 'admin'
    mobile_verified = db.Column(db.Boolean, nullable=False, default=False)
    account_status = db.Column(db.String(20), nullable=False, default="pending") # 'pending', 'active', 'suspended'
    language = db.Column(db.String(10), nullable=False, default="en")
    specialization = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime, nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    farms = db.relationship("Farm", backref="owner", cascade="all, delete-orphan", lazy="dynamic")
    otps = db.relationship("OtpVerification", backref="user", cascade="all, delete-orphan", lazy="dynamic")

    @property
    def mobile_number(self):
        return self.phone

    @mobile_number.setter
    def mobile_number(self, val):
        self.phone = val

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "mobile_number": self.phone,
            "role": self.role,
            "mobile_verified": self.mobile_verified,
            "account_status": self.account_status,
            "language": self.language,
            "specialization": self.specialization,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

# ------------------------------------------------------------------------------
# 2. OTP Verification Model
# ------------------------------------------------------------------------------
class OtpVerification(db.Model):
    __tablename__ = "otp_verifications"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    otp_hash = db.Column(db.String(255), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    attempts = db.Column(db.Integer, nullable=False, default=0)
    is_used = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("idx_otp_user_lookup", "user_id", "is_used", "expires_at"),
    )

    def is_expired(self) -> bool:
        now = datetime.now(timezone.utc)
        expires = self.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        return now > expires

# ------------------------------------------------------------------------------
# 3. Farm Model
# ------------------------------------------------------------------------------
class Farm(db.Model):
    __tablename__ = "farms"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = db.Column(db.Integer, nullable=True) # Compatibility for existing sqlite schema
    farm_name = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(255), nullable=True)
    address = db.Column(db.Text, nullable=True)
    total_capacity = db.Column(db.Integer, nullable=False, default=0)
    farm_type = db.Column(db.String(50), nullable=False, default="Broiler")
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime, nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        CheckConstraint("total_capacity >= 0", name="chk_farms_capacity"),
    )

    # Relationships
    flocks = db.relationship("Flock", backref="farm", cascade="all, delete-orphan", lazy="dynamic")
    environment_records = db.relationship("EnvironmentRecord", backref="farm", cascade="all, delete-orphan", lazy="dynamic")
    expenses = db.relationship("Expense", backref="farm", cascade="all, delete-orphan", lazy="dynamic")
    sales = db.relationship("Sale", backref="farm", cascade="all, delete-orphan", lazy="dynamic")
    tasks = db.relationship("Task", backref="farm", cascade="all, delete-orphan", lazy="dynamic")
    alerts = db.relationship("Alert", backref="farm", cascade="all, delete-orphan", lazy="dynamic")

    def __init__(self, **kwargs):
        if "owner_id" in kwargs and "user_id" not in kwargs:
            kwargs["user_id"] = kwargs["owner_id"]
        elif "user_id" in kwargs and "owner_id" not in kwargs:
            kwargs["owner_id"] = kwargs["user_id"]
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "owner_id": self.owner_id,
            "farm_name": self.farm_name,
            "location": self.location,
            "address": self.address,
            "total_capacity": self.total_capacity,
            "farm_type": self.farm_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

# ------------------------------------------------------------------------------
# 4. Flock Model
# ------------------------------------------------------------------------------
class Flock(db.Model):
    __tablename__ = "flocks"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    farm_id = db.Column(db.Integer, db.ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_number = db.Column(db.String(100), nullable=False)
    bird_type = db.Column(db.String(100), nullable=False, default="Broiler")
    breed = db.Column(db.String(100), nullable=False)
    initial_bird_count = db.Column(db.Integer, nullable=False)
    current_bird_count = db.Column(db.Integer, nullable=False)
    arrival_date = db.Column(db.Date, nullable=False)
    expected_sale_date = db.Column(db.Date, nullable=True)
    target_weight_kg = db.Column(db.Numeric(6, 2), nullable=False, default=Decimal("2.00"))
    status = db.Column(db.String(20), nullable=False, default="active") # 'active', 'sold', 'closed'
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime, nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        UniqueConstraint("farm_id", "batch_number", name="uq_farm_batch"),
        CheckConstraint("initial_bird_count >= 0", name="chk_initial_bird_count"),
        CheckConstraint("current_bird_count >= 0", name="chk_current_bird_count"),
        Index("idx_flocks_farm_status", "farm_id", "status"),
    )

    # Relationships
    daily_records = db.relationship("DailyRecord", backref="flock", cascade="all, delete-orphan", lazy="dynamic")
    feed_records = db.relationship("FeedRecord", backref="flock", cascade="all, delete-orphan", lazy="dynamic")
    egg_records = db.relationship("EggRecord", backref="flock", cascade="all, delete-orphan", lazy="dynamic")

    batch_code = db.Column(db.String(100), nullable=True) # Compatibility for existing sqlite schema
    initial_birds = db.Column(db.Integer, nullable=True) # Compatibility
    current_birds = db.Column(db.Integer, nullable=True) # Compatibility

    def __init__(self, **kwargs):
        if "batch_number" in kwargs and "batch_code" not in kwargs:
            kwargs["batch_code"] = kwargs["batch_number"]
        elif "batch_code" in kwargs and "batch_number" not in kwargs:
            kwargs["batch_number"] = kwargs["batch_code"]

        if "initial_bird_count" in kwargs and "initial_birds" not in kwargs:
            kwargs["initial_birds"] = kwargs["initial_bird_count"]
        elif "initial_birds" in kwargs and "initial_bird_count" not in kwargs:
            kwargs["initial_bird_count"] = kwargs["initial_birds"]

        if "current_bird_count" in kwargs and "current_birds" not in kwargs:
            kwargs["current_birds"] = kwargs["current_bird_count"]
        elif "current_birds" in kwargs and "current_bird_count" not in kwargs:
            kwargs["current_bird_count"] = kwargs["current_birds"]

        super().__init__(**kwargs)

    @property
    def age_days(self) -> int:
        if self.arrival_date:
            return max(0, (date.today() - self.arrival_date).days)
        return 0

    def to_dict(self):
        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "batch_number": self.batch_number,
            "batch_code": self.batch_number,
            "bird_type": self.bird_type,
            "breed": self.breed,
            "initial_bird_count": self.initial_bird_count,
            "current_bird_count": self.current_bird_count,
            "initial_birds": self.initial_bird_count,
            "current_birds": self.current_bird_count,
            "arrival_date": self.arrival_date.isoformat() if self.arrival_date else None,
            "expected_sale_date": self.expected_sale_date.isoformat() if self.expected_sale_date else None,
            "target_weight_kg": float(self.target_weight_kg) if self.target_weight_kg is not None else 2.0,
            "status": self.status,
            "age_days": self.age_days,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

# ------------------------------------------------------------------------------
# 5. Daily Record Model
# ------------------------------------------------------------------------------
class DailyRecord(db.Model):
    __tablename__ = "daily_records"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    flock_id = db.Column(db.Integer, db.ForeignKey("flocks.id", ondelete="CASCADE"), nullable=False, index=True)
    record_date = db.Column(db.Date, nullable=False)
    opening_birds = db.Column(db.Integer, nullable=False)
    mortality = db.Column(db.Integer, nullable=False, default=0)
    culls = db.Column(db.Integer, nullable=False, default=0)
    closing_birds = db.Column(db.Integer, nullable=False)
    average_weight_kg = db.Column(db.Numeric(6, 3), nullable=False, default=Decimal("0.000"))
    feed_consumed_kg = db.Column(db.Numeric(8, 2), nullable=False, default=Decimal("0.00"))
    water_consumed_liters = db.Column(db.Numeric(8, 2), nullable=False, default=Decimal("0.00"))
    eggs_produced = db.Column(db.Integer, nullable=False, default=0)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime, nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        UniqueConstraint("flock_id", "record_date", name="uq_flock_record_date"),
        CheckConstraint("opening_birds >= 0", name="chk_opening_birds"),
        CheckConstraint("mortality >= 0", name="chk_mortality"),
        CheckConstraint("culls >= 0", name="chk_culls"),
        CheckConstraint("closing_birds >= 0", name="chk_closing_birds"),
        CheckConstraint("feed_consumed_kg >= 0", name="chk_feed_consumed"),
        CheckConstraint("water_consumed_liters >= 0", name="chk_water_consumed"),
        CheckConstraint("eggs_produced >= 0", name="chk_daily_eggs"),
        Index("idx_daily_flock_date", "flock_id", "record_date"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "flock_id": self.flock_id,
            "record_date": self.record_date.isoformat() if self.record_date else None,
            "opening_birds": self.opening_birds,
            "mortality": self.mortality,
            "culls": self.culls,
            "closing_birds": self.closing_birds,
            "average_weight_kg": float(self.average_weight_kg) if self.average_weight_kg is not None else 0.0,
            "feed_consumed_kg": float(self.feed_consumed_kg) if self.feed_consumed_kg is not None else 0.0,
            "water_consumed_liters": float(self.water_consumed_liters) if self.water_consumed_liters is not None else 0.0,
            "eggs_produced": self.eggs_produced,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

# ------------------------------------------------------------------------------
# 6. Feed Record Model
# ------------------------------------------------------------------------------
class FeedRecord(db.Model):
    __tablename__ = "feed_records"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    flock_id = db.Column(db.Integer, db.ForeignKey("flocks.id", ondelete="CASCADE"), nullable=False, index=True)
    record_date = db.Column(db.Date, nullable=False)
    feed_type = db.Column(db.String(100), nullable=False)
    quantity_kg = db.Column(db.Numeric(8, 2), nullable=False)
    unit_cost = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    total_cost = db.Column(db.Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    supplier = db.Column(db.String(150), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("quantity_kg >= 0", name="chk_feed_qty"),
        CheckConstraint("total_cost >= 0", name="chk_feed_cost"),
        Index("idx_feed_flock_date", "flock_id", "record_date"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "flock_id": self.flock_id,
            "record_date": self.record_date.isoformat() if self.record_date else None,
            "feed_type": self.feed_type,
            "quantity_kg": float(self.quantity_kg) if self.quantity_kg is not None else 0.0,
            "unit_cost": float(self.unit_cost) if self.unit_cost is not None else 0.0,
            "total_cost": float(self.total_cost) if self.total_cost is not None else 0.0,
            "supplier": self.supplier,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

# ------------------------------------------------------------------------------
# 7. Egg Record Model
# ------------------------------------------------------------------------------
class EggRecord(db.Model):
    __tablename__ = "egg_records"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    flock_id = db.Column(db.Integer, db.ForeignKey("flocks.id", ondelete="CASCADE"), nullable=False, index=True)
    record_date = db.Column(db.Date, nullable=False)
    eggs_produced = db.Column(db.Integer, nullable=False, default=0)
    eggs_sold = db.Column(db.Integer, nullable=False, default=0)
    damaged_eggs = db.Column(db.Integer, nullable=False, default=0)
    selling_price_per_egg = db.Column(db.Numeric(8, 2), nullable=False, default=Decimal("0.00"))
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("eggs_produced >= 0", name="chk_egg_prod"),
        CheckConstraint("eggs_sold >= 0", name="chk_egg_sold"),
        CheckConstraint("damaged_eggs >= 0", name="chk_egg_dam"),
        Index("idx_egg_flock_date", "flock_id", "record_date"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "flock_id": self.flock_id,
            "record_date": self.record_date.isoformat() if self.record_date else None,
            "eggs_produced": self.eggs_produced,
            "eggs_sold": self.eggs_sold,
            "damaged_eggs": self.damaged_eggs,
            "selling_price_per_egg": float(self.selling_price_per_egg) if self.selling_price_per_egg is not None else 0.0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

# ------------------------------------------------------------------------------
# 8. Environment Record Model
# ------------------------------------------------------------------------------
class EnvironmentRecord(db.Model):
    __tablename__ = "environment_records"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    farm_id = db.Column(db.Integer, db.ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    flock_id = db.Column(db.Integer, db.ForeignKey("flocks.id", ondelete="SET NULL"), nullable=True, index=True)
    recorded_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    temperature_celsius = db.Column(db.Numeric(5, 2), nullable=False)
    humidity_percentage = db.Column(db.Numeric(5, 2), nullable=False)
    ammonia_ppm = db.Column(db.Numeric(5, 2), nullable=False, default=Decimal("0.00"))
    notes = db.Column(db.Text, nullable=True)

    __table_args__ = (
        CheckConstraint("humidity_percentage >= 0.00 AND humidity_percentage <= 100.00", name="chk_env_humidity"),
        CheckConstraint("ammonia_ppm >= 0.00", name="chk_env_ammonia"),
        Index("idx_env_farm_time", "farm_id", "recorded_at"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "flock_id": self.flock_id,
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else None,
            "temperature_celsius": float(self.temperature_celsius) if self.temperature_celsius is not None else 0.0,
            "humidity_percentage": float(self.humidity_percentage) if self.humidity_percentage is not None else 0.0,
            "ammonia_ppm": float(self.ammonia_ppm) if self.ammonia_ppm is not None else 0.0,
            "notes": self.notes,
        }

# ------------------------------------------------------------------------------
# 9. Expense Model
# ------------------------------------------------------------------------------
class Expense(db.Model):
    __tablename__ = "expenses"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    farm_id = db.Column(db.Integer, db.ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    flock_id = db.Column(db.Integer, db.ForeignKey("flocks.id", ondelete="SET NULL"), nullable=True, index=True)
    expense_date = db.Column(db.Date, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    payment_method = db.Column(db.String(50), nullable=False, default="Cash")
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("amount >= 0.00", name="chk_expense_amount"),
        Index("idx_expense_farm_date", "farm_id", "expense_date"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "flock_id": self.flock_id,
            "expense_date": self.expense_date.isoformat() if self.expense_date else None,
            "category": self.category,
            "description": self.description,
            "amount": float(self.amount) if self.amount is not None else 0.0,
            "payment_method": self.payment_method,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

# ------------------------------------------------------------------------------
# 10. Sale Model
# ------------------------------------------------------------------------------
class Sale(db.Model):
    __tablename__ = "sales"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    farm_id = db.Column(db.Integer, db.ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    flock_id = db.Column(db.Integer, db.ForeignKey("flocks.id", ondelete="SET NULL"), nullable=True, index=True)
    sale_date = db.Column(db.Date, nullable=False)
    product_type = db.Column(db.String(50), nullable=False, default="birds") # 'birds', 'eggs', 'manure', 'other'
    quantity = db.Column(db.Numeric(10, 2), nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    total_amount = db.Column(db.Numeric(12, 2), nullable=False)
    buyer_name = db.Column(db.String(150), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("quantity >= 0.00", name="chk_sales_qty"),
        CheckConstraint("total_amount >= 0.00", name="chk_sales_amount"),
        Index("idx_sales_farm_date", "farm_id", "sale_date"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "flock_id": self.flock_id,
            "sale_date": self.sale_date.isoformat() if self.sale_date else None,
            "product_type": self.product_type,
            "quantity": float(self.quantity) if self.quantity is not None else 0.0,
            "unit_price": float(self.unit_price) if self.unit_price is not None else 0.0,
            "total_amount": float(self.total_amount) if self.total_amount is not None else 0.0,
            "buyer_name": self.buyer_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

# ------------------------------------------------------------------------------
# 11. Task Model
# ------------------------------------------------------------------------------
class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    farm_id = db.Column(db.Integer, db.ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    flock_id = db.Column(db.Integer, db.ForeignKey("flocks.id", ondelete="SET NULL"), nullable=True, index=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(50), nullable=False, default="pending") # 'pending', 'in_progress', 'completed', 'cancelled'
    priority = db.Column(db.String(20), nullable=False, default="medium") # 'low', 'medium', 'high', 'urgent'
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime, nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        Index("idx_tasks_farm_status", "farm_id", "status"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "flock_id": self.flock_id,
            "title": self.title,
            "description": self.description,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "status": self.status,
            "priority": self.priority,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

# ------------------------------------------------------------------------------
# 12. Alert Model
# ------------------------------------------------------------------------------
class Alert(db.Model):
    __tablename__ = "alerts"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    farm_id = db.Column(db.Integer, db.ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    flock_id = db.Column(db.Integer, db.ForeignKey("flocks.id", ondelete="SET NULL"), nullable=True, index=True)
    alert_type = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    message_en = db.Column(db.Text, nullable=True) # Compatibility for legacy sqlite alerts table
    message_te = db.Column(db.Text, nullable=True) # Compatibility
    severity = db.Column(db.String(20), nullable=False, default="warning") # 'info', 'warning', 'danger', 'critical'
    is_read = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("idx_alerts_farm_unread", "farm_id", "is_read"),
    )

    def __init__(self, **kwargs):
        if "message" in kwargs:
            kwargs.setdefault("message_en", kwargs["message"])
            kwargs.setdefault("message_te", kwargs["message"])
        elif "message_en" in kwargs:
            kwargs.setdefault("message", kwargs["message_en"])
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "farm_id": self.farm_id,
            "flock_id": self.flock_id,
            "alert_type": self.alert_type,
            "message": self.message,
            "message_en": self.message_en or self.message,
            "message_te": self.message_te or self.message,
            "severity": self.severity,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

# ------------------------------------------------------------------------------
# Event Listeners to Automatically Maintain Current Bird Count
# ------------------------------------------------------------------------------
@event.listens_for(DailyRecord, "after_insert")
def update_flock_bird_count_insert(mapper, connection, target):
    """
    On inserting a daily record, update the flock's current_bird_count
    to the closing_birds, guarding against negative counts.
    """
    closing = max(0, int(target.closing_birds or 0))
    connection.execute(
        Flock.__table__.update()
        .where(Flock.id == target.flock_id)
        .values(current_bird_count=closing)
    )

@event.listens_for(DailyRecord, "after_update")
def update_flock_bird_count_update(mapper, connection, target):
    """
    On updating a daily record, synchronize current_bird_count.
    """
    closing = max(0, int(target.closing_birds or 0))
    connection.execute(
        Flock.__table__.update()
        .where(Flock.id == target.flock_id)
        .values(current_bird_count=closing)
    )
