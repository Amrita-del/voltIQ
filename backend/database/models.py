from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, JSON, DateTime
from sqlalchemy.orm import declarative_base, relationship
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'User'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True) # Adding name
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_admin = Column(Boolean, default=False)
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    bills = relationship("Bill", back_populates="user")
    reports = relationship("Report", back_populates="user")

class UserProfile(Base):
    __tablename__ = 'UserProfile'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('User.id'))
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    household_size = Column(Integer, nullable=True)
    home_type = Column(String, nullable=True)
    home_type_enc = Column(Integer, nullable=True)
    utility = Column(String, nullable=True)
    budget_rs = Column(Float, nullable=True)
    appliances = Column(JSON, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="profile")

class Bill(Base):
    __tablename__ = 'Bill'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('User.id'))
    month = Column(Integer)
    year = Column(Integer)
    units_kwh = Column(Float)
    amount_rs = Column(Float)
    file_path = Column(String, nullable=True)
    parse_method = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="bills")

class Report(Base):
    __tablename__ = 'Report'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('User.id'))
    bill_id = Column(Integer, ForeignKey('Bill.id'))
    device_breakdown = Column(JSON, nullable=True)
    slab_alert = Column(JSON, nullable=True)
    vampire_load = Column(JSON, nullable=True)
    anomaly = Column(JSON, nullable=True)
    carbon = Column(JSON, nullable=True)
    budget_analysis = Column(JSON, nullable=True)
    device_health = Column(JSON, nullable=True)
    ai_narrative = Column(String, nullable=True)
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="reports")

class Feedback(Base):
    __tablename__ = 'Feedback'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('User.id'))
    report_id = Column(Integer, ForeignKey('Report.id'))
    correction_signal = Column(String)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)

class ChatHistory(Base):
    __tablename__ = 'ChatHistory'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('User.id'))
    session_id = Column(String, index=True)
    messages = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class WeatherCache(Base):
    __tablename__ = 'WeatherCache'
    id = Column(Integer, primary_key=True, index=True)
    city = Column(String)
    month = Column(Integer)
    year = Column(Integer)
    avg_temp = Column(Float)
    CDD = Column(Float)
    season = Column(String)
    fetched_at = Column(DateTime, default=datetime.datetime.utcnow)
