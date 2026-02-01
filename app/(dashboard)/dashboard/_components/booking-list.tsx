import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export async function BookingList({ agencyId }: { agencyId: string }) {
  const bookings = await prisma.booking.findMany({
    where: { agencyId },
    include: {
      customer: true,
      vehicle: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "ACTIVE":
        return "text-blue-700 bg-blue-50";
      case "COMPLETED":
        return "text-green-700 bg-green-50";
      case "CANCELED":
        return "text-red-700 bg-red-50";
      case "DRAFT":
        return "text-yellow-700 bg-yellow-50";
      default:
        return "text-gray-700 bg-gray-50";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "Reserved";
      case "ACTIVE":
        return "In Progress";
      case "COMPLETED":
        return "Paid";
      case "CANCELED":
        return "Cancelled";
      case "DRAFT":
        return "Draft";
      default:
        return status;
    }
  };

  return (
    <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="text-xl font-semibold text-gray-900">
          Booking List
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking ID
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 3L6 9M6 3L4 5M6 3L8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Name
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 3L6 9M6 3L4 5M6 3L8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 3L6 9M6 3L4 5M6 3L8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Car Model
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 3L6 9M6 3L4 5M6 3L8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 3L6 9M6 3L4 5M6 3L8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 3L6 9M6 3L4 5M6 3L8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 3L6 9M6 3L4 5M6 3L8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 3L6 9M6 3L4 5M6 3L8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 3L6 9M6 3L4 5M6 3L8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((booking) => {
                const days = Math.ceil(
                  (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) /
                  (1000 * 60 * 60 * 24)
                );

                return (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        #{booking.id.slice(0, 10).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{booking.customer.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{booking.customer.phone}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {booking.vehicle.make} {booking.vehicle.model}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{days} Day{days > 1 ? 's' : ''}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {new Date(booking.startDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {new Date(booking.endDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(booking.totalPrice)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
