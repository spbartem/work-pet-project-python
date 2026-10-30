from fastapi import APIRouter
from psycopg2.extras import RealDictCursor

from app.database import get_connection

router = APIRouter()

@router.get("/api/payments")
def get_payments(flat_id: int):
    conn = get_connection()

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT
                payment_id,
                flat_id,
                payment_date,
                amount,
                comment,
                used,
                group_id,
                reversed,
                penalty_amount,
                period_year,
                period_month
            FROM payment
            WHERE flat_id = %s
            ORDER BY
                payment_date desc,
                group_id,
                period_year * 100 + period_month desc
        """, (flat_id,))

        row = cur.fetchall()

        return row
    
    finally:
        conn.close