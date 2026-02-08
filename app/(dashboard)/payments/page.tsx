import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkPaymentButton } from "@/components/payments/mark-payment-button";
import { UpdateDepositButton } from "@/components/payments/update-deposit-button";

export default async function PaymentsPage() {
  const session = await getSession();

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
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Paiements en attente
              </p>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(totalPending)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {pendingPayments.length} paiement(s)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Cautions retenues
              </p>
              <p className="text-3xl font-bold text-foreground">
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
        <CardHeader className="border-b border-border">
          <CardTitle>Paiements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun paiement enregistré
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Véhicule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-muted/50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {payment.booking.customer.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {payment.booking.vehicle.make}{" "}
                        {payment.booking.vehicle.model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {payment.type === "CASH" && "Espèces"}
                        {payment.type === "CARD" && "Carte"}
                        {payment.type === "TRANSFER" && "Virement"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={payment.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
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
                          <span className="text-green-600 font-medium">✓ Reçu</span>
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
        <CardHeader className="border-b border-border">
          <CardTitle>Cautions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {deposits.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune caution enregistrée
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Véhicule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date retenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date retour
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {deposits.map((deposit) => (
                    <tr key={deposit.id} className="hover:bg-muted/50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {deposit.booking.customer.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {deposit.booking.vehicle.make}{" "}
                        {deposit.booking.vehicle.model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {formatCurrency(deposit.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={deposit.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(deposit.heldAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {deposit.returnedAt
                          ? formatDate(deposit.returnedAt)
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {deposit.status === "HELD" ? (
                          <UpdateDepositButton depositId={deposit.id} />
                        ) : (
                          <span className="text-muted-foreground">
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
