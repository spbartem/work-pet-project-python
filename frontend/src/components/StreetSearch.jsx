import { useEffect, useState } from "react";

function StreetSearch({ onSelect }) {
    const [query, setQuery] = useState("");
    const [streets, setStreets] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query.trim().length < 4) {
            setStreets([]);
            return;
        }

        const searchStreets = async () => {
            setLoading(true);

            try {
                const response = await fetch(
                    `http://127.0.0.1:8000/streets?query=${encodeURIComponent(query)}`
                );

                const data = await response.json();

                setStreets(data.streets);
            } catch (error) {
                console.error("Ошибка поиска улиц: ", error);
                setStreets([]);
            } finally {
                setLoading(false);
            }
        };

        searchStreets();

    }, [query]);

    const handleSelect = (street) => {
        setQuery(street.name);
        setStreets([]);

        onSelect(street);
    };

    return (
        <div className="relative">
            <label className="mb-2 block text-sm font-medium text-gray-700">
                Улица
            </label>

            <input 
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Начните вводить название улицы..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

            {loading && (
                <div className="absolute left-0 right-0 top-full z-10 bg-white px-4 py-3 text-sm text-gray-500 shadow">
                    Поиск...
                </div>
            )}

            {!loading && streets.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-10 overflow-hidden rounded-b-lg border border-gray-200 bg-white shadow-lg">
                    {streets.map((street) => (
                        <button
                            key={street.street_id}
                            type="button"
                            onClick={() => handleSelect(street)}
                            className="block w-full border-b border-gray-100 px-4 py-3 text-left text-sm hover:bg-gray-50"
                        >
                            {street.name}
                        </button>
                    
                    ))} 
                </div>
            )}
        </div>
    );
}

export default StreetSearch;