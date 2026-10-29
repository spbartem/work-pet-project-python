function DiscountInfo({ data }) {
    return (
        <div>
            <div>
                <thead>

                </thead>
                <tbody className = "divide-y divide-gray-200">
                    {data.map((discount) =>(
                        <tr key={discount.addinfo_id}>
                            <td className="px-4">
                                <div>
                                    {discount.int_value}
                                </div>
                            </td>
                            <td>
                                <div>
                                    {discount.note}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </div>
        </div>
    )
}

export default DiscountInfo;