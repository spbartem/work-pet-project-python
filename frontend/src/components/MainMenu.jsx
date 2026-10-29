function MainMenu({ onNavigate }) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-center text-3xl font-bold text-gray-800">
        Выберите раздел
      </h1>
      <div className="grid gap-6 md:grid-cols-2">
        <button
          onClick={() => onNavigate("address")}
          className="rounded-xl bg-white p-8 text-left shadow transition hover:shadow-lg"
        >
          <div className="text-2xl font-semibold text-gray-800">
            🔍 Поиск адреса
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Поиск улицы, дома, помещения или лицевого счёта
          </div>
        </button>

        <button
          onClick={() => onNavigate("parking")}
          className="rounded-xl bg-white p-8 text-left shadow transition hover:shadow-lg"
        >
          <div className="text-2xl font-semibold text-gray-800">
            🅿️ Проверить помещение
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Сравнить данные РР с текущим состоянием БД
          </div>
        </button>
      </div>
    </div>
  );
}

export default MainMenu;