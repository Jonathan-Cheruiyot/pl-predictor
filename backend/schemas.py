from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


class FixtureCreate(BaseModel):
    home_team: str
    away_team: str
    kickoff_time: datetime  # client sends ISO 8601; stored as naive UTC
    gameweek: Optional[int] = None



class FixtureOut(BaseModel):
    id: int
    home_team: str
    away_team: str
    kickoff_time: datetime
    gameweek: Optional[int]
    status: str
    actual_home: Optional[int]
    actual_away: Optional[int]

    model_config = {"from_attributes": True}


class ModelPredictionOut(BaseModel):
    fixture_id: int
    predicted_home: int
    predicted_away: int
    p_home_win: float
    p_draw: float
    p_away_win: float

    model_config = {"from_attributes": True}


class UserPredictionCreate(BaseModel):
    username: str
    predicted_home: int
    predicted_away: int

    @field_validator("predicted_home", "predicted_away")
    @classmethod
    def non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Goals cannot be negative")
        return v


class UserPredictionOut(BaseModel):
    id: int
    fixture_id: int
    username: str
    predicted_home: int
    predicted_away: int
    submitted_at: datetime

    model_config = {"from_attributes": True}


class ResultSubmit(BaseModel):
    actual_home: int
    actual_away: int

    @field_validator("actual_home", "actual_away")
    @classmethod
    def non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Goals cannot be negative")
        return v


class ScoreOut(BaseModel):
    fixture_id: int
    username: str
    user_score: int
    model_score: int

    model_config = {"from_attributes": True}


class LeaderboardEntry(BaseModel):
    username: str
    total_user_score: int
    total_model_score: int
    matches_played: int
