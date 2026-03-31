import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, pass: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, rellena todos los campos');
      return;
    }
    onLogin(email, password);
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-primary-orange bg-primary-orange/10 p-3 rounded-sm border border-primary-orange/20 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{error}</span>
              </div>
            )}

            <button 
              type="submit"
              className="mt-2 bg-primary-orange text-background py-3 text-xs font-bold uppercase tracking-[0.2em] rounded-sm hover:bg-primary-orange/90 transition-all shadow-lg active:scale-[0.98]"
            >
              Acceder al Sistema
            </button>
          </form>
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
