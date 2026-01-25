import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkPaymentButton } from "@/components/payments/mark-payment-button";
import { UpdateDepositButton } from "@/components/payments/update-deposit-button";

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  const [payments, deposits] = await Promise.all([
    prisma.payment.findMany({
      where: {
        booking: { agencyId: session.user.agencyId },
      },
      include: {
        booking: {
          include: {
            customer: true,
            vehicle: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.deposit.findMany({
      where: {
        booking: { agencyId: session.user.agencyId },
      },
      include: {
        booking: {
          include: {
            customer: true,
            vehicle: true,
          },
        },
      },
      orderBy: { heldAt: "desc" },
    }),
  ]);

  const pendingPayments = payments.filter((p) => p.status === "PENDING");
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  const heldDeposits = deposits.filter((d) => d.status === "HELD");
  const totalHeld = heldDeposits.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paiements & Cautions"
        description="Gérez les paiements et les cautions"
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Paiements en attente
              </p>
              <p className="text-3xl font-bold text-orange-600">
                {formatCurrency(totalPending)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {pendingPayments.length} paiement(s)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Cautions retenues
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(totalHeld)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {heldDeposits.length} caution(s)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Paiements</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun paiement enregistré
            </p>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Véhicule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">
                          {payment.booking.customer.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.booking.vehicle.make}{" "}
                        {payment.booking.vehicle.model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.type === "CASH" && "Espèces"}
                        {payment.type === "CARD" && "Carte"}
                        {payment.type === "TRANSFER" && "Virement"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={payment.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.paidAt
                          ? formatDate(payment.paidAt)
                          : formatDate(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.status === "PENDING" && (
                          <MarkPaymentButton
                            paymentId={payment.id}
                            currentAmount={payment.amount}
                          />
                        )}
                        {payment.status === "PAID" && (
                          <span className="text-green-600">✓ Reçu</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deposits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cautions</CardTitle>
        </CardHeader>
        <CardContent>
          {deposits.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune caution enregistrée
            </p>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Véhicule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date retenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date retour
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deposits.map((deposit) => (
                    <tr key={deposit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">
                          {deposit.booking.customer.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {deposit.booking.vehicle.make}{" "}
                        {deposit.booking.vehicle.model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {formatCurrency(deposit.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={deposit.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatDate(deposit.heldAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {deposit.returnedAt
                          ? formatDate(deposit.returnedAt)
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {deposit.status === "HELD" ? (
                          <UpdateDepositButton depositId={deposit.id} />
                        ) : (
                          <span className="text-gray-500">
                            {deposit.status === "RETURNED" && "✓ Retournée"}
                            {deposit.status === "PARTIAL_RETURNED" && "⚠ Partielle"}
                            {deposit.status === "FORFEITED" && "✗ Confisquée"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
