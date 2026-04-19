import { useState } from 'react';
import { ShieldCheck, Fingerprint, Mail, Key } from 'lucide-react';
import { BrowserProvider, formatEther } from 'ethers';
import './AuthScreen.css';

export default function AuthScreen({ onLogin }: { onLogin: (addr?: string, bal?: string) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate real auth handshake delay
    setTimeout(() => {
      setLoading(false);
      // Derive display name from email (e.g. john.doe@example.com → John Doe)
      const namePart = email.split('@')[0].replace(/[._-]/g, ' ');
      const displayName = namePart.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      localStorage.setItem('propfi_user_name', displayName);
      localStorage.setItem('propfi_user_email', email);
      onLogin();
    }, 1200);
  };

  return (
    <div className="auth-overlay">
      <div className="auth-container card animate-fade-up">
        
        <div className="auth-branding">
          <div className="logo-glitch">
            <ShieldCheck size={36} color="var(--accent-primary)" />
          </div>
          <h2>{isLogin ? 'Secure Sign In' : 'Create Account'}</h2>
          <p className="text-muted">
            {isLogin 
              ? 'Access your PropFi institutional grade dashboard.' 
              : 'Join the next generation of real estate digitization.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-wrapper-field">
            <Mail className="field-icon" size={18} />
            <input 
              type="email" 
              placeholder="Email address" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="input-wrapper-field">
            <Key className="field-icon" size={18} />
            <input 
              type="password" 
              placeholder="Secure Password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {isLogin && <a href="#" className="forgot-link">Forgot password?</a>}

          <button type="submit" className="btn btn-primary btn-auth" disabled={loading || !email || !password}>
            {loading ? <span className="cyber-loader-mini"></span> : isLogin ? 'Sign In Securely' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR CONTINUE WITH WEB3</span>
        </div>

        <button className="btn btn-secondary btn-web3" onClick={handleWeb3Login} disabled={loading}>
            {loading ? <span className="cyber-loader-mini"></span> : <><Fingerprint size={18} /> Connect MetaMask</>}
        </button>

        <div className="auth-footer">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <span onClick={() => setIsLogin(!isLogin)} className="text-primary" style={{cursor: 'pointer', fontWeight: 600}}>
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </div>
      </div>
      
      <div className="auth-background">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
      </div>
    </div>
  );

  async function handleWeb3Login() {
    setLoading(true);
    try {
      // @ts-ignore
      if (typeof window.ethereum !== 'undefined') {
        // @ts-ignore
        const provider = new BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const balance = await provider.getBalance(address);
        const ethBal = formatEther(balance);
        
        onLogin(address, ethBal);
      } else {
        alert("MetaMask is not installed. Please install it to connect.");
        setLoading(false);
      }
    } catch (e) {
      console.error("User rejected request or error occurred", e);
      setLoading(false);
    }
  }
}
