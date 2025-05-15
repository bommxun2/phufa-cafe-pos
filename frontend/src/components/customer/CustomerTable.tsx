"use client";

interface CustomerTableProps {
  setSelectedCustomer: (customer: any) => void;
  customers: any;
}

export default function CustomerTable({
  setSelectedCustomer,
  customers,
}: CustomerTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
              CitizenId
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
              Name
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
              Gender
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
              PhoneNumber
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
              Point
            </th>
            <th className="px-8 py-4 text-left text-sm font-medium text-gray-500">
              Address
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {customers.map((item) => (
            <tr
              key={item.citizenId}
              onClick={() => setSelectedCustomer(item)}
              className="hover:bg-gray-50 cursor-pointer"
            >
              <td className="px-6 py-4 text-sm text-gray-900">
                {item.citizenId}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {item.firstname + " " + item.lastname}
              </td>
              <td className="px-7 py-4 text-sm text-gray-900">
                {item.gender === "M"
                  ? "Male"
                  : item.gender === "F"
                  ? "Female"
                  : "-"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {item.phoneNum}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">{item.point}</td>
              <td className="px-8 py-4 text-sm text-gray-900">
                {item.address}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
