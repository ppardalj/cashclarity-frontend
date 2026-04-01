import { useMemo, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useFinanceStore } from './store/useFinanceStore';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { BankStatement } from './components/BankStatement';
import { Spaces } from './components/Spaces';
import { Entities } from './components/Entities';
import { Journal } from './components/Journal';
import { ChartOfAccounts } from './components/ChartOfAccounts';
import { Login } from './components/Login';
import { JournalEntry } from './types';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const { accounts, journalEntries, fetchData, isLoading, error } = useFinanceStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session, fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Derived treasury metrics
  const treasuryMetrics = useMemo(() => {
    const accountBalances: Record<string, number> = {};
    accounts.forEach(a => accountBalances[a.id] = 0);

    journalEntries.forEach((entry: JournalEntry) => {
      entry.lines.forEach(line => {
        if (accountBalances[line.accountId] !== undefined) {
          accountBalances[line.accountId] += (line.debit - line.credit);
        }
      });
    });

    const mainAccount = accounts.find(a => a.type === 'main');
    const spaceAccounts = accounts.filter(a => a.type === 'space');
    
    const totalCommitted = spaceAccounts
      .reduce((sum, a) => sum + accountBalances[a.id], 0);

    const mainBalance = mainAccount ? accountBalances[mainAccount.id] : 0;
    const realBankBalance = mainBalance + totalCommitted;
    const availableCash = mainBalance;

    return {
      realBankBalance,
      totalCommitted,
      availableCash,
      bucketBalances: accountBalances
    };
  }, [accounts, journalEntries]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange mx-auto"></div>
          <p className="mt-4 text-text-secondary font-mono text-xs uppercase tracking-widest">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white shadow-lg rounded-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error de conexión</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => fetchData()}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard metrics={treasuryMetrics} />} />
          <Route path="/bank" element={<BankStatement />} />
          <Route path="/spaces" element={<Spaces bucketBalances={treasuryMetrics.bucketBalances} />} />
          <Route path="/entities" element={<Entities />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/coa" element={<ChartOfAccounts />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
