"use client";

import { useState, useEffect } from "react";
import { Search, User, Calendar, Car, ArrowRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

// TODO: Wire to server action search endpoints (customers, bookings, vehicles)
const MOCK_CLIENTS = [
  { id: "c1", name: "Karim Benali", phone: "0661 234 567", bookings: 4 },
  { id: "c2", name: "Fatima Zahra Idrissi", phone: "0662 345 678", bookings: 2 },
  { id: "c3", name: "Youssef El Mansouri", phone: "0663 456 789", bookings: 7 },
];

const MOCK_RESERVATIONS = [
  { id: "r1", ref: "#1042", client: "Karim Benali", vehicle: "Dacia Logan", status: "ACTIVE", dates: "12 fév – 17 fév" },
  { id: "r2", ref: "#1038", client: "Fatima Zahra Idrissi", vehicle: "Renault Clio", status: "CONFIRMED", dates: "18 fév – 22 fév" },
  { id: "r3", ref: "#1035", client: "Youssef El Mansouri", vehicle: "Peugeot 208", status: "COMPLETED", dates: "1 fév – 8 fév" },
];

const MOCK_VEHICLES = [
  { id: "v1", plate: "AB-123-CD", make: "Dacia", model: "Logan", status: "RENTED" },
  { id: "v2", plate: "EF-456-GH", make: "Renault", model: "Clio", status: "AVAILABLE" },
  { id: "v3", plate: "IJ-789-KL", make: "Peugeot", model: "208", status: "AVAILABLE" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE:     { label: "Actif",      color: "text-blue-600 bg-blue-50" },
  CONFIRMED:  { label: "Confirmé",   color: "text-emerald-600 bg-emerald-50" },
  COMPLETED:  { label: "Terminé",    color: "text-gray-500 bg-gray-100" },
  AVAILABLE:  { label: "Disponible", color: "text-emerald-600 bg-emerald-50" },
  RENTED:     { label: "Loué",       color: "text-blue-600 bg-blue-50" },
  MAINTENANCE:{ label: "Maintenance",color: "text-amber-600 bg-amber-50" },
};

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Clear query when dialog closes
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setQuery(""), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const q = query.toLowerCase().trim();
  const filteredClients = q
    ? MOCK_CLIENTS.filter(
        (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
      )
    : MOCK_CLIENTS;
  const filteredReservations = q
    ? MOCK_RESERVATIONS.filter(
        (r) =>
          r.ref.toLowerCase().includes(q) ||
          r.client.toLowerCase().includes(q) ||
          r.vehicle.toLowerCase().includes(q)
      )
    : MOCK_RESERVATIONS;
  const filteredVehicles = q
    ? MOCK_VEHICLES.filter(
        (v) =>
          v.plate.toLowerCase().includes(q) ||
          v.make.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q)
      )
    : MOCK_VEHICLES;

  const hasResults =
    filteredClients.length > 0 ||
    filteredReservations.length > 0 ||
    filteredVehicles.length > 0;

  function navigate(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden top-[20%] translate-y-0 data-[state=open]:slide-in-from-top-[10%] data-[state=closed]:slide-out-to-top-[10%]">
        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (client, réservation, véhicule, téléphone…)"
            className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-muted-foreground bg-muted rounded border border-border/60">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-[400px]">
          {!hasResults && q !== "" && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Aucun résultat pour &ldquo;{query}&rdquo;
            </div>
          )}

          {hasResults && (
            <div className="py-2">
              {/* Clients */}
              {filteredClients.length > 0 && (
                <section>
                  <div className="px-4 py-2 flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Clients
                    </span>
                  </div>
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => navigate(`/customers/${client.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left group"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                        {client.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.phone} · {client.bookings} réservation{client.bookings > 1 ? "s" : ""}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </section>
              )}

              {/* Réservations */}
              {filteredReservations.length > 0 && (
                <section className={filteredClients.length > 0 ? "mt-1 border-t border-border/30 pt-1" : ""}>
                  <div className="px-4 py-2 flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Réservations
                    </span>
                  </div>
                  {filteredReservations.map((res) => {
                    const st = STATUS_LABELS[res.status];
                    return (
                      <button
                        key={res.id}
                        onClick={() => navigate(`/bookings/${res.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left group"
                      >
                        <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{res.ref}</p>
                            {st && (
                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                                {st.label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{res.client} · {res.vehicle} · {res.dates}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </section>
              )}

              {/* Véhicules */}
              {filteredVehicles.length > 0 && (
                <section className={filteredClients.length > 0 || filteredReservations.length > 0 ? "mt-1 border-t border-border/30 pt-1" : ""}>
                  <div className="px-4 py-2 flex items-center gap-2">
                    <Car className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Véhicules
                    </span>
                  </div>
                  {filteredVehicles.map((vehicle) => {
                    const st = STATUS_LABELS[vehicle.status];
                    return (
                      <button
                        key={vehicle.id}
                        onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left group"
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Car className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{vehicle.make} {vehicle.model}</p>
                            {st && (
                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                                {st.label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{vehicle.plate}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </section>
              )}
            </div>
          )}

          {/* Empty state when no query */}
          {!q && (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-muted-foreground">
                Commencez à taper pour rechercher des clients, réservations ou véhicules.
              </p>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border/30 px-4 py-2.5 flex items-center justify-between bg-muted/20">
          <span className="text-[11px] text-muted-foreground/60">
            Appuyez sur <kbd className="px-1 py-0.5 bg-muted rounded border border-border/50 font-mono text-[10px]">↵</kbd> pour ouvrir
          </span>
          <span className="text-[11px] text-muted-foreground/60">
            <kbd className="px-1 py-0.5 bg-muted rounded border border-border/50 font-mono text-[10px]">ESC</kbd> pour fermer
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
