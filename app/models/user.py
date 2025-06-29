from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: str
    hashed_password: str
    is_admin: bool = False
    is_premium: bool = False

class UserPublic(UserBase):
    id: str
    is_admin: bool
    is_premium: bool = False

class UserAdmin(UserPublic):
    """Pour l’admin : expose aussi is_premium"""
    id: int
    email: str
    is_admin: bool
    is_premium: bool