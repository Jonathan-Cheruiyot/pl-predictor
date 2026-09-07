"""SQLAlchemy ORM models (named orm.py to avoid shadowing the root model.py)."""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Fixture(Base):
    __tablename__ = "fixtures"

    id = Column(Integer, primary_key=True, index=True)
    home_team = Column(String, nullable=False)
    away_team = Column(String, nullable=False)
    kickoff_time = Column(DateTime, nullable=False)  # stored as naive UTC
    gameweek = Column(Integer, nullable=True)
    status = Column(String, nullable=False, default="upcoming")  # "upcoming" | "completed"
    actual_home = Column(Integer, nullable=True)
    actual_away = Column(Integer, nullable=True)

    model_prediction = relationship("ModelPrediction", back_populates="fixture", uselist=False)
    user_predictions = relationship("UserPrediction", back_populates="fixture")
    score = relationship("Score", back_populates="fixture")


class ModelPrediction(Base):
    __tablename__ = "model_predictions"

    id = Column(Integer, primary_key=True, index=True)
    fixture_id = Column(Integer, ForeignKey("fixtures.id"), unique=True, nullable=False)
    predicted_home = Column(Integer, nullable=False)
    predicted_away = Column(Integer, nullable=False)
    p_home_win = Column(Float, nullable=False)
    p_draw = Column(Float, nullable=False)
    p_away_win = Column(Float, nullable=False)

    fixture = relationship("Fixture", back_populates="model_prediction")


class UserPrediction(Base):
    __tablename__ = "user_predictions"

    id = Column(Integer, primary_key=True, index=True)
    fixture_id = Column(Integer, ForeignKey("fixtures.id"), nullable=False)
    username = Column(String, nullable=False)
    predicted_home = Column(Integer, nullable=False)
    predicted_away = Column(Integer, nullable=False)
    submitted_at = Column(DateTime, nullable=False)  # naive UTC

    fixture = relationship("Fixture", back_populates="user_predictions")


class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    fixture_id = Column(Integer, ForeignKey("fixtures.id"), nullable=False)
    username = Column(String, nullable=False)
    user_score = Column(Integer, nullable=False)
    model_score = Column(Integer, nullable=False)

    fixture = relationship("Fixture", back_populates="score")
