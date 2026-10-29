from fastapi import APIRouter, HTTPException
from psycopg2.extras import RealDictCursor

from app.database import get_connection

router=APIRouter()

@router.get("/flats")
def get_flats(
    house_id: int,
    query: str = ""
):
    query = query.strip()
    
    conn = get_connection()

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        if query:
            cur.execute("""
                SELECT
                    flat_id,
                    account,
                    full_address,
                    flat_num,
                    kad_num,
                    sqr_base,
                    mft.name_short AS flat_type_name
                FROM mst_flat mf
                JOIN mst_flat_type mft
                    ON mft.mst_flat_type_id = mf.mst_flat_type_id
                WHERE house_id = %s
                    AND flat_num ILIKE %s
                ORDER BY flat_num_norm NULLS LAST, flat_num
                LIMIT 50
            """, (
                house_id,
                f"{query}%"
            ))

        else:
            cur.execute("""
                SELECT
                    flat_id,
                    house_id,
                    account,
                    flat_num,
                    full_address,
                    kad_num,
                    sqr_base
                FROM mst_flat
                WHERE house_id = %s
                ORDER BY living, flat_num_norm NULLS LAST, flat_num
            """, (house_id,)
            )

        return cur.fetchall()
    
    finally:
        conn.close()

@router.get("/flats/search")
def search_flats_by_account(account: str):
    conn = get_connection()

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
            SELECT
                mf.flat_id,
                mf.house_id,
                mf.account,
                mf.flat_num,
                mf.full_address,
                mf.kad_num,
                mf.sqr_base,
                mf.sqr_full,
                -1 * coalesce((select (f_oleg_accountsaldo(mf.flat_id, 3)).paysaldo), 0) debt,
                -1 * coalesce((select (f_oleg_accountsaldo(mf.flat_id)).paysaldo), 0) balance
            FROM mst_flat mf
            WHERE mf.account = %s
            """, (f"{account}",)
        )

        flat = cur.fetchone()

        if flat is None:
            raise HTTPException(
                status_code=404,
                detail="Account not found"
            )

        return flat
    
    finally:
        conn.close()

@router.get("/flats/{flat_id}")
def get_flat_card(flat_id: int):
    conn = get_connection()

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # =====================================================
        # 1. Информация о помещении
        #
        # flat_id здесь используется только для того,
        # чтобы определить house_id + flat_num.
        # =====================================================

        cur.execute("""
            SELECT
                mf.flat_id,
                mf.house_id,
                mf.flat_num,
                mf.full_address,
                mf.kad_num,
                mf.sqr_base,
                mf.sqr_full,
                -1 * coalesce((select (f_oleg_accountsaldo(mf.flat_id, 3)).paysaldo), 0) debt,
                -1 * coalesce((select (f_oleg_accountsaldo(mf.flat_id)).paysaldo), 0) balance
            FROM mst_flat mf
            WHERE mf.flat_id = %s
        """, (flat_id,))

        flat = cur.fetchone()

        if flat is None:
            raise HTTPException(
                status_code=404,
                detail="Flat not found"
            )

        # =====================================================
        # 2. Все лицевые счета этого помещения
        #
        # Помещение определяется комбинацией:
        # house_id + flat_num
        # =====================================================

        cur.execute("""
            SELECT
                mf.flat_id,
                mf.account,
                mf.sqr_base,
                mf.billable
            FROM mst_flat mf
            WHERE mf.house_id = %s
              AND mf.flat_num = %s
            ORDER BY mf.account
        """, (
            flat["house_id"],
            flat["flat_num"]
        ))

        accounts = cur.fetchall()

        # =====================================================
        # 3. Формируем ответ
        # =====================================================

        return {
            "flat": flat,
            "accounts": accounts
        }

    finally:
        conn.close()