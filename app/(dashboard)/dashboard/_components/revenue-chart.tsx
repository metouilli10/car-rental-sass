"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

// Sample data - in production, this would come from actual analytics
const monthlyData = [
  { month: "Jan 2025", revenue: 2850 },
  { month: "Feb 2025", revenue: 3200 },
  { month: "Mar 2025", revenue: 4100 },
  { month: "Apr 2025", revenue: 6788 },
  { month: "May 2025", revenue: 3900 },
  { month: "Jun 2025", revenue: 4200 },
  { month: "July 2025", revenue: 4500 },
];

export function RevenueChart() {
  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));
  const avgRevenue = Math.round(monthlyData.reduce((sum, d) => sum + d.revenue, 0) / monthlyData.length);

  // Generate SVG path
  const width = 800;
  const height = 200;
  const padding = 40;

  const xScale = (index: number) => padding + (index / (monthlyData.length - 1)) * (width - 2 * padding);
  const yScale = (value: number) => height - padding - ((value / maxRevenue) * (height - 2 * padding));

  const pathD = monthlyData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.revenue)}`)
    .join(' ');

  const gradientPathD = `${pathD} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

  // Find peak point
  const peakIndex = monthlyData.findIndex(d => d.revenue === Math.max(...monthlyData.map(d => d.revenue)));
  const peakX = xScale(peakIndex);
  const peakY = yScale(monthlyData[peakIndex].revenue);

  return (
    <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <CardHeader className="border-b border-gray-100 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Overview Revenue
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-gray-900">
                ${avgRevenue.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500">/ avg month</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              Filter
            </button>
            <select className="px-3 py-1.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <option>This Year</option>
              <option>Last Year</option>
              <option>All Time</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto"
            style={{ maxHeight: "240px" }}
          >
            {/* Grid lines */}
            <line
              x1={padding}
              y1={height - padding}
              x2={width - padding}
              y2={height - padding}
              stroke="#E5E7EB"
              strokeWidth="1"
            />

            {/* Gradient fill */}
            <defs>
              <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Filled area */}
            <path
              d={gradientPathD}
              fill="url(#revenueGradient)"
            />

            {/* Line */}
            <path
              d={pathD}
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {monthlyData.map((d, i) => (
              <circle
                key={i}
                cx={xScale(i)}
                cy={yScale(d.revenue)}
                r="4"
                fill="#8B5CF6"
                stroke="white"
                strokeWidth="2"
                className="hover:r-6 transition-all cursor-pointer"
              />
            ))}

            {/* Peak indicator */}
            <g>
              <line
                x1={peakX}
                y1={peakY}
                x2={peakX}
                y2={height - padding}
                stroke="#8B5CF6"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.3"
              />
              <rect
                x={peakX - 35}
                y={peakY - 40}
                width="70"
                height="32"
                rx="16"
                fill="#1F2937"
                className="drop-shadow-lg"
              />
              <text
                x={peakX}
                y={peakY - 18}
                textAnchor="middle"
                fill="white"
                fontSize="14"
                fontWeight="600"
              >
                ${monthlyData[peakIndex].revenue.toLocaleString()}
              </text>
            </g>

            {/* X-axis labels */}
            {monthlyData.map((d, i) => (
              <text
                key={i}
                x={xScale(i)}
                y={height - 15}
                textAnchor="middle"
                fill="#9CA3AF"
                fontSize="12"
              >
                {d.month.split(' ')[0]}
              </text>
            ))}

            {/* Y-axis labels */}
            <text x="10" y="30" fill="#9CA3AF" fontSize="11">10k</text>
            <text x="10" y="90" fill="#9CA3AF" fontSize="11">5k</text>
            <text x="10" y="height - 50" fill="#9CA3AF" fontSize="11">0</text>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
