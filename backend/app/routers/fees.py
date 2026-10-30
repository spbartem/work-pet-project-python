from fastapi import APIRouter
from psycopg2.extras import RealDictCursor

from app.database import get_connection

router = APIRouter()

@router.get("/api/fees")
def get_fees(flat_id: int):
    conn = get_connection()

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT 
                fee_id,
                fee_year,
                fee_month,
                amount,
                discount,
                cancelled
            FROM fee
            WHERE flat_id = %s
            ORDER BY 
                fee_year DESC,
                fee_month DESC
        """,
        (flat_id,))

        row = cur.fetchall()

        return row
    
    finally:
        conn.close