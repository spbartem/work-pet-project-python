import { useEffect, useState } from "react";

const backendUrl = import.meta.env.VITE_PYTHON_API_URL;

function FlatList({ house, onSelect }) {
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(false);

  // Текущая страница
  const [currentPage, setCurrentPage] = useState(1);

  // Количество записей на странице
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    if (!house) {
      setFlats([]);
      setCurrentPage(1);
      return;
    }

    const loadFlats = async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `${backendUrl}/api/flats?house_id=${house.house_id}`
        );

        if (!response.ok) {
          throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const data = await response.json();

        console.log("Ответ /flats:", data);

        setFlats(data);
        setCurrentPage(1);
      } catch (error) {
        console.error(
          "Ошибка загрузки лицевых счетов:",
          error
        );

        setFlats([]);
      } finally {
        setLoading(false);
      }
    };

    loadFlats();
  }, [house]);

  // При изменении количества записей
  // возвращаемся на первую страницу
  const handlePageSizeChange = (event) => {
    setPageSize(Number(event.target.value));
    setCurrentPage(1);
  };

  if (!house) {
    return null;
  }

  // =========================================================
  // ПАГИНАЦИЯ
  // =========================================================

  const totalPages = Math.ceil(flats.length / pageSize);

  const startIndex = (currentPage - 1) * pageSize;

  const endIndex = startIndex + pageSize;

  const currentFlats = flats.slice(
    startIndex,
    endIndex
  );

  // Номера страниц
  const pageNumbers = [];

  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="mt-8">

      {/* =====================================================
          ЗАГОЛОВОК
      ===================================================== */}

      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Лицевые счета дома
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {house.full_address}
          </p>
        </div>

        {!loading && flats.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              Показывать:
            </span>

            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}

      </div>

      {/* =====================================================
          ЗАГРУЗКА
      ===================================================== */}

      {loading && (
        <div className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
          Загрузка лицевых счетов...
        </div>
      )}

      {/* =====================================================
          НЕТ ДАННЫХ
      ===================================================== */}

      {!loading && flats.length === 0 && (
        <div className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
          В этом доме помещения не найдены.
        </div>
      )}

      {/* =====================================================
          ТАБЛИЦА
      ===================================================== */}

      {!loading && flats.length > 0 && (
        <>
          <div className="overflow-hidden rounded-lg border border-gray-200">

            <table className="min-w-full divide-y divide-gray-200">

              <thead className="bg-gray-50">
                <tr>

                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Лицевой счёт
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Помещение
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Кадастровый номер
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500">
                    Площадь
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">

                {currentFlats.map((flat) => (
                  <tr
                    key={flat.flat_id}
                    onClick={() => onSelect(flat)}
                    className="cursor-pointer hover:bg-blue-50"
                  >

                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {flat.account || "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {flat.flat_num || "—"}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700">
                      {flat.kad_num || "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {flat.sqr_base ?? "—"}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

          {/* =================================================
              НИЖНЯЯ ПАНЕЛЬ ПАГИНАЦИИ
          ================================================= */}

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            {/* Информация */}
            <div className="text-sm text-gray-500">
              Показано{" "}
              <span className="font-medium text-gray-700">
                {startIndex + 1}
              </span>
              {"–"}
              <span className="font-medium text-gray-700">
                {Math.min(endIndex, flats.length)}
              </span>
              {" из "}
              <span className="font-medium text-gray-700">
                {flats.length}
              </span>
            </div>

            {/* Кнопки страниц */}
            <div className="flex flex-wrap items-center gap-1">

              {/* Назад */}
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((page) => page - 1)
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Назад
              </button>

              {/* Номера страниц */}
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={
                    currentPage === page
                      ? "rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white"
                      : "rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  }
                >
                  {page}
                </button>
              ))}

              {/* Вперёд */}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => page + 1)
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Вперёд →
              </button>

            </div>

          </div>
        </>
      )}

    </div>
  );
}

export default FlatList;