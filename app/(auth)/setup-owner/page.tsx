"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * One-off setup: create owner@automaroc.ma with password123 in production.
 * Set SEED_OWNER_SECRET in Vercel env, then visit this page and enter the same value.
 * Remove this page after login works.
 */
export default function SetupOwnerPage() {
  const [secret, setSecret] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/seed-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: secret.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setMessage({
          type: "ok",
          text: "Compte owner créé. Vous pouvez vous connecter avec owner@automaroc.ma / password123",
        });
      } else {
        setMessage({
          type: "err",
          text: data.error || data.message || "Échec (vérifiez le code ou les variables d’environnement).",
        });
      }
    } catch (err) {
      setMessage({ type: "err", text: "Erreur réseau." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-center">Configuration compte owner</h1>
        <p className="text-sm text-muted-foreground text-center">
          Une seule fois : entrez le code défini dans <code className="bg-gray-100 px-1">SEED_OWNER_SECRET</code> sur Vercel.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="secret">Code de configuration</Label>
            <Input
              id="secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Même valeur que SEED_OWNER_SECRET"
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "En cours…" : "Créer le compte owner"}
          </Button>
        </form>
        {message && (
          <p
            className={`text-sm ${
              message.type === "ok" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}
        <p className="text-xs text-muted-foreground text-center">
          Identifiants après création : owner@automaroc.ma / password123
        </p>
      </div>
    </div>
  );
}
