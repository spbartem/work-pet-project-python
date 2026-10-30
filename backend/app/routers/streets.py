from fastapi import APIRouter
from psycopg2.extras import RealDictCursor

from app.database import get_connection

router = APIRouter()

@router.get("/api/streets")
def search_streets(query: str):
    query = query.strip()

    if len(query) < 4:
        return {
            streets: []
        }

    conn = get_connection()

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT
                street_id,
                name,
                town_id
            FROM mst_street
            WHERE name_norm ILIKE %s
            ORDER BY name
            LIMIT 20 
        """, (f"%{query}%",))

        streets = cur.fetchall()

        return {
            "streets": streets
        }

    finally:
        conn.close