import {
  properties, transactions, aiResponses, portfolioTokens,
  randomFluctuation, shortHash, nowISO, getLiveProperties, cors
} from './_shared.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const url = req.url.split('?')[0]; // e.g. /api/health
  const method = req.method;

  try {
    // ── Health check ───────────────────────────────────────────────────────────────
    if (url === '/api/health' && method === 'GET') {
      return res.json({
        status: 'ok',
        timestamp: nowISO(),
        services: { blockchain: 'connected', aiEngine: 'running', rentalOracle: 'active', liquidityPool: 'live' },
        blockchainNetwork: 'Polygon Mumbai Testnet',
        blockNumber: 54231093 + Math.floor(Math.random() * 200),
        gasPrice: '32 gwei',
        tvl: '₹23,40,00,000',
        totalProperties: properties.length,
        totalHolders: 694,
      });
    }

    // ── City list ───────────────────────────────────────────────────────────────────
    if (url === '/api/cities' && method === 'GET') {
      const cityMap = {};
      properties.forEach(p => {
        if (!cityMap[p.city]) cityMap[p.city] = { city: p.city, state: p.state, count: 0 };
        cityMap[p.city].count++;
      });
      return res.json(Object.values(cityMap).sort((a, b) => b.count - a.count));
    }

    // ── Properties ─────────────────────────────────────────────────────────────────
    if (url === '/api/properties' && method === 'GET') {
      const { city, minYield, maxRisk, type, search, sort, page, limit } = req.query || {};
      let result = getLiveProperties();

      if (city && city !== 'All Cities') result = result.filter(p => p.city.toLowerCase() === city.toLowerCase());
      if (minYield) result = result.filter(p => (p.rentalYield || 0) >= parseFloat(minYield));
      if (maxRisk) result = result.filter(p => p.riskScore >= parseInt(maxRisk));
      if (type) result = result.filter(p => p.type?.toLowerCase().includes(type.toLowerCase()));
      if (search) {
        const q = search.toLowerCase();
        result = result.filter(p => p.name?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q) || p.state?.toLowerCase().includes(q) || p.type?.toLowerCase().includes(q) || p.area?.toLowerCase().includes(q));
      }

      if (sort === 'price_asc') result.sort((a, b) => (a.tokenPrice || 0) - (b.tokenPrice || 0));
      else if (sort === 'price_desc') result.sort((a, b) => (b.tokenPrice || 0) - (a.tokenPrice || 0));
      else if (sort === 'yield') result.sort((a, b) => ((b.appreciationYield || b.rentalYield || 0) - (a.appreciationYield || a.rentalYield || 0)));
      else if (sort === 'rent') result.sort((a, b) => ((b.monthlyRent || b.leaseIncome || 0) - (a.monthlyRent || a.leaseIncome || 0)));
      else if (sort === 'risk') result.sort((a, b) => b.riskScore - a.riskScore);

      const totalCount = result.length;
      const pageNum = Math.max(1, parseInt(page) || 1);
      const pageSize = Math.min(500, Math.max(1, parseInt(limit) || 200));
      const skip = (pageNum - 1) * pageSize;
      const paginated = result.slice(skip, skip + pageSize);

      return res.json({
        data: paginated, total: totalCount, page: pageNum, limit: pageSize,
        totalPages: Math.ceil(totalCount / pageSize), hasMore: skip + paginated.length < totalCount,
      });
    }

    if (url.startsWith('/api/properties/') && method === 'GET') {
      const id = url.split('/').pop();
      const prop = getLiveProperties().find(p => p.id === id);
      if (!prop) return res.status(404).json({ error: 'Property not found' });
      return res.json(prop);
    }

    // ── AI Pricing ─────────────────────────────────────────────────────────────────
    if (url.startsWith('/api/ai/price/') && method === 'GET') {
      const propertyId = url.split('/').pop();
      const prop = properties.find(p => p.id === propertyId);
      if (!prop) return res.status(404).json({ error: 'Property not found' });

      const ai = aiResponses[propertyId];
      if (ai) return res.json({ ...ai, lastUpdated: nowISO() });

      return res.json({
        currentPrice: prop.tokenPrice,
        predictedPrice6M: Math.round(prop.tokenPrice * 1.08),
        predictedGrowth: 8.0 + Math.random() * 4,
        confidence: 0.85 + Math.random() * 0.10,
        riskScore: Math.floor(70 + Math.random() * 25),
        factors: { mlSummary: { impact: 5.0, label: `Strong growth potential in ${prop.city}`, positive: true } },
        lastUpdated: nowISO(),
      });
    }

    if (url === '/api/ai/predict' && method === 'POST') {
      const { area, bedrooms, distanceToMetro, age, floor, city } = req.body || {};
      const cityStr = (city || "").toLowerCase();
      let baseSqftRate = 10000;

      if (cityStr.includes('mumbai')) baseSqftRate = 35000;
      else if (cityStr.includes('bengaluru')) baseSqftRate = 14000;
      else if (cityStr.includes('delhi')) baseSqftRate = 22000;

      const bedCount = bedrooms || 2;
      const sqftArea = (!area || isNaN(Number(area))) ? (bedCount * 900) : Number(area);
      const finalRate = baseSqftRate * (1 + ((distanceToMetro || 1) <= 1.5 ? 0.05 : 0) - ((age || 5) * 0.005));
      const predictedPrice = Math.round(sqftArea * finalRate);

      return res.json({
        predictedPrice, confidence: Math.round((0.85 + Math.random() * 0.10) * 100) / 100,
        predictedPrice6M: Math.round(predictedPrice * 1.08), predictedGrowth: 8.0 + Math.random() * 4,
        riskScore: Math.floor(70 + Math.random() * 25), modelUsed: 'XGBoost v2.1', lastTrained: '2026-04-18', dataPoints: 24823,
      });
    }

    // ── Blockchain / Transactions ──────────────────────────────────────────────────
    if (url === '/api/blockchain/transactions' && method === 'GET') {
      const limit = parseInt(req.query?.limit) || 10;
      const liveTx = [];
      for (let i = 0; i < Math.min(3, limit); i++) {
        const prop = properties[Math.floor(Math.random() * properties.length)];
        const tokens = Math.floor(Math.random() * 30) + 1;
        liveTx.push({
          id: `tx_live_${Date.now()}_${i}`, type: Math.random() > 0.4 ? 'BUY' : 'SELL',
          propertyId: prop.id, propertyName: prop.name, walletAddress: shortHash(),
          shortAddress: shortHash().slice(0, 6) + '...' + shortHash().slice(-4),
          tokens, pricePerToken: prop.tokenPrice, totalAmount: tokens * prop.tokenPrice,
          txHash: shortHash(), blockNumber: 54231093 + Math.floor(Math.random() * 100),
          status: 'confirmed', timestamp: nowISO(), network: 'Polygon Mumbai',
        });
      }
      return res.json([...liveTx, ...transactions].slice(0, limit));
    }

    if (url === '/api/blockchain/buy' && method === 'POST') {
      const { propertyId, tokens, walletAddress } = req.body || {};
      const prop = properties.find(p => p.id === propertyId);
      if (!prop) return res.status(404).json({ error: 'Property not found' });
      return res.json({
        id: `tx_${Date.now()}`, type: 'BUY', propertyId, propertyName: prop.name,
        walletAddress: walletAddress || '0xDemoWallet', shortAddress: '0xDemo...',
        tokens, pricePerToken: prop.tokenPrice, totalAmount: tokens * prop.tokenPrice,
        gasFee: 15, txHash: shortHash(), blockNumber: 54231093, status: 'confirmed',
        timestamp: nowISO(), network: 'Polygon Mumbai',
      });
    }

    if (url === '/api/blockchain/sell' && method === 'POST') {
      const { propertyId, tokens, walletAddress } = req.body || {};
      const prop = properties.find(p => p.id === propertyId);
      if (!prop) return res.status(404).json({ error: 'Property not found' });
      return res.json({
        id: `tx_${Date.now()}`, type: 'SELL', propertyId, propertyName: prop.name,
        walletAddress: walletAddress || '0xDemoWallet', shortAddress: '0xDemo...',
        tokens, pricePerToken: prop.tokenPrice, totalAmount: tokens * prop.tokenPrice * 0.999,
        gasFee: 15, txHash: shortHash(), blockNumber: 54231093, status: 'confirmed',
        timestamp: nowISO(), network: 'Polygon Mumbai',
      });
    }

    // ── Rental Distribution ────────────────────────────────────────────────────────
    if (url.startsWith('/api/rental/distribution/') && method === 'GET') {
      const propertyId = url.split('/').pop();
      const prop = properties.find(p => p.id === propertyId);
      if (!prop) return res.status(404).json({ error: 'Property not found' });
      const tokensOwned = portfolioTokens[propertyId] || 0;
      const sharePercent = tokensOwned / prop.totalTokens;
      return res.json({
        propertyId: prop.id, propertyName: prop.name, lastDistribution: '2026-04-01T00:00:00Z',
        nextDistribution: '2026-05-01T00:00:00Z', daysUntilNext: 13, totalRentCollected: prop.monthlyRent,
        tokensOwned, sharePercent: Math.round(sharePercent * 10000) / 100,
        yourShare: Math.round(prop.monthlyRent * sharePercent * 100) / 100,
        distributionTx: shortHash(), allHolders: prop.tokenHolders, ytdEarnings: 500, currency: 'INR',
      });
    }

    if (url === '/api/rental/portfolio' && method === 'GET') {
      const holdings = Object.entries(portfolioTokens).map(([propId, tokens]) => {
        const prop = properties.find(p => p.id === propId);
        if (!prop) return null;
        return {
          propertyId: propId, propertyName: prop.name, tokens,
          tokenValue: Math.round(tokens * prop.tokenPrice),
          monthlyRental: Math.round(prop.monthlyRent * (tokens / prop.totalTokens)),
          rentalYield: prop.rentalYield,
        };
      }).filter(Boolean);
      const totalMonthlyRental = holdings.reduce((s, h) => s + h.monthlyRental, 0);
      return res.json({
        holdings, totalValue: holdings.reduce((s, h) => s + h.tokenValue, 0),
        totalMonthlyRental, totalAnnualRental: totalMonthlyRental * 12,
        averageYield: 8.5, walletAddress: '0x742d35Cc6634C0532925a3b8D4C9b8B8F7e2c3A1',
      });
    }

    // ── Liquidity Pool (AMM) ───────────────────────────────────────────────────────
    if (url.startsWith('/api/amm/pool/') && method === 'GET') {
      const propertyId = url.split('/').pop();
      const prop = properties.find(p => p.id === propertyId);
      if (!prop) return res.status(404).json({ error: 'Property not found' });
      const liquidity = prop.totalValue * 0.15;
      return res.json({
        propertyId: prop.id, tokenPrice: prop.tokenPrice, liquidityINR: Math.round(liquidity),
        volume24h: Math.round(liquidity * 0.08), fee: 0.003, priceImpact1Token: 0.02,
        priceImpact100Tokens: 1.8, availableTokens: prop.availableTokens, totalLiquidity: prop.totalTokens - prop.availableTokens,
      });
    }

    // ── ZK Proofs ──────────────────────────────────────────────────────
    if (url === '/api/zk/generate-proof' && method === 'POST') {
      return res.json({
        proofType: req.body?.proofType || 'INCOME_ABOVE_THRESHOLD', verified: true,
        proof: '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        publicInputs: { threshold: req.body?.threshold || 10000, currency: 'INR' },
        verificationKey: '0x123', generatedAt: nowISO(),
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        message: 'Proof verified successfully',
      });
    }

    // ── Derivatives / Futures ──────────────────────────────────────────────────────
    if (url === '/api/derivatives/futures' && method === 'GET') {
      return res.json({
        volume24hCr: 142.5, openInterestCr: 840.2, updatedAt: new Date().toISOString(),
        contracts: [
          { symbol: 'MUM-IDX-DEC', name: 'Mumbai Real Estate Index', expiry: '31 Dec 2026', priceInr: 48200, changePct24h: 2.4, volumeCr: 52.5 },
          { symbol: 'BLR-TECH-SEP', name: 'Bengaluru Tech Corridors', expiry: '30 Sep 2026', priceInr: 19450, changePct24h: -1.1, volumeCr: 45.0 }
        ],
      });
    }

    // ── DAO / Governance ───────────────────────────────────────────────────────────
    if (url === '/api/dao/proposals' && method === 'GET') {
      return res.json([
        { id: 'dao_001', propertyId: 'prop_001', title: 'Lobby Renovation', status: 'ACTIVE', votesFor: 6842, votesAgainst: 1230, deadline: '2026-04-25T23:59:59Z' }
      ]);
    }

    // Not found
    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
