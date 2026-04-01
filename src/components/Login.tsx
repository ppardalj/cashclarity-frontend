import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, AlertCircle, UserPlus, LogIn } from 'lucide-react';
import { supabase } from '../supabaseClient';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccessMsg('¡Registro con éxito! Por favor verifica tu email.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-6 mb-12">
          <div className="w-16 h-16 bg-surface border border-border rounded-2xl flex items-center justify-center shadow-xl">
            <ShieldCheck className="w-10 h-10 text-primary-orange" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tighter uppercase font-mono mb-2">CashClarity</h1>
          </div>
        </div>

        <div className="bg-surface border border-border p-8 rounded-sm shadow-2xl">
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-text-secondary">Email de Usuario</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  className="w-full bg-background border border-border pl-10 pr-4 py-2.5 text-sm rounded-sm focus:ring-1 focus:ring-primary-orange outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-text-secondary">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background border border-border pl-10 pr-4 py-2.5 text-sm rounded-sm focus:ring-1 focus:ring-primary-orange outline-none transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-primary-orange bg-primary-orange/10 p-3 rounded-sm border border-primary-orange/20 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 text-primary-green bg-primary-green/10 p-3 rounded-sm border border-primary-green/20 animate-in fade-in slide-in-from-top-1">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{successMsg}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="mt-2 bg-primary-orange text-background py-3 text-xs font-bold uppercase tracking-[0.2em] rounded-sm hover:bg-primary-orange/90 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
              ) : isRegistering ? (
                <>
                  <UserPlus className="w-4 h-4" /> Registrarse
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Acceder al Sistema
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border flex justify-center">
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setSuccessMsg('');
              }}
              className="text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-primary-orange transition-colors"
            >
              {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[9px] font-mono text-text-secondary uppercase tracking-widest opacity-40">
            Acceso Restringido // Terminal de Control Financiero
          </p>
        </div>
      </div>
    </div>
  );
}
