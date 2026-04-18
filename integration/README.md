# 🏛️ PropFi — Integration Layer

> **Person 4 (Integration Lead)** owns this folder. Read this if you're Person 1, 2, or 3.

---

## 📂 Structure

```
integration/
├── mock-server/          ← Node.js API + WebSocket server (YOU ARE HERE)
│   ├── index.js          ← Main server (REST + WS)
│   ├── package.json
│   └── data/
│       ├── properties.json     ← 6 sample Indian properties
│       ├── transactions.json   ← Sample blockchain transactions
│       └── ai-responses.json   ← Pre-computed AI pricing
├── demo-dashboard/       ← Standalone HTML demo (opens in browser)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── api-client.js         ← Drop-in JS client for Person 3's React app
└── README.md             ← This file
```

---

## 🚀 Starting the Mock Server

```bash
cd integration/mock-server
npm install       # first time only
node index.js
```

Server starts at: **http://localhost:3001**
Demo dashboard at: **http://localhost:3001** (same URL, auto-serves HTML)

---

## 📡 All API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | System status, block number, TVL |
| GET | `/api/properties` | All properties (filter: `?city=Mumbai&minYield=6`) |
| GET | `/api/properties/:id` | Single property |
| GET | `/api/ai/price/:propertyId` | AI valuation + factors |
| POST | `/api/ai/predict` | Predict price for custom property |
| GET | `/api/blockchain/transactions` | Recent txns (filter: `?limit=10`) |
| POST | `/api/blockchain/buy` | Buy tokens (updates available supply) |
| POST | `/api/blockchain/sell` | Sell tokens |
| GET | `/api/rental/distribution/:id` | Rental income for a property |
| GET | `/api/rental/portfolio` | Full portfolio summary |
| GET | `/api/amm/pool/:propertyId` | Liquidity pool info |
| POST | `/api/zk/generate-proof` | Generate ZK-SNARK proof |
| GET | `/api/derivatives/futures` | Futures contracts |
| GET | `/api/dao/proposals` | DAO governance proposals |

**WebSocket** at `ws://localhost:3001` — sends:
- `INIT` — on connect, sends all properties
- `PRICE_TICK` — every 4 seconds with price updates
- `NEW_TRANSACTION` — every 7 seconds with simulated on-chain tx

---

## 👨‍💻 Person 3 (Frontend) — How to Integrate

### Option A: Use the api-client.js

Copy `integration/api-client.js` into your React `src/` folder.

```jsx
import PropFiAPI from './api-client';

// In a component:
useEffect(() => {
  PropFiAPI.getProperties().then(setProperties);

  // Live prices via WebSocket
  const ws = PropFiAPI.connectLiveFeed({
    onPriceTick: (updates) => { /* update state */ },
    onNewTx: (tx) => { /* prepend to tx feed */ },
  });
  return () => ws.close();
}, []);
```

### Option B: Direct fetch

```js
const properties = await fetch('http://localhost:3001/api/properties').then(r => r.json());
```

### Buy Tokens Example

```js
const tx = await PropFiAPI.buyTokens({
  propertyId: 'prop_001',
  tokens: 10,
  walletAddress: '0xYourWalletAddress',
});
console.log(tx.txHash); // confirmed transaction hash
```

---

## 🤖 Person 2 (AI/ML) — How to Connect Your Model

Your Flask API runs on `localhost:5000`. The mock server **falls back** to our pre-computed `ai-responses.json` if Flask is unavailable.

To make the mock server call your real model instead, update `mock-server/index.js`:

```js
// In GET /api/ai/price/:propertyId
// Replace the mock response with:
const res = await fetch(`http://localhost:5000/api/predict-price`, { ... });
```

Your API should return this shape:
```json
{
  "currentPrice": 2500,
  "predictedPrice6M": 2708,
  "predictedGrowth": 8.3,
  "confidence": 0.87,
  "riskScore": 82
}
```

---

## ⛓ Person 1 (Blockchain) — How to Connect Contracts

When your Hardhat node is running on `localhost:8545`, update `mock-server/index.js`:

```js
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('http://localhost:8545');
const contractABI = require('../../web3/contracts/PropertyToken.json');
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
```

Then replace the mock `POST /api/blockchain/buy` handler with real contract calls.

---

## 🛡 Fallback Strategy

The mock server **always works** — even if:
- Person 1's Hardhat node is offline → mock returns fake tx hashes
- Person 2's Flask API crashes → mock returns pre-computed AI responses
- Network is down → mock serves from local JSON files

**The demo will NOT break.** This is by design.

---

## 🎬 Demo Flow (5 minutes)

1. **Open** http://localhost:3001
2. **Show** live property cards with AI predictions and real-time prices
3. **Click** Invest on Bandra West → fill tokens → "Connect & Buy" → show tx confirmation
4. **Scroll** to portfolio panel → show rental earnings
5. **Show** ZK Proof → Generate → "Proof Verified!"
6. **Show** DAO vote → cast vote → "✅ Vote Cast!"
7. **Highlight** Live Transactions feed scrolling automatically

---

## ❓ Quick Troubleshoot

| Problem | Fix |
|---------|-----|
| `EADDRINUSE 3001` | Another process using port. Run: `npx kill-port 3001` |
| Properties not loading | Check server is running at localhost:3001 |
| CORS error in React | Already handled — server sends `Access-Control-Allow-Origin: *` |
| WebSocket not connecting | Check WS_URL in app.js matches server port |
