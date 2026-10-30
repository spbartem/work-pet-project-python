import { useEffect, useState } from "react";

const backendUrl = import.meta.env.VITE_PYTHON_API_URL;

function FlatSearch({ house, onSelect }) {
  const [query, setQuery] = useState("");
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Если дом не выбран — очищаем поиск помещения
    if (!house) {
      setQuery("");
      setFlats([]);
      return;
    }

    // Ничего не ищем, если поле пустое
    if (query.trim().length < 1) {
      setFlats([]);
      return;
    }

    const searchFlats = async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `${backendUrl}/api/flats?house_id=${house.house_id}&query=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
          throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const data = await response.json();

        console.log("Поиск помещения:", data);

        setFlats(data);
      } catch (error) {
        console.error("Ошибка поиска помещения:", error);
        setFlats([]);
      } finally {
        setLoading(false);
      }
    };

    searchFlats();
  }, [house, query]);

  const handleSelect = (flat) => {
    setQuery(flat.flat_num);
    setFlats([]);
    onSelect(flat);
  };

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Помещение
      </label>

      <input
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          onSelect(null);
        }}
        disabled={!house}
        placeholder={
          house
            ? "Введите номер помещения..."
            : "Сначала выберите дом"
        }
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />

      {loading && (
        <div className="absolute left-0 right-0 top-full z-10 bg-white px-4 py-3 text-sm text-gray-500 shadow">
          Поиск...
        </div>
      )}

      {!loading && flats.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-10 max-h-80 overflow-y-auto overflow-hidden rounded-b-lg border border-gray-200 bg-white shadow-lg">
          {flats.map((flat) => (
            <button
              key={flat.flat_id}
              type="button"
              onClick={() => handleSelect(flat)}
              className="block w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50"
            >
              <div className="font-medium text-gray-900">
                {flat.flat_type_name} {flat.flat_num}
              </div>

              <div className="mt-1 text-xs text-gray-500">
                Лицевой счёт: {flat.account || "—"}
              </div>

              <div className="text-xs text-gray-500">
                Площадь: {flat.sqr_base ?? "—"}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default FlatSearch;