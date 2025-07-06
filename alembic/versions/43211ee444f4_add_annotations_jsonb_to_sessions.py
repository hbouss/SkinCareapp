"""Add annotations JSONB to sessions

Revision ID: 43211ee444f4
Revises: 
Create Date: 2025-05-17 23:38:53.555228

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '43211ee444f4'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1) ajoutez la colonne avec un DEFAULT vide pour ne pas casser les INSERT existants
    op.add_column(
        'sessions',
        sa.Column(
            'annotations',
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'[]'")   # ou '{}' selon ce que vous voulez par défaut
        )
    )
    # 2) ensuite, retirez ce DEFAULT si vous ne le voulez plus pour les nouveaux inserts
    op.alter_column('sessions', 'annotations', server_default=None)


def downgrade():
    op.drop_column('sessions', 'annotations')