import { useEffect, useState } from "react";

const backendUrl = import.meta.env.VITE_PYTHON_API_URL;

function HouseSearch({ street, onSelect }) {
  const [query, setQuery] = useState("");
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Если улица не выбрана — очищаем поиск дома
    if (!street) {
      setQuery("");
      setHouses([]);
      return;
    }

    // Если введён пустой запрос — ничего не ищем
    if (query.trim().length < 1) {
      setHouses([]);
      return;
    }

    const searchHouses = async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `${backendUrl}/api/houses?street_id=${street.street_id}&query=${encodeURIComponent(query)}`
        );

        const data = await response.json();

        setHouses(data.houses);
      } catch (error) {
        console.error("Ошибка поиска домов:", error);
        setHouses([]);
      } finally {
        setLoading(false);
      }
    };

    searchHouses();
  }, [street, query]);

  const handleSelect = (house) => {
    setQuery(formatHouseName(house));
    setHouses([]);

    onSelect(house);
  };

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Дом
      </label>

      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        disabled={!street}
        placeholder={
          street
            ? "Начните вводить номер дома..."
            : "Сначала выберите улицу"
        }
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />

      {loading && (
        <div className="absolute left-0 right-0 top-full z-10 bg-white px-4 py-3 text-sm text-gray-500 shadow">
          Поиск...
        </div>
      )}

      {!loading && houses.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-10 overflow-hidden rounded-b-lg border border-gray-200 bg-white shadow-lg">
          {houses.map((house) => (
            <button
              key={house.house_id}
              type="button"
              onClick={() => handleSelect(house)}
              className="block w-full border-b border-gray-100 px-4 py-3 text-left text-sm hover:bg-gray-50"
            >
              <div className="font-medium text-gray-900">
                {formatHouseName(house)}
              </div>

              <div className="mt-1 text-xs text-gray-500">
                {house.full_address}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatHouseName(house) {
  const parts = [];

  if (house.house_num) {
    parts.push(`дом ${house.house_num}`);
  }

  if (house.building) {
    parts.push(`корпус ${house.building}`);
  }

  if (house.liter) {
    parts.push(`литера ${house.liter}`);
  }

  if (house.construction) {
    parts.push(`строение ${house.construction}`);
  }

  return parts.join(", ");
}

export default HouseSearch;