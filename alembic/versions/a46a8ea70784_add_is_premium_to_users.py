"""Add is_premium to users

Revision ID: a46a8ea70784
Revises: a5baf677035e
Create Date: 2025-06-28 14:04:05.776088

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a46a8ea70784'
down_revision: Union[str, None] = 'a5baf677035e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('users', sa.Column('is_premium', sa.Boolean(), nullable=True))
    op.drop_column('users', 'subscription_expiry')
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('users', sa.Column('subscription_expiry', postgresql.TIMESTAMP(), autoincrement=False, nullable=True))
    op.drop_column('users', 'is_premium')
    # ### end Alembic commands ###
