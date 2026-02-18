import { startOfMonth } from "date-fns";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { ClientsPageV2 } from "@/components/customers/clients-page-v2";

const PAGE_SIZE = 25;

interface CustomersPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const where = { agencyId: session.user.agencyId };
  const monthStart = startOfMonth(new Date());

  const [customers, total, withReservations, withoutDocuments, createdThisMonth] = await Promise.all([
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
  ]);

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
      }))}
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
