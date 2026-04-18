import { lazy, Suspense, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SplashScreen from './components/SplashScreen';
import CursorGlow from './components/CursorGlow';
import ScrollRevealObserver from './components/ScrollRevealObserver';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Market = lazy(() => import('./pages/Market'));
const AssetDetail = lazy(() => import('./pages/AssetDetail'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Derivatives = lazy(() => import('./pages/Derivatives'));
const DAO = lazy(() => import('./pages/DAO'));

function StackedHome() {
  return (
    <div className="stacked-home" style={{ display: 'flex', flexDirection: 'column', gap: '15vh', paddingBottom: '10vh' }}>
      <section id="dashboard" className="nav-section"><Dashboard /></section>
      <section id="market" className="nav-section"><Market /></section>
      <section id="portfolio" className="nav-section"><Portfolio /></section>
      <section id="derivatives" className="nav-section"><Derivatives /></section>
      <section id="dao" className="nav-section"><DAO /></section>
    </div>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashDone = useCallback(() => setShowSplash(false), []);

  return (
    <>
      <CursorGlow />
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      <Router>
        <ScrollRevealObserver />
        <div className={`app-container ${showSplash ? 'splash-hidden' : 'app-visible'}`}>
          <div className="sidebar-overlay" onClick={() => document.body.classList.remove('sidebar-open')}></div>
          {/* Neon background grid */}
          <svg className="neon-grid" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            {Array.from({length: 12}).map((_,i) => (
              <line key={`h${i}`} x1="0" y1={i*80} x2="1440" y2={i*80} stroke="rgba(59,130,246,0.04)" strokeWidth="1"/>
            ))}
            {Array.from({length: 20}).map((_,i) => (
              <line key={`v${i}`} x1={i*80} y1="0" x2={i*80} y2="900" stroke="rgba(0,255,163,0.03)" strokeWidth="1"/>
            ))}
          </svg>
          <Sidebar />
          <main className="main-content">
            <Header />
            <div style={{ padding: '2rem' }}>
              <Suspense fallback={<div style={{color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center'}}>Initializing modules...</div>}>
                <Routes>
                  <Route path="/" element={<StackedHome />} />
                  <Route path="/asset/:id" element={<AssetDetail />} />
                </Routes>
              </Suspense>
            </div>
          </main>
        </div>
      </Router>
    </>
  );
}

export default App;
