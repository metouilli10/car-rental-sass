import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Edit, Phone, Mail } from "lucide-react";
import { DeleteCustomerButton } from "@/components/customers/delete-customer-button";

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

  const [customers, total] = await Promise.all([
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
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clients"
        description="Gérez vos clients et leurs informations"
        action={{
          label: "Ajouter un client",
          href: "/customers/add",
        }}
      />

      {customers.length === 0 && page === 1 ? (
        <div className="text-center py-16 rounded-2xl bg-white shadow-card">
          <p className="text-muted-foreground mb-4">Aucun client enregistré</p>
          <Button asChild>
            <Link href="/customers/add">Ajouter votre premier client</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-transparent border-b border-muted">
                <tr>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Passeport/CIN
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Réservations
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Créé le
                  </th>
                  <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/60">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-muted/40 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-foreground">{customer.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <a
                            href={`https://wa.me/${customer.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {customer.phone}
                          </a>
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {customer.passportOrCIN}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge variant="info">
                        {customer._count.bookings}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/customers/${customer.id}/edit`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Link>
                        </Button>
                        <DeleteCustomerButton customerId={customer.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} baseUrl="/customers" />
        </div>
      )}
    </div>
  );
}
