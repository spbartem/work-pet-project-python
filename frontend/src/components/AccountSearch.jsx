import { useEffect, useState } from "react";

const backendUrl = import.meta.env.VITE_PYTHON_API_URL;

function AccountSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [flat, setFlat] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 1) {
      setFlat(null);
      return;
    }

    const searchAccount = async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `${backendUrl}/api/flats/search?account=${encodeURIComponent(
            query
          )}`
        );

        if (!response.ok) {
          throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const data = await response.json();

        console.log("Поиск по лицевому счёту:", data);

        setFlat(data);
      } catch (error) {
        console.error("Ошибка поиска по лицевому счёту:", error);
        setFlat(null);
      } finally {
        setLoading(false);
      }
    };

    searchAccount();
  }, [query]);

  const handleSelect = () => {
    if (!flat) return;

    setQuery(flat.account);
    setFlat(null);
    onSelect(flat);
  };

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Лицевой счёт
      </label>

      <input
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          onSelect(null);
        }}
        placeholder="Введите лицевой счёт..."
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />

      {loading && (
        <div className="absolute left-0 right-0 top-full z-10 bg-white px-4 py-3 text-sm text-gray-500 shadow">
          Поиск...
        </div>
      )}

      {!loading && flat && (
        <div className="absolute left-0 right-0 top-full z-10 overflow-hidden rounded-b-lg border border-gray-200 bg-white shadow-lg">
          <button
            type="button"
            onClick={handleSelect}
            className="block w-full px-4 py-3 text-left hover:bg-gray-50"
          >
            <div className="font-medium text-gray-900">
              Лицевой счёт: {flat.account}
            </div>

            <div className="mt-1 text-sm text-gray-700">
              Помещение: {flat.flat_num || "—"}
            </div>

            <div className="mt-1 text-xs text-gray-500">
              {flat.full_address || "Адрес отсутствует"}
            </div>

            <div className="mt-1 text-xs text-gray-500">
              Площадь: {flat.sqr_base ?? "—"}
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default AccountSearch;