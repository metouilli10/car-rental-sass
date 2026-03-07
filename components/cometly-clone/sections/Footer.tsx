import React from "react";
import { footerColumns } from "../data";

export function Footer() {
  return (
    <footer className="bg-slate-50 pt-24 pb-12 border-t border-slate-200">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
                C
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">cometly</span>
            </div>
            <div className="flex gap-4">
              {/* Social Icons Placeholders */}
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-8 rounded-full bg-slate-200 hover:bg-indigo-100 hover:text-indigo-600 transition-colors cursor-pointer" />
              ))}
            </div>
          </div>
          
          {footerColumns.map((column, index) => (
            <div key={index}>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">{column.title}</h3>
              <ul className="space-y-3">
                {column.links.map((link, i) => (
                  <li key={i}>
                    <a href="#" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © 2026 Comet LLC. All Rights Reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-900">Privacy</a>
            <a href="#" className="hover:text-slate-900">Terms</a>
            <a href="#" className="hover:text-slate-900">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
