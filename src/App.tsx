import { useMemo, useState } from 'react';
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

const HARDCODED_EMAIL = 'pedro.pardal@exeal.com';
const HARDCODED_PASS = 'prueba';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('autonomo_auth') === 'true';
  });

  const { accounts, journalEntries } = useFinanceStore();

  const handleLogin = (email: string, pass: string) => {
    if (email === HARDCODED_EMAIL && pass === HARDCODED_PASS) {
      setIsAuthenticated(true);
      localStorage.setItem('autonomo_auth', 'true');
    } else {
      alert('Credenciales incorrectas');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('autonomo_auth');
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

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
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
