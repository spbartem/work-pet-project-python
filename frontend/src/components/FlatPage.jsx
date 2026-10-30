import { useEffect, useState } from "react";
import PaymentsTable from "./functions/PaymentsTable.jsx";
import FeesTable from "./functions/FeesTable.jsx";
import DiscountInfo from "./functions/DiscountInfo.jsx";

const backendUrl = import.meta.env.VITE_PYTHON_API_URL;

function FlatPage({ flat, onBack, onSelectAccount }) {
  const [activeTab, setActiveTab] = useState("info");

  // Данные карточки помещения
  const [flatInfo, setFlatInfo] = useState(null);

  // Лицевые счета этого помещения
  const [accounts, setAccounts] = useState([]);

  // Загрузка карточки помещения
  const [flatLoading, setFlatLoading] = useState(false);
  const [flatError, setFlatError] = useState("");

  // Данные текущей вкладки
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // ЗАГРУЖАЕМ КАРТОЧКУ ПОМЕЩЕНИЯ
  // =========================================================

  useEffect(() => {
    if (!flat?.flat_id) {
      setFlatInfo(null);
      setAccounts([]);
      return;
    }

    const loadFlat = async () => {
      setFlatLoading(true);
      setFlatError("");

      try {
        const response = await fetch(
          `${backendUrl}/api/flats/${flat.flat_id}`
        );

        if (!response.ok) {
          throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const result = await response.json();

        console.log("Карточка помещения:", result);

        setFlatInfo(result.flat);
        setAccounts(result.accounts || []);
      } catch (error) {
        console.error("Ошибка загрузки карточки помещения:", error);
        setFlatError("Не удалось загрузить информацию о помещении");
        setFlatInfo(null);
        setAccounts([]);
      } finally {
        setFlatLoading(false);
      }
    };

    loadFlat();
  }, [flat?.flat_id]);

  // =========================================================
  // ПРИ ВЫБОРЕ ДРУГОГО ЛИЦЕВОГО СЧЁТА
  // =========================================================

  useEffect(() => {
    setActiveTab("info");
    setData([]);
    setError("");
  }, [flat?.flat_id]);

  // =========================================================
  // ЗАГРУЖАЕМ ДАННЫЕ ВКЛАДКИ
  // =========================================================

  useEffect(() => {
    if (!flat?.flat_id || activeTab === "info") {
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError("");
      setData([]);

      let url = "";

      if (activeTab === "fees") {
        url = `${backendUrl}/api/fees?flat_id=${flat.flat_id}`;
      }

      if (activeTab === "payments") {
        url = `${backendUrl}/api/payments?flat_id=${flat.flat_id}`;
      }

      if (activeTab === "claims") {
        url = `${backendUrl}/api/claims?flat_id=${flat.flat_id}`;
      }

      if (activeTab === "discounts") {
        url = `${backendUrl}/api/discounts?flat_id=${flat.flat_id}`;
      }

      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const result = await response.json();

        console.log(`Данные вкладки ${activeTab}:`, result);

        setData(result);
      } catch (error) {
        console.error("Ошибка загрузки:", error);
        setError("Не удалось загрузить данные");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [flat?.flat_id, activeTab]);

  // =========================================================
  // ЕСЛИ ПОМЕЩЕНИЕ НЕ ВЫБРАНО
  // =========================================================

  if (!flat) {
    return null;
  }

  // =========================================================
  // ВКЛАДКИ
  // =========================================================

  const tabs = [
    {
      id: "info",
      title: "Общая информация",
    },
    {
      id: "fees",
      title: "Начисления",
    },
    {
      id: "payments",
      title: "Платежи",
    },
    {
      id: "claims",
      title: "Претензионная работа",
    },
    {
      id: "discounts",
      title: "Льготы",
    },
  ];

  // =========================================================
  // ЗАГРУЗКА КАРТОЧКИ
  // =========================================================

  if (flatLoading) {
    return (
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
        Загрузка карточки помещения...
      </div>
    );
  }

  if (flatError) {
    return (
      <div className="mt-8 rounded-xl border border-red-200 bg-white p-6 shadow-sm">
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {flatError}
        </div>

        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Вернуться к дому
        </button>
      </div>
    );
  }

  if (!flatInfo) {
    return null;
  }

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* =====================================================
          КНОПКА НАЗАД
      ===================================================== */}

      <div className="border-b border-gray-200 px-6 py-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Вернуться к дому
        </button>
      </div>

      {/* =====================================================
          ШАПКА ПОМЕЩЕНИЯ
      ===================================================== */}

      <div className="border-b border-gray-200 bg-gray-50 px-6 py-6">

        <div className="text-sm font-medium text-gray-500">
          Помещение
        </div>

        <div className="mt-1 text-3xl font-bold text-gray-900">
          {flatInfo.flat_num || "—"}
        </div>

        <div className="mt-3 text-base text-gray-700">
          {flatInfo.full_address || "Адрес отсутствует"}
        </div>

      </div>

      {/* =====================================================
          КРАТКАЯ ИНФОРМАЦИЯ О ПОМЕЩЕНИИ
      ===================================================== */}

      <div className="grid gap-6 border-b border-gray-200 px-6 py-6 md:grid-cols-2 lg:grid-cols-4">

        <InfoItem
          title="Площадь начисления"
          value={
            flatInfo.sqr_base != null
              ? `${flatInfo.sqr_base} м²`
              : "—"
          }
        />

        <InfoItem
          title="Общая площадь"
          value={
            flatInfo.sqr_full != null
              ? `${flatInfo.sqr_full} м²`
              : "—"
          }
        />

        <InfoItem
          title="Кадастровый номер"
          value={flatInfo.kad_num}
        />

        <InfoItem
          title="Количество ЛС"
          value={accounts.length}
        />

      </div>

      {/* =====================================================
          ЛИЦЕВЫЕ СЧЕТА ПОМЕЩЕНИЯ
      ===================================================== */}

      <div className="border-b border-gray-200 px-6 py-6">

        <h2 className="text-lg font-semibold text-gray-900">
          Лицевые счета помещения
        </h2>

        {accounts.length === 0 ? (
          <div className="mt-4 rounded-lg bg-gray-50 p-5 text-center text-sm text-gray-500">
            Лицевые счета не найдены
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">

            {/* Заголовок таблицы */}

            <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-500">
              <div>Лицевой счёт</div>
              <div>Площадь</div>
              <div>Статус</div>
            </div>

            {/* Лицевые счета */}

            {accounts.map((account) => {

              const isSelected =
                account.flat_id === flat.flat_id;

              return (
                <button
                  key={account.flat_id}
                  type="button"
                  onClick={() => {
                    if (
                      !isSelected &&
                      onSelectAccount
                    ) {
                      onSelectAccount(account);
                    }
                  }}
                  className={
                    isSelected
                      ? "grid w-full grid-cols-3 border-b border-gray-200 bg-blue-50 px-4 py-3 text-left last:border-b-0"
                      : "grid w-full grid-cols-3 border-b border-gray-200 px-4 py-3 text-left last:border-b-0 hover:bg-gray-50"
                  }
                >

                  {/* Лицевой счёт */}

                  <div className="font-medium text-gray-900">
                    {account.account || "—"}
                  </div>

                  {/* Площадь */}

                  <div className="text-gray-700">
                    {account.sqr_base != null
                      ? `${account.sqr_base} м²`
                      : "—"}
                  </div>

                  {/* Статус */}

                  <div>
                    {account.billable ? (
                      <span className="text-green-600">
                        Открыт
                      </span>
                    ) : (
                      <span className="text-gray-500">
                        Закрыт
                      </span>
                    )}
                  </div>

                </button>
              );
            })}

          </div>
        )}

      </div>

      {/* =====================================================
          ВКЛАДКИ
      ===================================================== */}

      <div className="border-b border-gray-200 px-6 pt-4">
        <div className="flex flex-wrap gap-2">

          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={
                activeTab === tab.id
                  ? "rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white"
                  : "rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
              }
            >
              {tab.title}
            </button>
          ))}

        </div>
      </div>

      {/* =====================================================
          СОДЕРЖИМОЕ ВКЛАДКИ
      ===================================================== */}

      <div className="p-6">

        {activeTab === "info" && (
          <InfoTab flat={flatInfo} />
        )}

        {activeTab !== "info" && loading && (
          <div className="py-10 text-center text-sm text-gray-500">
            Загрузка...
          </div>
        )}

        {activeTab !== "info" && error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {activeTab !== "info" &&
          !loading &&
          !error && (
            <DataTab
              activeTab={activeTab}
              data={data}
            />
          )}

      </div>

    </div>
  );
}


/* =========================================================
   ИНФОРМАЦИЯ
========================================================= */

function InfoItem({ title, value }) {
  return (
    <div>
      <div className="text-sm text-gray-500">
        {title}
      </div>

      <div className="mt-1 break-words font-medium text-gray-900">
        {value || "—"}
      </div>
    </div>
  );
}


/* =========================================================
   ВКЛАДКА "ОБЩАЯ ИНФОРМАЦИЯ"
========================================================= */

function InfoTab({ flat }) {
  return (
    <div>

      <div className="mt-5 grid gap-6 md:grid-cols-2">

        <div>
          <div className="text-sm text-gray-500">
            Общая площадь
          </div>

          <div className="mt-1 text-gray-900">
            {flat.sqr_full != null
              ? `${flat.sqr_full} м²`
              : "—"}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">
            Кадастровый номер
          </div>

          <div className="mt-1 text-gray-900">
            {flat.kad_num || "—"}
          </div>
        </div>

      </div>

    </div>
  );
}


/* =========================================================
   ДАННЫЕ ВКЛАДОК
========================================================= */

function DataTab({ activeTab, data }) {

  const titles = {
    fees: "Начисления",
    payments: "Платежи",
    claims: "Претензионная работа",
    discounts: "Льготы",
  };

  if (activeTab === "fees") {
    return <FeesTable data={data} />;
  }

  if (activeTab === "payments") {
    return <PaymentsTable data={data} />;
  }

  if (activeTab === "discounts") {
    return <DiscountInfo data={data} />;
  }

  return (
    <div>

      <h2 className="text-lg font-semibold text-gray-900">
        {titles[activeTab]}
      </h2>

      {data.length === 0 ? (
        <div className="mt-6 rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
          Данных пока нет
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <pre className="text-xs text-gray-700">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

    </div>
  );
}


export default FlatPage;