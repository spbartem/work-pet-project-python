function PaymentsTable({ data }) {
  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) {
      return "—";
    }

    return new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  const formatPeriod = (period_year, period_month) => {
    if (period_year === null || period_month === null) {
      return "—";
    }

    return `${period_year}-${String(period_month).padStart(2, "0")}`;
  };

  const formatDate = (date) => {
  if (!date) {
    return "—";
  }

  const [year, month, day] = date.split("-");

  return `${day}.${month}.${year}`;
};

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center justify-between">
            Платежи
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Все платежи по лицевому счёту
          </p>
        </div>

        <div className="text-sm text-gray-500">
          Записей: {data.length}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="mt-6 rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
          Платежей не найдено
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Период
                </th>
                
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Даты оплаты
                </th>
                
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Оплачено, руб.
                </th>                            
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {data.map((payment) => (
                <tr
                  key={payment.payment_id}
                  className={
                    payment.reversed || payment.group_id !== null
                    ? "bg-red-50 text-gray-400"
                    : "hover:bg-gray-50"
                  }
                >
                  <td className="whitespace-nowrap px-3 py-1 text-sm">
                      {formatPeriod(payment.period_year, payment.period_month)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-1 text-sm">
                    {formatDate(payment.payment_date)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-1 text-sm font-medium">
                    {formatAmount(payment.amount)}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}

export default PaymentsTable;