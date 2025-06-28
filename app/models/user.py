from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: str
    hashed_password: str
    is_admin: bool = False

class UserPublic(UserBase):
    id: str
    is_admin: bool
    is_premium: bool = False