import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Load mock data ─────────────────────────────────────────────────────────────
const properties = JSON.parse(readFileSync(join(__dirname, '_data/properties.json'), 'utf8'));
const transactions = JSON.parse(readFileSync(join(__dirname, '_data/transactions.json'), 'utf8'));
const aiResponses = JSON.parse(readFileSync(join(__dirname, '_data/ai-responses.json'), 'utf8'));

// ─── Utility helpers ────────────────────────────────────────────────────────────
export function randomFluctuation(base, pct = 0.003) {
  const delta = base * pct * (Math.random() * 2 - 1);
  return Math.round((base + delta) * 100) / 100;
}

export function shortHash() {
  return '0x' + [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function nowISO() {
  return new Date().toISOString();
}

// Apply random price jitter to simulate live data (since serverless is stateless)
export function getLiveProperties() {
  return properties.map(p => ({
    ...p,
    tokenPrice: randomFluctuation(p.tokenPrice),
  }));
}

// CORS helper
export function cors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

// Default portfolio state
export const portfolioTokens = {
  prop_001: 20,
  prop_002: 50,
  prop_003: 15,
};

export { properties, transactions, aiResponses };
