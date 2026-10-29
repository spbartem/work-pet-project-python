from fastapi import APIRouter

from app.database import get_connection
from psycopg2.extras import RealDictCursor

router = APIRouter()

@router.get("/houses")
def search_houses(street_id: int, query: str):
    query = query.strip()

    if len(query) < 1:
        return {
            "houses": []
        }

    conn = get_connection()

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
            SELECT
                house_id,
                street_id,
                house_num,
                building,
                liter,
                construction,
                full_address
            FROM mst_house
            WHERE street_id = %s
                AND (
                    house_num ILIKE %s
                    OR full_address ILIKE %s
                    )
            ORDER BY house_num, building, liter, construction
            LIMIT 20
        """, (
            street_id,
            f"{query}%",
            f"%{query}%"
        ))

        houses = cur.fetchall()

        return {
            "houses": houses
        }

    finally:
        conn.close()