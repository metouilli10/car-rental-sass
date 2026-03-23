"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InvoicePrintButton() {
  return (
    <Button type="button" onClick={() => window.print()} className="bg-slate-900 hover:bg-slate-800">
      <Printer className="mr-2 h-4 w-4" />
      Imprimer / PDF
    </Button>
  );
}
