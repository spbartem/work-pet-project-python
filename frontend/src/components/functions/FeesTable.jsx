function FeesTable({ data }) {
  const formatMonth = (month) => {
    const months = [
      "Январь",
      "Февраль",
      "Март",
      "Апрель",
      "Май",
      "Июнь",
      "Июль",
      "Август",
      "Сентябрь",
      "Октябрь",
      "Ноябрь",
      "Декабрь",
    ];

    return months[month - 1] || month;
  };

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) {
      return "—";
    }

    return new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Начисления
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Все начисления по лицевому счёту
          </p>
        </div>

        <div className="text-sm text-gray-500">
          Записей: {data.length}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="mt-6 rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
          Начислений не найдено
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Период
                </th>

                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Начислено, руб.
                </th>

                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Льгота, руб.
                </th>
                
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  Статус
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {data.map((fee) => (
                <tr
                  key={fee.fee_id}
                  className={
                    fee.cancelled
                      ? "bg-gray-50 text-gray-400"
                      : "hover:bg-gray-50"
                  }
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <div className="font-medium">
                      {formatMonth(fee.fee_month)}
                    </div>

                    <div className="text-xs text-gray-500">
                      {fee.fee_year} год
                    </div>
                  </td>
                  

                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium">
                    {formatAmount(fee.amount)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium">
                      {formatAmount(fee.discount)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-center text-sm">
                    {fee.cancelled ? (
                      <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                        Отменено
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        Начислено
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FeesTable;