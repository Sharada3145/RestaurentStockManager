import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Area, AreaChart
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel px-5 py-4 border-luxury-gold/20 shadow-gold bg-white/95">
      <p className="text-[10px] font-black text-luxury-gold uppercase tracking-[0.2em] mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-baseline gap-3">
           <span className="text-xl font-black text-luxury-text-primary">{Number(p.value).toFixed(2)}</span>
           <span className="text-[10px] text-luxury-text-muted uppercase font-bold tracking-widest">kg/l</span>
        </div>
      ))}
    </div>
  );
};

export function PredictionChart({ forecast = {}, ingredient, premium = false, warm = true }) {
  const data = Object.entries(forecast).map(([date, value]) => ({
    date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
    usage: value,
  }));

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-luxury-text-muted/20 gap-6">
        <div className="w-20 h-20 rounded-[32px] bg-luxury-cream border border-luxury-border flex items-center justify-center shadow-sm">
           <span className="text-3xl font-black">?</span>
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em]">Projection data pending</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="warmGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#C9A227" stopOpacity={0.25}/>
            <stop offset="95%" stopColor="#C9A227" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,42,38,0.05)" vertical={false} />
        <XAxis 
          dataKey="date" 
          tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 700 }} 
          axisLine={false} 
          tickLine={false} 
          dy={15}
        />
        <YAxis 
          tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 700 }} 
          axisLine={false} 
          tickLine={false} 
        />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="usage" 
          stroke="#C9A227" 
          strokeWidth={4}
          fillOpacity={1} 
          fill="url(#warmGrad)" 
          animationDuration={1500}
          activeDot={{ r: 8, fill: '#C9A227', stroke: '#fff', strokeWidth: 3, shadow: '0 0 15px rgba(201,162,39,0.3)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
