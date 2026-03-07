import React from "react";
import { Badge } from "@/components/ui/badge";
import { Search, Bell, Settings, HelpCircle, ChevronDown, Filter, Columns, Calendar } from "lucide-react";

export function ProductPreview() {
  return (
    <div className="relative rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur shadow-2xl overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/20 border border-red-500/50" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
            <div className="h-3 w-3 rounded-full bg-green-500/20 border border-green-500/50" />
          </div>
          <div className="h-6 w-px bg-slate-800 mx-2" />
          <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-700/50 w-64">
            <Search className="h-3.5 w-3.5" />
            <span>Search...</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <Bell className="h-4 w-4 hover:text-white cursor-pointer" />
          <HelpCircle className="h-4 w-4 hover:text-white cursor-pointer" />
          <Settings className="h-4 w-4 hover:text-white cursor-pointer" />
          <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold ml-2">
            JD
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex h-[500px] md:h-[600px]">
        {/* Sidebar */}
        <div className="hidden md:flex w-16 flex-col items-center py-4 gap-6 border-r border-slate-800 bg-slate-900/30">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <div className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-300 flex items-center justify-center">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-300 flex items-center justify-center">
             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <h2 className="text-lg font-semibold text-white">Campaign Performance</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-xs">
                <Calendar className="mr-2 h-3.5 w-3.5" />
                Last 30 Days
              </Button>
              <Button variant="outline" size="sm" className="h-8 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-xs">
                <Filter className="mr-2 h-3.5 w-3.5" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="h-8 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-xs">
                <Columns className="mr-2 h-3.5 w-3.5" />
                Columns
              </Button>
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-800 bg-slate-900/50 text-xs font-medium text-slate-400 uppercase tracking-wider">
            <div className="col-span-4">Campaign Name</div>
            <div className="col-span-2 text-right">Status</div>
            <div className="col-span-2 text-right">Amount Spent</div>
            <div className="col-span-2 text-right">Purchases</div>
            <div className="col-span-2 text-right">ROAS</div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto">
            {[
              { name: "Campaign 1 - US,UK,CA - LAA 1-2%", status: "Active", spent: "$2,354.59", purchases: 15, roas: "3.2x", active: true },
              { name: "Campaign 2 - FB News Feed - All", status: "Active", spent: "$8,354.59", purchases: 53, roas: "4.1x", active: true },
              { name: "Campaign 3 - Instagram - LAA 5%", status: "Active", spent: "$1,264.06", purchases: 18, roas: "2.8x", active: true },
              { name: "Campaign 4 - US - LAA 1%", status: "Paused", spent: "$743.49", purchases: 28, roas: "1.5x", active: false },
              { name: "Campaign 5 - UK - LAA 1-2%", status: "Paused", spent: "$178.34", purchases: 34, roas: "1.2x", active: false },
              { name: "Campaign 6 - US - Retargeting", status: "Active", spent: "$234.22", purchases: 8, roas: "5.4x", active: true },
              { name: "Campaign 7 - US,CA,UK - LAA 1%", status: "Paused", spent: "$1,124.03", purchases: 67, roas: "1.1x", active: false },
              { name: "Campaign 8 - US - LAA 1-3%", status: "Paused", spent: "$1,023.19", purchases: 24, roas: "0.9x", active: false },
              { name: "Campaign 9 - UK - Broad", status: "Paused", spent: "$8,342.93", purchases: 89, roas: "1.8x", active: false },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors items-center text-sm">
                <div className="col-span-4 font-medium text-slate-200 truncate">{row.name}</div>
                <div className="col-span-2 text-right">
                  <Badge variant="outline" className={cn("border-0", row.active ? "bg-green-500/10 text-green-400" : "bg-slate-700/30 text-slate-400")}>
                    {row.status}
                  </Badge>
                </div>
                <div className="col-span-2 text-right text-slate-300">{row.spent}</div>
                <div className="col-span-2 text-right text-slate-300">{row.purchases}</div>
                <div className="col-span-2 text-right font-medium text-indigo-400">{row.roas}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* AI Sidebar (Right) */}
        <div className="hidden lg:flex w-80 flex-col border-l border-slate-800 bg-slate-900/80 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-6">
                <div className="h-6 w-6 rounded bg-indigo-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">AI</span>
                </div>
                <span className="font-semibold text-white">Cometly AI</span>
            </div>
            
            <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-2">Insight</p>
                    <p className="text-sm text-slate-200">Campaign 2 has a 28% higher ROAS than your average. Consider increasing budget by $200/day.</p>
                </div>
                 <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-2">Alert</p>
                    <p className="text-sm text-slate-200">Campaign 4 CPA has increased by 15% in the last 24 hours.</p>
                </div>
            </div>
            
            <div className="mt-auto">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Ask AI about your data..." 
                        className="w-full bg-slate-800 border-slate-700 rounded-md py-2 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="absolute right-2 top-2">
                        <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
