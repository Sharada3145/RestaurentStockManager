import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2.5 text-xs">
      <p className="font-medium text-slate-300 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-mono font-semibold">{Number(p.value).toFixed(3)}</span>
        </p>
      ))}
    </div>
  );
};

export function PredictionChart({ forecast = {}, ingredient }) {
  const data = Object.entries(forecast).map(([date, value]) => ({
    date: date.slice(5),   // "05-14"
    predicted: value,
  }));

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-500">
        No forecast data — submit some stock entries first.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="predLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#6366f1" />
            <stop offset="100%" stopColor="#2dd4bf" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={45} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="predicted"
          name={ingredient || 'Consumption'}
          stroke="url(#predLine)"
          strokeWidth={2.5}
          dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#2dd4bf' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
