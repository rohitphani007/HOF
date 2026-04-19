import { lazy, Suspense, useState, useCallback, createContext, Component } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SplashScreen from './components/SplashScreen';
import ScrollRevealObserver from './components/ScrollRevealObserver';
import AuthScreen from './components/AuthScreen';
import { PortfolioProvider } from './context/PortfolioContext';

// ── Per-section error boundary so one broken page doesn't blank the whole app ──
class SectionBoundary extends Component<{label: string; children: ReactNode}, {err: boolean}> {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(e: Error) { console.error('[SectionBoundary]', e); }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--glass-border)', borderRadius: 16, margin: '1rem 0' }}>
          <p>⚠️ {this.props.label} failed to load.</p>
          <button onClick={() => this.setState({ err: false })} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const Web3Context = createContext<{
  walletAddress: string;
  ethBalance: string;
  setEthBalance: (b: string) => void;
}>({ walletAddress: '', ethBalance: '0', setEthBalance: () => {} });

const Dashboard   = lazy(() => import('./pages/Dashboard'));
const Market      = lazy(() => import('./pages/Market'));
const MarketPreview = lazy(() => import('./pages/MarketPreview'));
const AssetDetail = lazy(() => import('./pages/AssetDetail'));
const Portfolio   = lazy(() => import('./pages/Portfolio'));
const Derivatives = lazy(() => import('./pages/Derivatives'));
const DAO         = lazy(() => import('./pages/DAO'));

function StackedHome() {
  return (
    <div className="stacked-home" style={{ display: 'flex', flexDirection: 'column', gap: '15vh', paddingBottom: '10vh' }}>
      <section id="dashboard"   className="nav-section"><SectionBoundary label="Dashboard"><Dashboard /></SectionBoundary></section>
      <section id="market"      className="nav-section"><SectionBoundary label="Market"><MarketPreview /></SectionBoundary></section>
      <section id="portfolio"   className="nav-section"><SectionBoundary label="Portfolio"><Portfolio /></SectionBoundary></section>
      <section id="derivatives" className="nav-section"><SectionBoundary label="Derivatives"><Derivatives /></SectionBoundary></section>
      <section id="dao"         className="nav-section"><SectionBoundary label="Governance"><DAO /></SectionBoundary></section>
    </div>
  );
}

function App() {
  // Splash always plays on every page load (it's a loading screen, not a gate)
  const [showSplash, setShowSplash] = useState(true);
  const [splashDone, setSplashDone]     = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('propfi_auth'));
  const [walletAddress, setWalletAddress] = useState('');
  const [ethBalance, setEthBalance] = useState('0');

  const handleSplashDone = useCallback(() => {
    setShowSplash(false);
    setSplashDone(true);
  }, []);

  const handleLogin = (addr: string = '', bal: string = '0') => {
    setWalletAddress(addr);
    setEthBalance(bal);
    setIsAuthenticated(true);
    localStorage.setItem('propfi_auth', '1');
  };

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      {splashDone && !isAuthenticated && <AuthScreen onLogin={handleLogin} />}
      <PortfolioProvider>
        <Web3Context.Provider value={{ walletAddress, ethBalance, setEthBalance }}>
          <Router>
          <ScrollRevealObserver />
          <div className={`app-container ${showSplash ? 'splash-hidden' : 'app-visible'}`} style={{ display: (splashDone && isAuthenticated) ? 'block' : 'none' }}>
            <Sidebar />
            <main className="main-content">
              <Header />
              <div style={{ padding: '2rem' }}>
                <Suspense fallback={<div style={{color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center'}}>Initializing modules...</div>}>
                  <Routes>
                    <Route path="/"        element={<StackedHome />} />
                    <Route path="/market"  element={<Market />} />
                    <Route path="/asset/:id" element={<AssetDetail />} />
                  </Routes>
                </Suspense>
              </div>
            </main>
          </div>
        </Router>
        </Web3Context.Provider>
      </PortfolioProvider>
    </>
  );
}

export default App;
