import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AuthzError, getCurrentUserOrThrow } from "@/lib/authz";
import { getBookingInvoiceData } from "@/lib/bookings/invoice";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { InvoicePrintButton } from "@/components/bookings/InvoicePrintButton";

export const runtime = "nodejs";
export const preferredRegion = "fra1";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={strong ? "font-semibold text-slate-950" : "font-medium text-slate-800"}>
        {value}
      </span>
    </div>
  );
}

export default async function BookingInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let currentUser;

  try {
    currentUser = await getCurrentUserOrThrow();
  } catch (error) {
    if (error instanceof AuthzError && error.status === 401) {
      redirect("/login");
    }
    throw error;
  }

  const { id } = await params;
  const invoice = await getBookingInvoiceData(id, currentUser.agencyId);

  if (!invoice) {
    notFound();
  }

  const hasAddressBlock = Boolean(invoice.agency.address || invoice.agency.city || invoice.agency.rcNumber);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 print:bg-white print:p-0">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 pb-5 print:hidden">
        <Link
          href={`/bookings/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la réservation
        </Link>
        <InvoicePrintButton />
      </div>

      <article className="mx-auto max-w-5xl rounded-[10px] border border-slate-200 bg-white px-8 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] print:max-w-none print:rounded-none print:border-0 print:px-8 print:py-8 print:shadow-none sm:px-12">
        <div className="flex items-start justify-between gap-8">
          <div className="space-y-3">
            <h1 className="text-5xl font-semibold tracking-tight text-[#3f61ad]">Facture</h1>
            <p className="max-w-md text-sm leading-6 text-slate-500">
              Facture de réservation générée depuis Locaryx pour la location de véhicule.
            </p>
          </div>

          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-base font-semibold text-white">
            {invoice.agency.logoUrl ? (
              <Image
                src={invoice.agency.logoUrl}
                alt={`Logo ${invoice.agency.name}`}
                width={96}
                height={96}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              "Logo"
            )}
          </div>
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-2">
          <div className="grid grid-cols-[90px_1fr] gap-x-4 gap-y-2 text-sm">
            <p className="font-semibold text-slate-950">Vendeur</p>
            <div className="space-y-1 text-slate-700">
              <p className="font-semibold">{invoice.agency.name}</p>
              {invoice.agency.address ? <p>{invoice.agency.address}</p> : null}
              <p>{invoice.agency.city}</p>
              {invoice.agency.rcNumber ? <p>RC {invoice.agency.rcNumber}</p> : null}
            </div>
          </div>

          <div className="grid grid-cols-[90px_1fr] gap-x-4 gap-y-2 text-sm">
            <p className="font-semibold text-slate-950">Client</p>
            <div className="space-y-1 text-slate-700">
              <p className="font-semibold">{invoice.customer.name}</p>
              <p>{invoice.customer.phone}</p>
              {invoice.customer.email ? <p>{invoice.customer.email}</p> : null}
              {invoice.customer.passportOrCIN ? <p>{invoice.customer.passportOrCIN}</p> : null}
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="font-semibold text-slate-950">Date de facturation</p>
            <p className="mt-2 text-slate-700">{formatDate(invoice.invoiceDate)}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-950">Numéro de facture</p>
            <p className="mt-2 text-slate-700">{invoice.reference}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-950">Échéance</p>
            <p className="mt-2 text-slate-700">{formatDate(invoice.rentalPeriod.startDate)}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-950">Paiement</p>
            <p className="mt-2 text-slate-700">
              {invoice.totals.remainingAmount > 0 ? "À réception" : "Réglé"}
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-950">Référence</p>
            <p className="mt-2 text-slate-700">RES-{invoice.reference}</p>
          </div>
        </div>

        <div className="mt-10 text-sm text-slate-700">
          <p className="font-semibold text-slate-950">Informations additionnelles :</p>
          <div className="mt-2 space-y-1">
            <p>
              Véhicule : {invoice.vehicle.make} {invoice.vehicle.model} ({invoice.vehicle.plate})
            </p>
            <p>
              Période : {formatDate(invoice.rentalPeriod.startDate)} → {formatDate(invoice.rentalPeriod.endDate)}
            </p>
            {(invoice.pickupLocation || invoice.returnLocation) ? (
              <p>
                {invoice.pickupLocation ? `Départ : ${invoice.pickupLocation}` : ""}
                {invoice.pickupLocation && invoice.returnLocation ? " • " : ""}
                {invoice.returnLocation ? `Retour : ${invoice.returnLocation}` : ""}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-10 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#3f61ad] text-left text-white">
              <tr>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Quantité</th>
                <th className="px-4 py-3 font-medium">Unité</th>
                <th className="px-4 py-3 font-medium">Prix unitaire HT</th>
                <th className="px-4 py-3 font-medium">% TVA</th>
                <th className="px-4 py-3 font-medium">Total TVA</th>
                <th className="px-4 py-3 text-right font-medium">Total TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr className="text-slate-700">
                <td className="px-4 py-4">
                  Location {invoice.vehicle.make} {invoice.vehicle.model}
                </td>
                <td className="px-4 py-4">{invoice.rentalPeriod.durationText}</td>
                <td className="px-4 py-4">jour</td>
                <td className="px-4 py-4">{formatCurrency(invoice.totals.rentalBase)}</td>
                <td className="px-4 py-4">{invoice.totals.taxRate}%</td>
                <td className="px-4 py-4">{formatCurrency(invoice.totals.totalTva)}</td>
                <td className="px-4 py-4 text-right font-medium">{formatCurrency(invoice.totals.totalTtc)}</td>
              </tr>
              {invoice.addons.map((addon) => (
                <tr key={addon.id} className="text-slate-700">
                  <td className="px-4 py-4">{addon.label}</td>
                  <td className="px-4 py-4">{addon.quantity}</td>
                  <td className="px-4 py-4">pièce</td>
                  <td className="px-4 py-4">{formatCurrency(addon.unitAmount)}</td>
                  <td className="px-4 py-4">{invoice.totals.taxRate}%</td>
                  <td className="px-4 py-4">-</td>
                  <td className="px-4 py-4 text-right font-medium">{formatCurrency(addon.totalAmount)}</td>
                </tr>
              ))}
              {invoice.totals.discountAmount > 0 ? (
                <tr className="text-slate-700">
                  <td className="px-4 py-4">Remise commerciale</td>
                  <td className="px-4 py-4">1</td>
                  <td className="px-4 py-4">forfait</td>
                  <td className="px-4 py-4">-{formatCurrency(invoice.totals.discountAmount)}</td>
                  <td className="px-4 py-4">0%</td>
                  <td className="px-4 py-4">0,00 MAD</td>
                  <td className="px-4 py-4 text-right font-medium">-{formatCurrency(invoice.totals.discountAmount)}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-end">
          <div className="w-full max-w-sm space-y-5 text-sm">
            <SummaryRow label="Total HT" value={formatCurrency(invoice.totals.totalHt)} strong />
            <SummaryRow label="Total TVA" value={formatCurrency(invoice.totals.totalTva)} strong />
            <SummaryRow label="Total TTC" value={formatCurrency(invoice.totals.totalTtc)} strong />
            <SummaryRow label="Montant payé" value={formatCurrency(invoice.totals.paidAmount)} />
            <div className="flex items-center justify-between border-t border-slate-300 pt-4 text-[#3f61ad]">
              <span className="font-semibold">Reste à payer</span>
              <span className="text-base font-semibold">
                {formatCurrency(invoice.totals.remainingAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-slate-300 pt-5">
          <div className="grid gap-6 text-[12px] leading-5 text-slate-700 md:grid-cols-3">
            <div>
              <p className="font-semibold text-slate-950">{invoice.agency.name}</p>
              {invoice.agency.address ? <p>{invoice.agency.address}</p> : null}
              <p>{invoice.agency.city}</p>
              {invoice.agency.rcNumber ? <p>RC : {invoice.agency.rcNumber}</p> : null}
            </div>
            <div>
              <p className="font-semibold text-slate-950">Coordonnées</p>
              <p>Téléphone : {invoice.customer.phone}</p>
              {invoice.customer.email ? <p>Email : {invoice.customer.email}</p> : null}
              <p>Créée le {formatDateTime(invoice.bookingDate)}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">Détails réservation</p>
              <p>Réf : RES-{invoice.reference}</p>
              <p>{invoice.vehicle.make} {invoice.vehicle.model}</p>
              <p>{invoice.vehicle.plate}</p>
            </div>
          </div>
          <div className="mt-4 h-5 bg-[#3f61ad]" />
        </div>
      </article>
    </div>
  );
}
