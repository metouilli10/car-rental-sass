import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkPaymentButton } from "@/components/payments/mark-payment-button";
import { UpdateDepositButton } from "@/components/payments/update-deposit-button";

const PAGE_SIZE = 25;

interface PaymentsPageProps {
  searchParams: Promise<{ page?: string; dpage?: string }>;
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const params = await searchParams;
  const paymentPage = Math.max(1, Number(params.page) || 1);
  const depositPage = Math.max(1, Number(params.dpage) || 1);

  const agencyFilter = { booking: { agencyId: session.user.agencyId } };

  const [payments, paymentTotal, deposits, depositTotal, pendingAgg, heldAgg] = await Promise.all([
    prisma.payment.findMany({
      where: agencyFilter,
      select: {
        id: true,
        amount: true,
        type: true,
        status: true,
        paidAt: true,
        createdAt: true,
        booking: {
          select: {
            customer: { select: { name: true } },
            vehicle: { select: { make: true, model: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (paymentPage - 1) * PAGE_SIZE,
    }),
    prisma.payment.count({ where: agencyFilter }),
    prisma.deposit.findMany({
      where: agencyFilter,
      select: {
        id: true,
        amount: true,
        status: true,
        heldAt: true,
        returnedAt: true,
        booking: {
          select: {
            customer: { select: { name: true } },
            vehicle: { select: { make: true, model: true } },
          },
        },
      },
      orderBy: { heldAt: "desc" },
      take: PAGE_SIZE,
      skip: (depositPage - 1) * PAGE_SIZE,
    }),
    prisma.deposit.count({ where: agencyFilter }),
    // Aggregate pending payments in one query
    prisma.payment.aggregate({
      where: { ...agencyFilter, status: "PENDING" },
      _sum: { amount: true },
      _count: { id: true },
    }),
    // Aggregate held deposits in one query
    prisma.deposit.aggregate({
      where: { ...agencyFilter, status: "HELD" },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  const paymentTotalPages = Math.ceil(paymentTotal / PAGE_SIZE);
  const depositTotalPages = Math.ceil(depositTotal / PAGE_SIZE);

  const totalPending = pendingAgg._sum.amount ?? 0;
  const pendingCount = pendingAgg._count.id;
  const totalHeld = heldAgg._sum.amount ?? 0;
  const heldCount = heldAgg._count.id;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Paiements & Cautions"
        description="Gérez les paiements et les cautions"
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-l-4 border-l-amber-400">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Paiements en attente
              </p>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(totalPending)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {pendingCount} paiement(s)
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
                {heldCount} caution(s)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Paiements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun paiement enregistré
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-transparent border-b border-muted">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        Véhicule
                      </th>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/60">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-muted/40 transition-colors duration-200">
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
                            <span className="text-emerald-600 font-medium">✓ Reçu</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={paymentPage} totalPages={paymentTotalPages} baseUrl="/payments" />
            </>
          )}
        </CardContent>
      </Card>

      {/* Deposits Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Cautions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {deposits.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune caution enregistrée
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-transparent border-b border-muted">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        Véhicule
                      </th>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        Date retenue
                      </th>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        Date retour
                      </th>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/60">
                    {deposits.map((deposit) => (
                      <tr key={deposit.id} className="hover:bg-muted/40 transition-colors duration-200">
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
              <Pagination
                currentPage={depositPage}
                totalPages={depositTotalPages}
                baseUrl="/payments"
                searchParams={{ page: params.page }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
