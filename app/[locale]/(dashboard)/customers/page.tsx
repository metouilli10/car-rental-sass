import { redirect } from "next/navigation";
import { startOfMonth } from "date-fns";
import { canDeleteCustomer, canManageCustomers } from "@/lib/permissions";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import { supportsCustomerDocumentBacks } from "@/lib/customer-document-backs";
import { prisma } from "@/lib/prisma";
import { ClientsPageV2 } from "@/components/customers/clients-page-v2";

const PAGE_SIZE = 25;

interface CustomersPageProps {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const currentUser = await getCurrentUserAccessForPage();

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const searchQuery = params.q?.trim() || "";
  const where = {
    agencyId: currentUser.agencyId,
    ...(searchQuery
      ? {
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" as const } },
            { email: { contains: searchQuery, mode: "insensitive" as const } },
            { phone: { contains: searchQuery } },
            { passportOrCIN: { contains: searchQuery, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const monthStart = startOfMonth(new Date());
  const canManage = canManageCustomers(
    currentUser.role,
    currentUser.permissions,
  );
  const canDelete = canDeleteCustomer(
    currentUser.role,
    currentUser.permissions,
  );
  const hasDocumentBacks = await supportsCustomerDocumentBacks();
  const withoutDocumentsWhere = hasDocumentBacks
    ? {
        AND: [
          {
            AND: [
              { OR: [{ passportPhotoUrl: null }, { passportPhotoUrl: "" }] },
              { OR: [{ passportPhotoBackUrl: null }, { passportPhotoBackUrl: "" }] },
            ],
          },
          {
            AND: [
              { OR: [{ licensePhotoUrl: null }, { licensePhotoUrl: "" }] },
              { OR: [{ licensePhotoBackUrl: null }, { licensePhotoBackUrl: "" }] },
            ],
          },
        ],
      }
    : {
        AND: [
          { OR: [{ passportPhotoUrl: null }, { passportPhotoUrl: "" }] },
          { OR: [{ licensePhotoUrl: null }, { licensePhotoUrl: "" }] },
        ],
      };

  const [customers, total, withReservations, withoutDocuments, createdThisMonth] =
    await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        customerType: true,
        name: true,
        email: true,
        phone: true,
        passportOrCIN: true,
        passportPhotoUrl: true,
        licensePhotoUrl: true,
        nationality: true,
        createdAt: true,
        ...(hasDocumentBacks
          ? {
              passportPhotoBackUrl: true,
              licensePhotoBackUrl: true,
            }
          : {}),
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
        ...withoutDocumentsWhere,
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

  const financialByCustomer =
    customers.length > 0
      ? await prisma.booking.groupBy({
          by: ["customerId"],
          where: {
            agencyId: currentUser.agencyId,
            status: { not: "CANCELED" },
            customerId: { in: customers.map((customer) => customer.id) },
          },
          _sum: {
            totalPrice: true,
            remainingAmount: true,
          },
        })
      : [];

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
        passportPhotoBackUrl: hasDocumentBacks ? customer.passportPhotoBackUrl ?? null : null,
        licensePhotoUrl: customer.licensePhotoUrl,
        licensePhotoBackUrl: hasDocumentBacks ? customer.licensePhotoBackUrl ?? null : null,
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
      defaultSearch={searchQuery}
    />
  );
}
