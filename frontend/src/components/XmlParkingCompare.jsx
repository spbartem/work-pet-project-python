import { useMemo, useState } from "react";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatDateTime(iso) {
  if (!iso) return "—";
  // Safari не парсит "2026-06-25T12:29:59Z" как валидную дату? С "+00:00" работает всегда.
  const normalized = iso.replace("Z", "+00:00");
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return "—";
  return (
    pad2(d.getDate()) + "." +
    pad2(d.getMonth() + 1) + "." +
    d.getFullYear() + " " +
    pad2(d.getHours()) + ":" +
    pad2(d.getMinutes()) + ":" +
    pad2(d.getSeconds())
  );
}

function formatArea(v) {
  if (v === null || v === undefined) return "—";
  return Number(v).toLocaleString("ru-RU", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

function chainStatus(c) {
  if (!c.flat_id) return { kind: "unbound", label: "нет ЛС", cls: "bg-red-100 text-red-800" };
  if (c.is_dead_end) return { kind: "dead_end", label: "прекращено (переформировано)", cls: "bg-slate-200 text-slate-700" };
  if (c.mismatch || c.shares_mismatch) return { kind: "outdated", label: "расхождение", cls: "bg-yellow-100 text-yellow-800" };
  return { kind: "ok", label: "ок", cls: "bg-green-100 text-green-800" };
}

function holderText(h) {
  if (!h) return "—";
  if (h.type === "legal_entity") return `${h.name} (ИНН ${h.inn})`;
  if (h.type === "investment_unit") return h.name;
  if (h.type === "individual") {
    return h.display_name || "Физическое лицо";
  }
  return h.name || "—";
}

function Badge({ children, className = "" }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium " +
        className
      }
    >
      {children}
    </span>
  );
}

export default function ComparePage({ onBack }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // независимые фильтры, взаимоисключающие
  const [onlyMismatch, setOnlyMismatch] = useState(false);
  const [onlyUnbound, setOnlyUnbound] = useState(false);
  const [onlyDeadEnd, setOnlyDeadEnd] = useState(false);
  const [flatFilter, setFlatFilter] = useState("");
  const [expanded, setExpanded] = useState({});

  const toggleMismatch = (checked) => {
    setOnlyMismatch(checked);
    if (checked) { setOnlyUnbound(false); setOnlyDeadEnd(false); }
  };
  const toggleUnbound = (checked) => {
    setOnlyUnbound(checked);
    if (checked) { setOnlyMismatch(false); setOnlyDeadEnd(false); }
  };

  const toggleDeadEnd = (checked) => {
    setOnlyDeadEnd(checked);
    if (checked) { setOnlyMismatch(false); setOnlyUnbound(false); }
  };

  const upload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setExpanded({});
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/compare", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).detail || res.statusText);
      setResult(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!result) return [];
    const q = flatFilter.trim();

    // отладка: сработает при каждом изменении фильтров
    console.log("[filtered] state:", {
        onlyMismatch,
        onlyUnbound,
        onlyDeadEnd,      // если используете
        flatFilter,
        flatFilterTrimmed: q,
    });
    console.log("[filtered] from backend:", {
        unbound_chains: result.unbound_chains,
        unbound_in_chains: result.chains.filter((c) => !c.flat_id).length,
        total_chains: result.chains.length,
    });

    return result.chains.filter((c) => {
      // 1) фильтры по статусу (взаимоисключающие)
      if (onlyMismatch && !(c.mismatch || c.shares_mismatch)) return false;
      if (onlyUnbound && c.flat_id) return false;
      if (onlyDeadEnd  && !c.is_dead_end) return false;
      // 2) фильтр по лицевому счёту
      if (q) {
        const asStr = String(c.flat_id ?? "");
        if (!asStr.includes(q)) return false;
      }
      return true;
    });
  }, [result, onlyMismatch, onlyUnbound, onlyDeadEnd, flatFilter]);

    const stats = useMemo(() => {
    if (!result) return null;
    const counters = { ok: 0, outdated: 0, unbound: 0, dead_end: 0 };
    for (const c of result.chains) {
        const kind = chainStatus(c).kind;
        if (counters[kind] !== undefined) counters[kind]++;
    }
    return {
        ...counters,
        total: result.chains.length,
    };
    }, [result]);

  const toggle = (key) =>
    setExpanded((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));

  return (
    <div className="mx-auto max-w-7xl">
      {/* ---------- кнопка "назад" ---------- */}
      {onBack && (
        <button
          onClick={onBack}
          className="mb-4 text-sm text-blue-600 hover:underline"
        >
          ← В главное меню
        </button>
      )}

      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="mb-6 text-2xl font-semibold text-gray-800">
          Сверка XML с БД по цепочкам прав
        </h1>

        {/* ---------- toolbar ---------- */}
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <input
            type="file"
            accept=".xml"
            onChange={(e) => setFile(e.target.files[0] || null)}
            className="block text-sm text-gray-700
                       file:mr-3 file:rounded-md file:border-0
                       file:bg-blue-600 file:px-3 file:py-1.5
                       file:text-sm file:font-medium file:text-white
                       hover:file:bg-blue-700"
          />
          <button
            onClick={upload}
            disabled={!file || loading}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white
                       hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Сверяем…" : "Сверить"}
          </button>

          <div className="mx-2 h-6 w-px bg-gray-300" />

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={onlyMismatch}
              onChange={(e) => toggleMismatch(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            только расхождения
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={onlyUnbound}
              onChange={(e) => toggleUnbound(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            только без ЛС
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
                type="checkbox"
                checked={onlyDeadEnd}
                onChange={(e) => toggleDeadEnd(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-slate-600 focus:ring-slate-500"
            />
            только прекращённые (переформировано)
          </label>

          <input
            type="text"
            placeholder="Фильтр по лицевому счёту…"
            value={flatFilter}
            onChange={(e) => setFlatFilter(e.target.value)}
            className="w-56 rounded-md border border-gray-300 px-3 py-1.5 text-sm
                       focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {error && (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* ---------- summary ---------- */}
        {stats && (
          <div className="mb-5 flex flex-wrap gap-3 text-sm">
            <Badge className="bg-gray-100 text-gray-800">
              Всего: <b className="ml-1">{stats.total}</b>
            </Badge>
            <Badge className="bg-green-100 text-green-800">
              ок: <b className="ml-1">{stats.ok}</b>
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-800">
              расхождения: <b className="ml-1">{stats.outdated}</b>
            </Badge>
            <Badge className="bg-red-100 text-red-800">
              без ЛС: <b className="ml-1">{stats.unbound}</b>
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              показано: <b className="ml-1">{filtered.length}</b>
            </Badge>
            {result.total_share_area !== undefined && (
            <Badge className="bg-indigo-100 text-indigo-800">
              Площадь по долям: <b className="ml-1">{formatArea(result.total_share_area)}</b> м²
            </Badge>
             )}
            <Badge className="bg-slate-200 text-slate-700">
              прекращено/переформировано: <b className="ml-1">{stats.dead_end}</b>
            </Badge>
          </div>
        )}

        {result && filtered.length === 0 && (
          <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-6 text-center text-sm text-gray-500">
            Нет цепочек, удовлетворяющих фильтру.
          </p>
        )}

        {/* ---------- карточки ---------- */}
        <div className="space-y-3">
          {filtered.map((c, i) => {
            const key = `${c.flat_id ?? "no_ls"}-${c.root_number}-${i}`;
            const isOpen = expanded[key] ?? true;
            const status = chainStatus(c);
            const p = c.db_payer;
            const a = c.db_addinfo;
            const fio = p
              ? [p.lastname, p.firstname, p.secondname].filter(Boolean).join(" ")
              : "—";
            const sqr_base = p
              ? formatArea(p.sqr_base)
              : "—";

            const headerBg = !c.flat_id
              ? "bg-red-50"
              : c.mismatch || c.shares_mismatch
              ? "bg-yellow-50"
              : "bg-green-50";

            return (
              <div
                key={key}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left ${headerBg} hover:brightness-95`}
                >
                  <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                      <div className="text-xs text-gray-500">Лицевой счёт</div>
                      <div className="font-medium">{c.flat_id ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">ФИО (БД)</div>
                      <div className="font-medium">{fio}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Доли (БД)</div>
                      <div className="font-medium">
                        {a ? `${a.int_value}/${a.num_value}` : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Площадь доли, м² (XML)</div>
                      <div className="font-medium">{formatArea(c.share_area)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Площадь доли, м² (БД)</div>
                      <div className="font-medium">{sqr_base}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Статус</div>
                      <Badge className={status.cls}>{status.label}</Badge>
                    </div>
                  </div>
                  <span className="whitespace-nowrap text-xs text-gray-500">
                    {c.chain.length} зап. {isOpen ? "▲" : "▼"}
                  </span>
                </button>

                {isOpen && (
                  <div className="overflow-x-auto border-t border-gray-200">
                    <table className="min-w-full table-auto text-sm">
                      <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">№</th>
                          <th className="px-3 py-2 text-left font-semibold">Номер рег. права</th>
                          <th className="px-3 py-2 text-left font-semibold">Регистрация</th>
                          <th className="px-3 py-2 text-left font-semibold">Прекращение</th>
                          <th className="px-3 py-2 text-left font-semibold">Доли</th>
                          <th className="px-3 py-2 text-left font-semibold">Правообладатель (XML)</th>
                          <th className="px-3 py-2 text-left font-semibold">Прекращение права</th>
                          <th className="px-3 py-2 text-center font-semibold">В БД</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {c.chain.map((it, j) => {
                          const isActual = j === 0;
                          const isMatched = it.right_number === c.matched_right_number;
                          const rowCls = isMatched
                            ? "bg-yellow-100"
                            : isActual
                            ? (c.is_dead_end ? "bg-slate-100" : "bg-green-50")
                            : "hover:bg-gray-50";
                          return (
                            <tr key={j} className={rowCls}>
                              <td className="whitespace-nowrap px-3 py-2">
                                <span className="font-medium">{j + 1}</span>
                                {isActual && (
                                  <Badge className="ml-2 bg-green-100 text-green-800">
                                    актуальное
                                  </Badge>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                                {it.right_number}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2">
                                {formatDateTime(it.registration_date)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2">
                                {formatDateTime(it.cancel_date)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2">
                                {it.numerator}/{it.denominator}
                              </td>
                                <td className="px-3 py-2">
                                {it.holder?.type === "individual" ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                    <span>{it.holder.display_name}</span>
                                    {it.holder.is_full && it.holder.birth_date && (
                                        <span className="text-xs text-gray-500">
                                        {it.holder.birth_date}
                                        </span>
                                    )}
                                    </div>
                                ) : (
                                    holderText(it.holder)
                                )}
                                </td>
                              <td className="px-3 py-2">
                                {it.changes ? (
                                  <>
                                    <div className="font-mono text-xs">
                                      {it.changes.change_record_number}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {formatDateTime(it.changes.fixed_at)}
                                    </div>
                                  </>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-center">
                                {isMatched ? (
                                  <span className="text-green-600">✅</span>
                                ) : (
                                  <span className="text-gray-300">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}