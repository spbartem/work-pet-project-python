from fastapi import APIRouter
from psycopg2.extras import RealDictCursor

from app.database import get_connection

router = APIRouter()

@router.get("/discounts")
def get_discount(flat_id: int):
    conn = get_connection()

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
            SELECT 
                statusid,
                int_value,
                note,
                date_value,
                num_value
            FROM oleg_addinfo_flat oaf
            WHERE
                oaf.addinfotype_id = 26 and
                oaf.flat_id = %s
            ORDER BY
                statusid,
                note,
                date_value,
                num_value
        """, (flat_id,))

        row = cur.fetchall()

        return row

    finally:
        pass