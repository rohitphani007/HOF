const path = require('path');

// ─── Load mock data ─────────────────────────────────────────────────────────────
const properties = require('./_data/properties.json');
const transactions = require('./_data/transactions.json');
const aiResponses = require('./_data/ai-responses.json');

// ─── Utility helpers ────────────────────────────────────────────────────────────
function randomFluctuation(base, pct = 0.003) {
  const delta = base * pct * (Math.random() * 2 - 1);
  return Math.round((base + delta) * 100) / 100;
}

function shortHash() {
  return '0x' + [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

function nowISO() {
  return new Date().toISOString();
}

// Apply random price jitter to simulate live data (since serverless is stateless)
function getLiveProperties() {
  return properties.map(p => ({
    ...p,
    tokenPrice: randomFluctuation(p.tokenPrice),
  }));
}

// CORS helper
function cors(req, res) {
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
const portfolioTokens = {
  prop_001: 20,
  prop_002: 50,
  prop_003: 15,
};

module.exports = {
  properties,
  transactions,
  aiResponses,
  portfolioTokens,
  randomFluctuation,
  shortHash,
  nowISO,
  getLiveProperties,
  cors,
};
