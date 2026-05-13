import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, AlertCircle, ChefHat, ArrowRight } from 'lucide-react';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(name, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-luxury-cream overflow-hidden relative">
      {/* Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-luxury-gold/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-luxury-gold/10 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 relative z-10"
      >
        <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[32px] border border-luxury-gold/20 shadow-premium">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-luxury-gradient flex items-center justify-center mb-6 shadow-gold">
              <ChefHat className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-black text-luxury-text-primary uppercase tracking-[0.3em]">Join StockIQ</h1>
            <p className="text-luxury-text-muted text-xs font-bold uppercase tracking-widest mt-2">Create Your Professional Account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-luxury-text-muted uppercase tracking-widest mb-2 ml-1">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-luxury-text-muted group-focus-within:text-luxury-gold transition-colors" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-white/50 border border-luxury-border rounded-2xl focus:ring-2 focus:ring-luxury-gold/20 focus:border-luxury-gold outline-none transition-all text-sm font-medium"
                  placeholder="Chef de Cuisine"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-luxury-text-muted uppercase tracking-widest mb-2 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-luxury-text-muted group-focus-within:text-luxury-gold transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-white/50 border border-luxury-border rounded-2xl focus:ring-2 focus:ring-luxury-gold/20 focus:border-luxury-gold outline-none transition-all text-sm font-medium"
                  placeholder="name@restaurant.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-luxury-text-muted uppercase tracking-widest mb-2 ml-1">
                Security Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-luxury-text-muted group-focus-within:text-luxury-gold transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-white/50 border border-luxury-border rounded-2xl focus:ring-2 focus:ring-luxury-gold/20 focus:border-luxury-gold outline-none transition-all text-sm font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-4 bg-status-danger/10 border border-status-danger/20 rounded-xl text-status-danger text-xs font-bold"
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-luxury-gradient text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-gold hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest flex items-center justify-center gap-2">
              Already have an account? 
              <Link to="/login" className="text-luxury-gold hover:underline flex items-center gap-1">
                Sign In <ArrowRight size={10} />
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
