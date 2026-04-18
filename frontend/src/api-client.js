/**
 * PropFi API Client
 * ─────────────────────────────────────────────────────────────────
 * Drop-in client for Person 3 (React frontend) to call all APIs.
 * Usage: import PropFiAPI from '../integration/api-client'
 * ─────────────────────────────────────────────────────────────────
 */

const BASE_URL = 'http://localhost:3001/api';
const WS_URL   = 'ws://localhost:3001';

// ── HTTP helper ───────────────────────────────────────────────────────────────
async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`[PropFiAPI] ${path} failed:`, err.message);
    throw err;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  PROPERTIES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get all properties. Optional filters: { city, minYield, maxRisk, type }
 * @returns {Promise<Array>} list of property objects
 */
export const getProperties = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return request(`/properties${params ? '?' + params : ''}`);
};

/**
 * Get single property by ID
 * @param {string} propertyId
 */
export const getProperty = (propertyId) => request(`/properties/${propertyId}`);

// ══════════════════════════════════════════════════════════════════════════════
//  AI / PRICING
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get AI price analysis for a property
 * @param {string} propertyId
 * @returns {{ currentPrice, predictedPrice6M, confidence, riskScore, factors }}
 */
export const getAIPrice = (propertyId) => request(`/ai/price/${propertyId}`);

/**
 * Run AI prediction for a new (unlisted) property
 * @param {{ area, bedrooms, distanceToMetro, age, floor, city }} params
 */
export const predictPrice = (params) =>
  request('/ai/predict', { method: 'POST', body: JSON.stringify(params) });

// ══════════════════════════════════════════════════════════════════════════════
//  BLOCKCHAIN / TRANSACTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get recent transactions
 * @param {number} limit defaults to 10
 */
export const getTransactions = (limit = 10) =>
  request(`/blockchain/transactions?limit=${limit}`);

/**
 * Buy property tokens
 * @param {{ propertyId, tokens, walletAddress }} payload
 * @returns {{ txHash, status, tokensReceived, totalPaid, gasFee, blockNumber }}
 */
export const buyTokens = (payload) =>
  request('/blockchain/buy', { method: 'POST', body: JSON.stringify(payload) });

/**
 * Sell property tokens
 * @param {{ propertyId, tokens, walletAddress }} payload
 */
export const sellTokens = (payload) =>
  request('/blockchain/sell', { method: 'POST', body: JSON.stringify(payload) });

// ══════════════════════════════════════════════════════════════════════════════
//  RENTAL INCOME
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get rental distribution details for a property
 * @param {string} propertyId
 */
export const getRentalDistribution = (propertyId) =>
  request(`/rental/distribution/${propertyId}`);

/**
 * Get full portfolio summary (all holdings + rental income)
 */
export const getPortfolio = () => request('/rental/portfolio');

// ══════════════════════════════════════════════════════════════════════════════
//  AMM / LIQUIDITY POOL
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get AMM pool info for a property (price impact, TVL, volume)
 * @param {string} propertyId
 */
export const getAMMPool = (propertyId) => request(`/amm/pool/${propertyId}`);

// ══════════════════════════════════════════════════════════════════════════════
//  ZK PROOFS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a Zero-Knowledge proof
 * @param {{ proofType: string, threshold: number }} params
 * proofType: 'INCOME_ABOVE_THRESHOLD' | 'OWNERSHIP_PROOF' | 'NO_DISPUTES'
 */
export const generateZKProof = (params) =>
  request('/zk/generate-proof', { method: 'POST', body: JSON.stringify(params) });

// ══════════════════════════════════════════════════════════════════════════════
//  DERIVATIVES
// ══════════════════════════════════════════════════════════════════════════════

/** Get available futures contracts */
export const getFutures = () => request('/derivatives/futures');

// ══════════════════════════════════════════════════════════════════════════════
//  DAO / GOVERNANCE
// ══════════════════════════════════════════════════════════════════════════════

/** Get active DAO proposals */
export const getProposals = () => request('/dao/proposals');

// ══════════════════════════════════════════════════════════════════════════════
//  WEBSOCKET — Live price feed
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Connect to live WebSocket price feed.
 *
 * @param {Object} handlers
 * @param {Function} handlers.onPriceTick   - called with array of { id, tokenPrice }
 * @param {Function} handlers.onNewTx       - called with a transaction object
 * @param {Function} handlers.onInit        - called with { properties } on connect
 * @param {Function} [handlers.onError]     - called on WS error
 * @returns {WebSocket} ws instance (call ws.close() to disconnect)
 *
 * @example
 * const ws = connectLiveFeed({
 *   onPriceTick: (updates) => updates.forEach(u => setPrices(p => ({...p, [u.id]: u.tokenPrice}))),
 *   onNewTx: (tx) => setTxFeed(f => [tx, ...f].slice(0, 20)),
 * });
 * // cleanup: ws.close()
 */
export const connectLiveFeed = ({ onPriceTick, onNewTx, onInit, onError }) => {
  const ws = new WebSocket(WS_URL);

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'PRICE_TICK'     && onPriceTick) onPriceTick(msg.data);
      if (msg.type === 'NEW_TRANSACTION' && onNewTx)    onNewTx(msg.data);
      if (msg.type === 'INIT'            && onInit)     onInit(msg.data);
    } catch (e) {
      console.error('[PropFiAPI WS] parse error', e);
    }
  };

  ws.onerror = (e) => {
    console.error('[PropFiAPI WS] error', e);
    if (onError) onError(e);
  };

  return ws;
};

// ══════════════════════════════════════════════════════════════════════════════
//  HEALTH CHECK
// ══════════════════════════════════════════════════════════════════════════════

/** Check if all backend services are up */
export const healthCheck = () => request('/health');

// Default export — bundle all methods
const PropFiAPI = {
  getProperties,
  getProperty,
  getAIPrice,
  predictPrice,
  getTransactions,
  buyTokens,
  sellTokens,
  getRentalDistribution,
  getPortfolio,
  getAMMPool,
  generateZKProof,
  getFutures,
  getProposals,
  connectLiveFeed,
  healthCheck,
};

export default PropFiAPI;
