from sqlalchemy import inspect, text  # type: ignore[import]
from sqlalchemy.engine import Engine  # type: ignore[import]

from app.models import ROLE_ENUM_NAME, UserRole


def _enum_values_sql() -> str:
    """Return the SQL list of allowed user role values."""
    return ", ".join(f"'{role.value}'" for role in UserRole)


def ensure_role_enum_type(engine: Engine) -> None:
    """Create the Postgres enum type for user roles if it does not exist."""
    ddl = (
        "DO $$\n"
        "BEGIN\n"
        f"    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '{ROLE_ENUM_NAME}') THEN\n"
        f"        CREATE TYPE {ROLE_ENUM_NAME} AS ENUM ({_enum_values_sql()});\n"
        "    END IF;\n"
        "END\n"
        "$$;"
    )
    with engine.begin() as conn:
        conn.execute(text(ddl))


def ensure_role_column(engine: Engine) -> None:
    """
    Ensure the `users.role` column exists so SQLAlchemy can safely query it.

    This function is safe to call multiple times and is idempotent.
    """
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = [col["name"] for col in inspector.get_columns("users")]
    if "role" in columns:
        return

    ensure_role_enum_type(engine)

    alter_sql = (
        "ALTER TABLE users\n"
        f"ADD COLUMN IF NOT EXISTS role {ROLE_ENUM_NAME} NOT NULL DEFAULT :default;"
    )
    with engine.begin() as conn:
        conn.execute(text(alter_sql), {"default": UserRole.USER.value})

