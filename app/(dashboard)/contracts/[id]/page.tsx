import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { GenerateContractButton } from "@/components/contracts/generate-contract-button";

export default async function ContractViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      vehicle: true,
      contract: true,
    },
  });

  if (!booking || booking.agencyId !== session.user.agencyId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contrat de location"
        description={`${booking.customer.name} - ${booking.vehicle.make} ${booking.vehicle.model}`}
      />

      {!booking.contract ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Aucun contrat généré
              </h3>
              <p className="text-muted-foreground mb-6">
                Générez le contrat de location pour cette réservation
              </p>
              <GenerateContractButton bookingId={booking.id} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Contrat de location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Contrat PDF</p>
                  <p className="text-sm text-muted-foreground">
                    Généré le {formatDate(booking.contract.generatedAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <a
                      href={booking.contract.pdfUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </a>
                  </Button>
                  <GenerateContractButton
                    bookingId={booking.id}
                    isRegenerate={true}
                  />
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={booking.contract.pdfUrl}
                  className="w-full h-[800px]"
                  title="Contrat de location"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button asChild variant="outline">
                <Link href={`/bookings/${booking.id}`}>
                  Retour à la réservation
                </Link>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
