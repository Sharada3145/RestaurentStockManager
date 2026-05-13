import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Search, User, Shield, MoreVertical, Mail, Calendar } from 'lucide-react';

const MOCK_USERS = [
  { id: 1, name: 'Executive Chef', email: 'admin@stockiq.com', role: 'admin', joined: '2024-01-15' },
  { id: 2, name: 'Floor Manager', email: 'manager@stockiq.com', role: 'manager', joined: '2024-02-10' },
  { id: 3, name: 'Chef de Cuisine', email: 'chef@stockiq.com', role: 'chef', joined: '2024-03-05' },
];

export const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-luxury-text-primary tracking-tight">TEAM MANAGEMENT</h1>
          <p className="text-luxury-text-muted text-sm font-medium mt-1">Control access and roles for your establishment</p>
        </div>
        
        <button className="flex items-center gap-2 px-6 py-3 bg-luxury-gradient text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-gold hover:scale-105 transition-transform active:scale-95">
          <UserPlus size={16} />
          Add Team Member
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white/60 backdrop-blur-xl border border-luxury-border rounded-[32px] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-luxury-border flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-text-muted" size={18} />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-luxury-cream/50 border border-luxury-border rounded-xl focus:ring-2 focus:ring-luxury-gold/20 focus:border-luxury-gold outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-luxury-cream/30">
                  <th className="px-8 py-5 text-left text-[10px] font-black text-luxury-text-muted uppercase tracking-[0.2em]">Member</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-luxury-text-muted uppercase tracking-[0.2em]">Role</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-luxury-text-muted uppercase tracking-[0.2em]">Joined</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-luxury-text-muted uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-border">
                {MOCK_USERS.map((u, idx) => (
                  <motion.tr 
                    key={u.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-luxury-gold/5 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-luxury-cream border border-luxury-gold/20 flex items-center justify-center text-luxury-gold group-hover:bg-white transition-colors">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-luxury-text-primary">{u.name}</p>
                          <div className="flex items-center gap-2 text-xs text-luxury-text-muted">
                            <Mail size={12} />
                            <span>{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          u.role === 'admin' ? 'bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30' :
                          u.role === 'manager' ? 'bg-status-success/10 text-status-success border border-status-success/20' :
                          'bg-luxury-cream text-luxury-text-muted border border-luxury-border'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            <Shield size={10} />
                            {u.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-xs text-luxury-text-muted font-medium">
                        <Calendar size={14} />
                        {u.joined}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 hover:bg-white rounded-lg transition-colors text-luxury-text-muted hover:text-luxury-gold">
                        <MoreVertical size={20} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
