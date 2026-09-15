import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiClient } from '../lib/apiClient';
import { StatCard } from '../components/StatCard';

const MOCK_WEEKLY_BOOKINGS = [
  { day: 'Mon', bookings: 120 },
  { day: 'Tue', bookings: 145 },
  { day: 'Wed', bookings: 132 },
  { day: 'Thu', bookings: 168 },
  { day: 'Fri', bookings: 210 },
  { day: 'Sat', bookings: 260 },
  { day: 'Sun', bookings: 190 },
];

export function DashboardPage() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get('/health')
      .then(() => {
        if (!cancelled) setApiStatus('online');
      })
      .catch(() => {
        if (!cancelled) setApiStatus('offline');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            apiStatus === 'online'
              ? 'bg-emerald-50 text-emerald-700'
              : apiStatus === 'offline'
                ? 'bg-red-50 text-red-700'
                : 'bg-slate-100 text-slate-500'
          }`}
        >
          API: {apiStatus}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total bookings" value="—" hint="Wired up in the bookings module" />
        <StatCard label="Revenue (MTD)" value="—" hint="Wired up in the reports module" />
        <StatCard label="Active operators" value="—" hint="Wired up in the operators module" />
        <StatCard label="Today's trips" value="—" hint="Wired up in the trips module" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">
          Weekly bookings (sample data)
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={MOCK_WEEKLY_BOOKINGS}>
            <defs>
              <linearGradient id="bookingsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="bookings"
              stroke="#2563eb"
              fill="url(#bookingsFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
