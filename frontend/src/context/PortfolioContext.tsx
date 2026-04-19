import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { BrowserProvider, formatEther } from 'ethers';

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  fractions: number;
  avgPrice: number;
  currentPrice: number;
  image: string;
  purchasedAt: string;
}

export interface BankEntry {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  amount: number;
  txHash?: string;
  timestamp: string;
  status: 'CONFIRMED' | 'PENDING';
}

interface PortfolioCtx {
  holdings: Holding[];
  bankStatement: BankEntry[];
  maticBalance: string;
  walletAddress: string;
  refreshBalance: () => void;
  addPurchase: (h: Holding, cost: number, txHash: string) => void;
  addFunds: (amount: number, txHash?: string) => void;
}

const PortfolioContext = createContext<PortfolioCtx>({
  holdings: [],
  bankStatement: [],
  maticBalance: '0',
  walletAddress: '',
  refreshBalance: () => {},
  addPurchase: () => {},
  addFunds: () => {},
});

const STORAGE_KEY = 'propfi_v2_portfolio';

function loadFromStorage(): { holdings: Holding[]; bankStatement: BankEntry[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { holdings: [], bankStatement: [] };
}

function saveToStorage(data: { holdings: Holding[]; bankStatement: BankEntry[] }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const stored = loadFromStorage();
  const [holdings, setHoldings] = useState<Holding[]>(stored.holdings);
  const [bankStatement, setBankStatement] = useState<BankEntry[]>(stored.bankStatement);
  const [maticBalance, setMaticBalance] = useState('0');
  const [walletAddress, setWalletAddress] = useState('');

  // Persist whenever state changes
  useEffect(() => {
    saveToStorage({ holdings, bankStatement });
  }, [holdings, bankStatement]);

  // Pull live balance from MetaMask if connected
  const refreshBalance = async () => {
    try {
      if (typeof window.ethereum === 'undefined') return;
      // @ts-ignore
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length === 0) return;
      const addr = await accounts[0].getAddress();
      setWalletAddress(addr);
      const bal = await provider.getBalance(addr);
      setMaticBalance(Number(formatEther(bal)).toFixed(4));
    } catch (e) {
      console.warn('Balance refresh failed', e);
    }
  };

  useEffect(() => {
    refreshBalance();
    // Refresh every 15 seconds for live updates
    const interval = setInterval(refreshBalance, 15000);
    return () => clearInterval(interval);
  }, []);

  const addPurchase = (h: Holding, cost: number, txHash: string) => {
    setHoldings(prev => {
      const existing = prev.find(x => x.id === h.id);
      if (existing) {
        // Average down / up — update fractions and avg price
        const totalFractions = existing.fractions + h.fractions;
        const newAvg = (existing.avgPrice * existing.fractions + h.avgPrice * h.fractions) / totalFractions;
        return prev.map(x => x.id === h.id ? { ...x, fractions: totalFractions, avgPrice: Math.round(newAvg) } : x);
      }
      return [...prev, h];
    });

    const entry: BankEntry = {
      id: Date.now().toString(),
      type: 'DEBIT',
      description: `Bought ${h.fractions} tokens of ${h.name}`,
      amount: cost,
      txHash,
      timestamp: new Date().toISOString(),
      status: 'CONFIRMED',
    };
    setBankStatement(prev => [entry, ...prev]);
    refreshBalance();
  };

  const addFunds = (amount: number, txHash?: string) => {
    const entry: BankEntry = {
      id: Date.now().toString(),
      type: 'CREDIT',
      description: 'Funds added via MetaMask / UPI',
      amount,
      txHash,
      timestamp: new Date().toISOString(),
      status: 'CONFIRMED',
    };
    setBankStatement(prev => [entry, ...prev]);
    refreshBalance();
  };

  return (
    <PortfolioContext.Provider value={{ holdings, bankStatement, maticBalance, walletAddress, refreshBalance, addPurchase, addFunds }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export const usePortfolio = () => useContext(PortfolioContext);
