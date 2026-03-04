"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, User, Calendar, Car, ArrowRight, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { searchGlobal, type SearchResult } from "@/lib/actions/search";
import { STATUS_LABELS } from "@/lib/search-constants";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult>({
    clients: [],
    reservations: [],
    vehicles: [],
  });
  const router = useRouter();

  const fetchResults = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) {
      setResults({ clients: [], reservations: [], vehicles: [] });
      return;
    }
    setLoading(true);
    try {
      const data = await searchGlobal(q);
      setResults(data);
    } catch {
      setResults({ clients: [], reservations: [], vehicles: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search when query changes
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      fetchResults(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, open, fetchResults]);

  // Clear query and results when dialog closes
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setQuery("");
        setResults({ clients: [], reservations: [], vehicles: [] });
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const hasResults =
    results.clients.length > 0 ||
    results.reservations.length > 0 ||
    results.vehicles.length > 0;
  const q = query.trim().toLowerCase();
  const showEmptyState = !loading && q.length >= 2 && !hasResults;
  const showPrompt = !q;

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
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-muted-foreground bg-muted rounded border border-border/60">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-[400px]">
          {showEmptyState && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Aucun résultat pour &ldquo;{query}&rdquo;
            </div>
          )}

          {hasResults && (
            <div className="py-2">
              {/* Clients */}
              {results.clients.length > 0 && (
                <section>
                  <div className="px-4 py-2 flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Clients
                    </span>
                  </div>
                  {results.clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => navigate(`/customers/${client.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left group"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                        {client.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {client.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {client.phone} · {client.bookings} réservation
                          {client.bookings > 1 ? "s" : ""}
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </section>
              )}

              {/* Réservations */}
              {results.reservations.length > 0 && (
                <section
                  className={
                    results.clients.length > 0
                      ? "mt-1 border-t border-border/30 pt-1"
                      : ""
                  }
                >
                  <div className="px-4 py-2 flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Réservations
                    </span>
                  </div>
                  {results.reservations.map((res) => {
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
                            <p className="text-sm font-medium text-foreground">
                              {res.ref}
                            </p>
                            {st && (
                              <span
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${st.color}`}
                              >
                                {st.label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {res.client} · {res.vehicle} · {res.dates}
                          </p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </section>
              )}

              {/* Véhicules */}
              {results.vehicles.length > 0 && (
                <section
                  className={
                    results.clients.length > 0 ||
                    results.reservations.length > 0
                      ? "mt-1 border-t border-border/30 pt-1"
                      : ""
                  }
                >
                  <div className="px-4 py-2 flex items-center gap-2">
                    <Car className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Véhicules
                    </span>
                  </div>
                  {results.vehicles.map((vehicle) => {
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
                            <p className="text-sm font-medium text-foreground">
                              {vehicle.make} {vehicle.model}
                            </p>
                            {st && (
                              <span
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${st.color}`}
                              >
                                {st.label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {vehicle.plate}
                          </p>
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
          {showPrompt && (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-muted-foreground">
                Tapez au moins 2 caractères pour rechercher des clients,
                réservations ou véhicules.
              </p>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border/30 px-4 py-2.5 flex items-center justify-between bg-muted/20">
          <span className="text-[11px] text-muted-foreground/60">
            Appuyez sur{" "}
            <kbd className="px-1 py-0.5 bg-muted rounded border border-border/50 font-mono text-[10px]">
              ↵
            </kbd>{" "}
            pour ouvrir
          </span>
          <span className="text-[11px] text-muted-foreground/60">
            <kbd className="px-1 py-0.5 bg-muted rounded border border-border/50 font-mono text-[10px]">
              ESC
            </kbd>{" "}
            pour fermer
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
