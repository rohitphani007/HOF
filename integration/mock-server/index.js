const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

// ─── Load mock data ────────────────────────────────────────────────────────────
const properties = require('./data/properties.json');
const transactions = require('./data/transactions.json');
const aiResponses = require('./data/ai-responses.json');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// Serve demo dashboard as static files
const dashboardPath = path.join(__dirname, '..', 'demo-dashboard');
app.use(express.static(dashboardPath));
app.get('/', (req, res) => res.sendFile(path.join(dashboardPath, 'index.html')));

// ─── In-memory demo state ──────────────────────────────────────────────────────
let liveProperties = JSON.parse(JSON.stringify(properties)); // deep copy
let liveTxFeed = [...transactions];
let portfolioTokens = {
  prop_001: 20,
  prop_002: 50,
  prop_003: 15,
};

// ─── Utility helpers ───────────────────────────────────────────────────────────
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

// ─── WebSocket: broadcast live price ticks ─────────────────────────────────────
function broadcastPriceTick() {
  const updates = liveProperties.map(p => {
    p.tokenPrice = randomFluctuation(p.tokenPrice);
    return { id: p.id, tokenPrice: p.tokenPrice, timestamp: nowISO() };
  });

  const msg = JSON.stringify({ type: 'PRICE_TICK', data: updates });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

// Broadcast random transaction to simulate live chain activity
function broadcastFakeTx() {
  const prop = liveProperties[Math.floor(Math.random() * liveProperties.length)];
  const type = Math.random() > 0.4 ? 'BUY' : 'SELL';
  const tokens = Math.floor(Math.random() * 30) + 1;
  const tx = {
    id: `tx_live_${Date.now()}`,
    type,
    propertyId: prop.id,
    propertyName: prop.name,
    walletAddress: shortHash(),
    shortAddress: shortHash().slice(0, 6) + '...' + shortHash().slice(-4),
    tokens,
    pricePerToken: prop.tokenPrice,
    totalAmount: tokens * prop.tokenPrice,
    txHash: shortHash(),
    blockNumber: 54231093 + Math.floor(Math.random() * 100),
    status: 'confirmed',
    timestamp: nowISO(),
    network: 'Polygon Mumbai',
  };

  liveTxFeed.unshift(tx);
  if (liveTxFeed.length > 50) liveTxFeed.pop();

  const msg = JSON.stringify({ type: 'NEW_TRANSACTION', data: tx });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

setInterval(broadcastPriceTick, 4000);   // price tick every 4s
setInterval(broadcastFakeTx, 7000);      // fake tx every 7s

wss.on('connection', ws => {
  console.log('[WS] Client connected');
  // Send current snapshot on connect
  ws.send(JSON.stringify({ type: 'INIT', data: { properties: liveProperties } }));
  ws.on('close', () => console.log('[WS] Client disconnected'));
});

// ═══════════════════════════════════════════════════════════════════════════════
//  REST ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: nowISO(),
    services: {
      blockchain: 'connected',
      aiEngine: 'running',
      rentalOracle: 'active',
      liquidityPool: 'live',
    },
    blockchainNetwork: 'Polygon Mumbai Testnet',
    blockNumber: 54231093 + Math.floor(Math.random() * 200),
    gasPrice: '32 gwei',
    tvl: '₹23,40,00,000',
    totalProperties: liveProperties.length,
    totalHolders: 694,
  });
});

// ── Properties ─────────────────────────────────────────────────────────────────
app.get('/api/properties', (req, res) => {
  const { city, minYield, maxRisk, type } = req.query;
  let result = liveProperties;
  if (city) result = result.filter(p => p.city.toLowerCase() === city.toLowerCase());
  if (minYield) result = result.filter(p => p.rentalYield >= parseFloat(minYield));
  if (maxRisk) result = result.filter(p => p.riskScore >= parseInt(maxRisk));
  if (type) result = result.filter(p => p.type.toLowerCase().includes(type.toLowerCase()));
  res.json(result);
});

app.get('/api/properties/:id', (req, res) => {
  const prop = liveProperties.find(p => p.id === req.params.id);
  if (!prop) return res.status(404).json({ error: 'Property not found' });
  res.json(prop);
});

// ── AI Pricing ─────────────────────────────────────────────────────────────────
app.get('/api/ai/price/:propertyId', (req, res) => {
  const ai = aiResponses[req.params.propertyId];
  if (!ai) return res.status(404).json({ error: 'No AI data for this property' });

  // Sync current price with live fluctuation
  const prop = liveProperties.find(p => p.id === req.params.propertyId);
  if (prop) ai.currentPrice = prop.tokenPrice;

  res.json({ ...ai, lastUpdated: nowISO() });
});

app.post('/api/ai/predict', (req, res) => {
  // Simulate AI model call - works even if Person 2's server is down
  const { area, bedrooms, distanceToMetro, age, floor, city } = req.body;

  // Simple formula simulating ML output
  const base = city === 'Mumbai' ? 1800 : city === 'Bengaluru' ? 900 : 1200;
  const bedroomFactor = (bedrooms || 2) * 150;
  const metroFactor = Math.max(0, 500 - (distanceToMetro || 1) * 200);
  const agePenalty = (age || 5) * 10;
  const floorBonus = (floor || 5) * 8;

  const predictedPrice = Math.round(base + bedroomFactor + metroFactor - agePenalty + floorBonus);
  const confidence = 0.80 + Math.random() * 0.15;

  res.json({
    predictedPrice,
    confidence: Math.round(confidence * 100) / 100,
    predictedPrice6M: Math.round(predictedPrice * 1.08),
    predictedGrowth: 8.0 + Math.random() * 4,
    riskScore: Math.floor(70 + Math.random() * 25),
    modelUsed: 'XGBoost v2.1 + Location Embeddings',
    lastTrained: '2026-04-15',
    dataPoints: 14823,
  });
});

// ── Blockchain / Transactions ──────────────────────────────────────────────────
app.get('/api/blockchain/transactions', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json(liveTxFeed.slice(0, limit));
});

app.post('/api/blockchain/buy', (req, res) => {
  const { propertyId, tokens, walletAddress } = req.body;
  const prop = liveProperties.find(p => p.id === propertyId);

  if (!prop) return res.status(404).json({ error: 'Property not found' });
  if (tokens > prop.availableTokens) {
    return res.status(400).json({ error: 'Not enough tokens available' });
  }

  // Simulate 1-2 second blockchain confirmation
  const totalPaid = tokens * prop.tokenPrice;
  const tx = {
    id: `tx_${Date.now()}`,
    type: 'BUY',
    propertyId,
    propertyName: prop.name,
    walletAddress: walletAddress || '0xDemoWallet',
    shortAddress: (walletAddress || '0xDemoWallet').slice(0, 6) + '...' + (walletAddress || '0xDemoWallet').slice(-4),
    tokens,
    pricePerToken: prop.tokenPrice,
    totalAmount: totalPaid,
    gasFee: Math.round(Math.random() * 15 + 5),
    txHash: shortHash(),
    blockNumber: 54231093 + Math.floor(Math.random() * 100),
    status: 'confirmed',
    timestamp: nowISO(),
    network: 'Polygon Mumbai',
  };

  // Update available tokens
  prop.availableTokens -= tokens;
  prop.tokenHolders += 1;

  // Update portfolio
  portfolioTokens[propertyId] = (portfolioTokens[propertyId] || 0) + tokens;

  liveTxFeed.unshift(tx);

  // Broadcast to WS clients
  const msg = JSON.stringify({ type: 'NEW_TRANSACTION', data: tx });
  wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); });

  res.json(tx);
});

app.post('/api/blockchain/sell', (req, res) => {
  const { propertyId, tokens, walletAddress } = req.body;
  const prop = liveProperties.find(p => p.id === propertyId);
  if (!prop) return res.status(404).json({ error: 'Property not found' });

  const totalReceived = tokens * prop.tokenPrice * 0.999; // 0.1% AMM fee
  const tx = {
    id: `tx_${Date.now()}`,
    type: 'SELL',
    propertyId,
    propertyName: prop.name,
    walletAddress: walletAddress || '0xDemoWallet',
    shortAddress: (walletAddress || '0xDemoWallet').slice(0, 6) + '...' + (walletAddress || '0xDemoWallet').slice(-4),
    tokens,
    pricePerToken: prop.tokenPrice,
    totalAmount: Math.round(totalReceived),
    gasFee: Math.round(Math.random() * 15 + 5),
    txHash: shortHash(),
    blockNumber: 54231093 + Math.floor(Math.random() * 100),
    status: 'confirmed',
    timestamp: nowISO(),
    network: 'Polygon Mumbai',
  };

  prop.availableTokens = Math.min(prop.totalTokens, prop.availableTokens + tokens);
  liveTxFeed.unshift(tx);
  res.json(tx);
});

// ── Rental Distribution ────────────────────────────────────────────────────────
app.get('/api/rental/distribution/:propertyId', (req, res) => {
  const prop = liveProperties.find(p => p.id === req.params.propertyId);
  if (!prop) return res.status(404).json({ error: 'Property not found' });

  const tokensOwned = portfolioTokens[req.params.propertyId] || 0;
  const sharePercent = tokensOwned / prop.totalTokens;
  const yourShare = Math.round(prop.monthlyRent * sharePercent * 100) / 100;

  res.json({
    propertyId: prop.id,
    propertyName: prop.name,
    lastDistribution: '2026-04-01T00:00:00Z',
    nextDistribution: '2026-05-01T00:00:00Z',
    daysUntilNext: 13,
    totalRentCollected: prop.monthlyRent,
    tokensOwned,
    sharePercent: Math.round(sharePercent * 10000) / 100,
    yourShare,
    distributionTx: shortHash(),
    allHolders: prop.tokenHolders,
    ytdEarnings: Math.round(yourShare * 4),
    currency: 'INR',
  });
});

app.get('/api/rental/portfolio', (req, res) => {
  const holdings = Object.entries(portfolioTokens).map(([propId, tokens]) => {
    const prop = liveProperties.find(p => p.id === propId);
    if (!prop) return null;
    const sharePercent = tokens / prop.totalTokens;
    return {
      propertyId: propId,
      propertyName: prop.name,
      tokens,
      tokenValue: Math.round(tokens * prop.tokenPrice),
      monthlyRental: Math.round(prop.monthlyRent * sharePercent),
      rentalYield: prop.rentalYield,
    };
  }).filter(Boolean);

  const totalValue = holdings.reduce((s, h) => s + h.tokenValue, 0);
  const totalMonthlyRental = holdings.reduce((s, h) => s + h.monthlyRental, 0);

  res.json({
    holdings,
    totalValue,
    totalMonthlyRental,
    totalAnnualRental: totalMonthlyRental * 12,
    averageYield: Math.round(holdings.reduce((s, h) => s + h.rentalYield, 0) / holdings.length * 10) / 10,
    walletAddress: '0x742d35Cc6634C0532925a3b8D4C9b8B8F7e2c3A1',
  });
});

// ── Liquidity Pool (AMM) ───────────────────────────────────────────────────────
app.get('/api/amm/pool/:propertyId', (req, res) => {
  const prop = liveProperties.find(p => p.id === req.params.propertyId);
  if (!prop) return res.status(404).json({ error: 'Property not found' });

  const liquidity = prop.totalValue * 0.15;
  res.json({
    propertyId: prop.id,
    tokenPrice: prop.tokenPrice,
    liquidityINR: Math.round(liquidity),
    volume24h: Math.round(liquidity * 0.08),
    fee: 0.003,
    priceImpact1Token: 0.02,
    priceImpact100Tokens: 1.8,
    availableTokens: prop.availableTokens,
    totalLiquidity: prop.totalTokens - prop.availableTokens,
  });
});

// ── ZK Proofs (simulated) ──────────────────────────────────────────────────────
app.post('/api/zk/generate-proof', (req, res) => {
  const { proofType, threshold } = req.body;
  setTimeout(() => {
    res.json({
      proofType: proofType || 'INCOME_ABOVE_THRESHOLD',
      verified: true,
      proof: '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      publicInputs: { threshold: threshold || 10000, currency: 'INR' },
      verificationKey: '0x' + [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      generatedAt: nowISO(),
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      message: `Proof verified: Monthly rental income exceeds ₹${(threshold || 10000).toLocaleString('en-IN')} without revealing exact amount or property location`,
    });
  }, 1200); // simulate ZK proof generation delay
});

// ── Derivatives / Futures ──────────────────────────────────────────────────────
app.get('/api/derivatives/futures', (req, res) => {
  res.json([
    {
      id: 'fut_mum_q2',
      name: 'Mumbai Real Estate Index - Q2 2026',
      currentPrice: 48500,
      strikePrice: 47000,
      expiry: '2026-06-30',
      type: 'CALL',
      premium: 1200,
      openInterest: 2847,
      volume24h: 412,
      impliedVolatility: 18.4,
      delta: 0.62,
    },
    {
      id: 'fut_blr_q2',
      name: 'Bengaluru Tech Corridor Index - Q2 2026',
      currentPrice: 32100,
      strikePrice: 30000,
      expiry: '2026-06-30',
      type: 'CALL',
      premium: 980,
      openInterest: 1923,
      volume24h: 289,
      impliedVolatility: 22.1,
      delta: 0.71,
    },
    {
      id: 'fut_del_q2',
      name: 'Delhi NCR Commercial Index - Q2 2026',
      currentPrice: 61200,
      strikePrice: 63000,
      expiry: '2026-06-30',
      type: 'PUT',
      premium: 850,
      openInterest: 1104,
      volume24h: 176,
      impliedVolatility: 15.8,
      delta: -0.38,
    },
  ]);
});

// ── DAO / Governance ───────────────────────────────────────────────────────────
app.get('/api/dao/proposals', (req, res) => {
  res.json([
    {
      id: 'dao_001',
      propertyId: 'prop_001',
      title: 'Lobby Renovation - Bandra Apartment',
      description: 'Proposal to renovate the main lobby with marble flooring and modern lighting. Estimated cost: ₹8,00,000. Expected rental increase: 5%.',
      status: 'ACTIVE',
      votesFor: 6842,
      votesAgainst: 1230,
      totalVotes: 8072,
      quorum: 5000,
      deadline: '2026-04-25T23:59:59Z',
      cost: 800000,
      expectedRentalIncrease: 5,
    },
    {
      id: 'dao_002',
      propertyId: 'prop_003',
      title: 'Lease Renewal Terms - DLF Office',
      description: 'Approve new lease terms for anchor tenant TechCorp India Pvt Ltd. 3-year lock-in at ₹4,10,000/month (6.5% increase).',
      status: 'PASSED',
      votesFor: 8940,
      votesAgainst: 210,
      totalVotes: 9150,
      quorum: 5000,
      deadline: '2026-04-10T23:59:59Z',
      newMonthlyRent: 410000,
    },
  ]);
});

// ─── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 PropFi Mock Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket live feed on ws://localhost:${PORT}`);
  console.log('\n📡 Available endpoints:');
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/properties`);
  console.log(`   GET  /api/properties/:id`);
  console.log(`   GET  /api/ai/price/:propertyId`);
  console.log(`   POST /api/ai/predict`);
  console.log(`   GET  /api/blockchain/transactions`);
  console.log(`   POST /api/blockchain/buy`);
  console.log(`   POST /api/blockchain/sell`);
  console.log(`   GET  /api/rental/distribution/:propertyId`);
  console.log(`   GET  /api/rental/portfolio`);
  console.log(`   GET  /api/amm/pool/:propertyId`);
  console.log(`   POST /api/zk/generate-proof`);
  console.log(`   GET  /api/derivatives/futures`);
  console.log(`   GET  /api/dao/proposals`);
  console.log('\n✅ Mock data loaded. Demo is ready!\n');
});
