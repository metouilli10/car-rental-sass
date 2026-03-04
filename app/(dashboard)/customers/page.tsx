import { redirect } from "next/navigation";
import { startOfMonth } from "date-fns";
import { getSession } from "@/lib/auth-cache";
import { canDeleteCustomer, canManageCustomers } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { ClientsPageV2 } from "@/components/customers/clients-page-v2";

const PAGE_SIZE = 25;

interface CustomersPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const session = await getSession();

  if (!session) redirect("/login");
  if (!session.user.agencyId) redirect("/setup");

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const where = { agencyId: session.user.agencyId };
  const monthStart = startOfMonth(new Date());
  const currentUser = await prisma.user.findFirst({
    where: { id: session.user.id, agencyId: session.user.agencyId },
    select: { permissionOverrides: true },
  });
  const canManage = canManageCustomers(
    session.user.role,
    currentUser?.permissionOverrides ?? null,
  );
  const canDelete = canDeleteCustomer(
    session.user.role,
    currentUser?.permissionOverrides ?? null,
  );

  const [customers, total, withReservations, withoutDocuments, createdThisMonth, financialByCustomer] =
    await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    }),
    prisma.customer.count({ where }),
    prisma.customer.count({
      where: {
        ...where,
        bookings: {
          some: {},
        },
      },
    }),
    prisma.customer.count({
      where: {
        ...where,
        AND: [
          {
            OR: [{ passportPhotoUrl: null }, { passportPhotoUrl: "" }],
          },
          {
            OR: [{ licensePhotoUrl: null }, { licensePhotoUrl: "" }],
          },
        ],
      },
    }),
    prisma.customer.count({
      where: {
        ...where,
        createdAt: {
          gte: monthStart,
        },
      },
    }),
    prisma.booking.groupBy({
      by: ["customerId"],
      where: {
        agencyId: session.user.agencyId,
        status: { not: "CANCELED" },
      },
      _sum: {
        totalPrice: true,
        remainingAmount: true,
      },
    }),
    ]);

  const financialMap = new Map(
    financialByCustomer.map((entry) => [
      entry.customerId,
      {
        totalSpent: entry._sum.totalPrice ?? 0,
        balance: entry._sum.remainingAmount ?? 0,
      },
    ]),
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <ClientsPageV2
      customers={customers.map((customer) => ({
        id: customer.id,
        customerType: customer.customerType,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        passportOrCIN: customer.passportOrCIN,
        passportPhotoUrl: customer.passportPhotoUrl,
        licensePhotoUrl: customer.licensePhotoUrl,
        nationality: customer.nationality,
        createdAt: customer.createdAt.toISOString(),
        bookingsCount: customer._count.bookings,
        totalSpent: financialMap.get(customer.id)?.totalSpent ?? 0,
        balance: financialMap.get(customer.id)?.balance ?? 0,
      }))}
      canManageCustomers={canManage}
      canDeleteCustomers={canDelete}
      stats={{
        totalClients: total,
        clientsWithReservations: withReservations,
        clientsWithoutDocuments: withoutDocuments,
        clientsAddedThisMonth: createdThisMonth,
      }}
      pagination={{
        currentPage: page,
        totalPages,
      }}
    />
  );
}
