from fastapi import APIRouter, UploadFile, File, HTTPException
from lxml import etree
from datetime import datetime, timezone
from collections import defaultdict
from fractions import Fraction
from decimal import Decimal, ROUND_HALF_UP

from app.database import get_connection

GKU_CODE = "558610100000"

router = APIRouter(prefix="/api", tags=["xml_parking_compare"])


# ---------- утилиты ----------
def _same_object(a: str, b: str) -> bool:
    """right_number и change_record_number относятся к одному объекту?"""
    if not a or not b:
        return False
    # сравниваем префикс до последнего '-', т.е. '78:31:0103301:1792-78/011'
    return

def _parse_dt(s):
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError:
        return None


def _norm(v):
    if v is None:
        return None
    try:
        return str(int(str(v).strip()))
    except ValueError:
        return str(v).strip()


def _text(el, path):
    v = el.findtext(path)
    return v.strip() if v else None

def _to_fraction(num, den):
    """Приводит пару (числитель, знаменатель) к Fraction или None."""
    if num is None or den is None:
        return None
    try:
        # float 754.0 → Decimal("754"), чтобы не тащить двоичную погрешность
        def _dec(v):
            if isinstance(v, float):
                return Decimal(str(v))
            if isinstance(v, Decimal):
                return v
            return Decimal(str(v).strip())

        n = _dec(num)
        d = _dec(den)
        if d == 0:
            return None
        return Fraction(n) / Fraction(d)
    except (ValueError, ArithmeticError, TypeError):
        return None

    
def _share_area(sqr_full, numerator, denominator):
    """Площадь доли: sqr_full * numerator / denominator, 4 знака, half-up."""
    if sqr_full is None or numerator is None or denominator is None:
        return None
    try:
        num = Decimal(str(numerator).strip())
        den = Decimal(str(denominator).strip())
        if den == 0:
            return None
        val = Decimal(str(sqr_full)) * num / den
        return float(val.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP))
    except (ValueError, ArithmeticError):
        return None

# ---------- парсинг ----------

def parse_xml(content: bytes) -> list[dict]:
    try:
        root = etree.fromstring(content)
    except etree.XMLSyntaxError as e:
        raise HTTPException(400, f"Некорректный XML: {e}")

    items = []
    for rr in root.iter("right_record"):
        right_number = _text(rr, "right_data/right_number")
        if not right_number:
            continue

        num = _text(rr, "right_data/shares/share/numerator")
        den = _text(rr, "right_data/shares/share/denominator")

        holder = None
        legal = rr.find("right_holders/right_holder/legal_entity/entity/resident")
        if legal is not None:
            holder = {
                "type": "legal_entity",
                "name": _text(legal, "name"),
                "inn": _text(legal, "inn"),
            }
        else:
            ind = rr.find("right_holders/right_holder/individual")
            if ind is not None:
                surname    = _text(ind, "surname")
                name       = _text(ind, "name")
                patronymic = _text(ind, "patronymic")
                birth_date = _text(ind, "birth_date")

                # Полные ФИО приходят, когда есть surname (или patronymic).
                # Если есть только name = "Физическое лицо" — это обезличенная запись.
                is_full = bool(surname or patronymic)

                holder = {
                "type": "individual",
                "is_full": is_full,
                "surname": surname,
                "name": name,
                "patronymic": patronymic,
                "birth_date": birth_date,
                # удобное поле для отображения:
                "display_name": (
                    " ".join(p for p in (surname, name, patronymic) if p)
                    if is_full else (name or "Физическое лицо")
                ),
            }
            else:
                other = rr.find(
                    "right_holders/right_holder/another/another_type/"
                    "investment_unit_owner/investment_unit_name"
                )
                if other is not None:
                    holder = {"type": "investment_unit", "name": other.text}

        changes = None
        ch = rr.find("changes")
        if ch is not None:
            doc_codes = []
            for ud in ch.findall("underlying_documents/underlying_document"):
                code_el = ud.find("document_code/code")
                if code_el is not None and code_el.text:
                    doc_codes.append(code_el.text.strip())
            changes = {
                "change_record_number": _text(ch, "change_record_number"),
                "fixed_at": _text(ch, "fixed_at"),
                "document_codes": doc_codes
            }

        items.append({
            "right_number": right_number,
            "registration_date": _text(rr, "record_info/registration_date"),
            "cancel_date": _text(rr, "record_info/cancel_date"),
            "numerator": num,
            "denominator": den,
            "holder": holder,
            "changes": changes,
        })
    
    return items


# ---------- построение цепочек ----------

def build_chains(xml_items: list[dict]) -> list[dict]:
    # нормализуем даты и доли один раз
    for it in xml_items:
        it["_reg_utc"] = _parse_dt(it.get("registration_date"))
        it["_cancel_utc"] = _parse_dt(it.get("cancel_date"))
        it["_num"] = _norm(it.get("numerator"))
        it["_den"] = _norm(it.get("denominator"))

    mark_dead_ends(xml_items)

    # в build_chains после mark_dead_ends
    print("dead_end count:", sum(1 for it in xml_items if it.get("dead_end")))
    print("no_successor count:", sum(1 for it in xml_items if it.get("no_successor")))

    # индекс "предыдущих": ключ — (cancel_date, numerator, denominator)
    by_cancel = defaultdict(list)
    for it in xml_items:
        if it["_cancel_utc"] is None:
            continue
        key = (it["_cancel_utc"], it["_num"], it["_den"])
        by_cancel[key].append(it)

    def ancestors(item):
        """Все предки item (рекурсивно), с защитой от циклов."""
        seen_numbers = {item["right_number"]}
        stack = [item]
        result = []
        while stack:
            cur = stack.pop()
            key = (cur["_reg_utc"], cur["_num"], cur["_den"])
            for prev in by_cancel.get(key, []):
                if prev["right_number"] in seen_numbers:
                    continue
                seen_numbers.add(prev["right_number"])
                result.append(prev)
                stack.append(prev)
        return result

    # "актуальные" — без cancel_date
    actual = [it for it in xml_items if not it.get("cancel_date")]

    chains = []
    for act in actual:
        anc = ancestors(act)
        anc.sort(
            key=lambda x: x["_reg_utc"] or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,  # ближайший предок первым
        )
        chains.append({
            "root_number": act["right_number"],
            "chain": [act] + anc,
        })

        # дополнительно — тупиковые записи как отдельные цепочки длины 1
    chain_numbers = {c["root_number"] for c in chains}
    for it in xml_items:
        if it.get("dead_end") and it["right_number"] not in chain_numbers:
            chains.append({
                "root_number": it["right_number"],
                "chain": [it],
                "kind": "dead_end",  # для UI
            })
    return chains


def mark_dead_ends(xml_items: list[dict]) -> None:
    """Проставляет каждому item флаги dead_end / no_successor (in-place)."""
    from collections import defaultdict

    by_reg = defaultdict(list)
    for it in xml_items:
        if it["_reg_utc"] is None:
            continue
        by_reg[(it["_reg_utc"], it["_num"], it["_den"])].append(it)

    for it in xml_items:
        it["dead_end"] = False
        it["no_successor"] = False

        if it["_cancel_utc"] is None:
            continue

        key = (it["_cancel_utc"], it["_num"], it["_den"])
        has_successor = any(p is not it for p in by_reg.get(key, []))
        if has_successor:
            continue

        it["no_successor"] = True

        ch = it.get("changes") or {}
        codes = ch.get("document_codes") or []
        if GKU_CODE in codes:
            it["dead_end"] = True

# ---------- основной эндпоинт ----------

@router.post("/compare")
async def compare(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".xml"):
        raise HTTPException(400, "Ожидается файл .xml")

    content = await file.read()
    xml_items = parse_xml(content)
    print(f"Записей из XML: {len(xml_items)}")

    chains = build_chains(xml_items)
    print(f"Количество полученных цепочек: {len(chains)}")

    """
    all_numbers = set()
    for c in chains:
        for it in c["chain"]:
            all_numbers.add(it["right_number"])
    """

    all_numbers = set()
    for x in xml_items:
        all_numbers.add(x.get("right_number"))

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT mfpp.flat_id, mfpp.lastname, mfpp.firstname, mfpp.secondname,
                       mfpp.ownerregistrationnumber,
                       mf.account, mf.sqr_full, mf.sqr_base
                FROM mst_flat_payer_pers mfpp
                JOIN mst_flat mf ON mf.flat_id = mfpp.flat_id
                WHERE ownerregistrationnumber = ANY(%s)
                """,
                (list(all_numbers),),
            )
            payers = {r[4]: {
                "flat_id": r[0],
                "lastname": r[1],
                "firstname": r[2],
                "secondname": r[3],
                "ownerregistrationnumber": r[4],
                "account": r[5],
                "sqr_full": float(r[6]) if r[6] is not None else None,
                "sqr_base": r[7],

            } for r in cur.fetchall()}

            flat_ids = [p["flat_id"] for p in payers.values()]
            addinfo = {}
            if flat_ids:
                cur.execute(
                    """
                    SELECT flat_id, int_value, num_value
                    FROM oleg_addinfo_flat
                    WHERE flat_id = ANY(%s)
                      AND addinfotype_id = 9
                      AND statusid = 1
                    """,
                    (flat_ids,),
                )
                for fid, iv, nv in cur.fetchall():
                    addinfo[fid] = {"int_value": iv, "num_value": nv}
    finally:
        conn.close()

    result_chains = []
    for c in chains:
        payer = None
        matched_item_number = None
        for it in c["chain"]:
            p = payers.get(it["right_number"])
            if p:
                payer = p
                matched_item_number = it["right_number"]
                break

        add = addinfo.get(payer["flat_id"]) if payer else None

        actual_item = c["chain"][0]
        
        share_area = None
        if payer and payer.get("sqr_full") is not None:
            share_area = _share_area(
                payer["sqr_full"],
                actual_item["numerator"],
                actual_item["denominator"],
            )

        shares_mismatch = False
        if add:
            xml_share = _to_fraction(actual_item["numerator"], actual_item["denominator"])
            db_share = _to_fraction(add["int_value"], add["num_value"])
            shares_mismatch = (
                xml_share != db_share
            )

        mismatch = (
            payer is None
            or matched_item_number != c["root_number"]
            or add is None
            or shares_mismatch
        )

        result_chains.append({
            "flat_id": payer["flat_id"] if payer else None,
            "db_payer": payer,
            "db_addinfo": add,
            "matched_right_number": matched_item_number,
            "root_number": c["root_number"],
            "shares_mismatch": shares_mismatch,
            "mismatch": mismatch,
            "share_area": share_area,
            "chain": c["chain"],
            "kind": c.get("kind", "normal"),       # 'normal' | 'dead_end'
            "is_dead_end": bool(actual_item.get("dead_end")),
            "has_successor": not actual_item.get("no_successor"),
        })

    # чистка служебных полей
    for c in result_chains:
        for it in c["chain"]:
            for k in ("_reg_utc", "_cancel_utc", "_num", "_den"):
                it.pop(k, None)

    total_share_area = 0.0
    for c in result_chains:
        if c["share_area"] is not None:
            total_share_area += c["share_area"]

    # округлим итог до 4 знаков, чтобы не тянуть хвост от float-сложения
    total_share_area = float(
        Decimal(str(total_share_area)).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
    )

    
    return {
        "total_chains": len(result_chains),
        "bound_chains": sum(1 for c in result_chains if c["flat_id"]),
        "unbound_chains": sum(1 for c in result_chains if not c["flat_id"]),
        "dead_end_chains": sum(1 for c in result_chains if c["is_dead_end"]),
        "dead_end_bound": sum(1 for c in result_chains if c["is_dead_end"] and c["flat_id"]),
        "dead_end_unbound": sum(1 for c in result_chains if c["is_dead_end"] and not c["flat_id"]),
        "total_share_area": total_share_area,
        "chains": result_chains,
    }


# ---------- отладочный эндпоинт ----------

@router.post("/debug-dead-ends")
async def debug_dead_ends(file: UploadFile = File(...)):
    content = await file.read()
    xml_items = parse_xml(content)
    for it in xml_items:
        it["_reg_utc"] = _parse_dt(it.get("registration_date"))
        it["_cancel_utc"] = _parse_dt(it.get("cancel_date"))
        it["_num"] = _norm(it.get("numerator"))
        it["_den"] = _norm(it.get("denominator"))

    mark_dead_ends(xml_items)

    # сводка
    out = []
    for it in xml_items:
        if it["_cancel_utc"] is None:
            continue
        ch = it.get("changes") or {}
        codes = ch.get("document_codes") or []
        out.append({
            "right_number": it["right_number"],
            "cancel_utc": it["_cancel_utc"].isoformat(),
            "num": it["_num"],
            "den": it["_den"],
            "change_record_number": ch.get("change_record_number"),
            "document_codes": codes,
            "no_successor": it["no_successor"],
            "dead_end": it["dead_end"],
        })

    # найдём проблемную запись
    sample = [r for r in out if r["right_number"].endswith("2023-545")]

    return {
        "total_cancelled": len(out),
        "no_successor": sum(1 for r in out if r["no_successor"]),
        "dead_end": sum(1 for r in out if r["dead_end"]),
        "sample_2023_545": sample,
        "top_dead_ends": [r for r in out if r["dead_end"]][:20],
    }