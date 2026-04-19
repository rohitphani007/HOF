/**
 * PropFi API Client
 * ─────────────────────────────────────────────────────────────────
 * Drop-in client for Person 3 (React frontend) to call all APIs.
 * Usage: import PropFiAPI from '../integration/api-client'
 * ─────────────────────────────────────────────────────────────────
 */

import { ethers } from 'ethers';
import { USDC_ADDRESS, USDC_ABI, PROPFI_MASTER_ADDRESS, PROPFI_MASTER_ABI } from './contracts/constants';

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
 * Get properties with filters, sort, pagination.
 * Returns { data: [...], total, page, limit, totalPages, hasMore }
 * @param {{ city, minYield, maxRisk, type, search, sort, page, limit }} filters
 */
export const getProperties = async (filters = {}) => {
  // Remove empty values
  const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v != null));
  const params = new URLSearchParams(clean).toString();
  const res = await request(`/properties${params ? '?' + params : ''}`);
  // Handle both old array format and new paginated format
  if (Array.isArray(res)) return { data: res, total: res.length, page: 1, totalPages: 1, hasMore: false };
  return res;
};

/**
 * Get single property by ID
 * @param {string} propertyId
 */
export const getProperty = (propertyId) => request(`/properties/${propertyId}`);

/**
 * Get list of all cities with property counts
 */
export const getCities = () => request('/cities');

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
 * Buy property tokens using MetaMask instead of mock server.
 * @param {{ propertyId, tokens, walletAddress }} payload
 * @returns {{ txHash, status, tokensReceived, totalPaid, gasFee, blockNumber }}
 */
export const buyTokens = async (payload) => {
  if (!window.ethereum) throw new Error('MetaMask is required to buy tokens.');
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  
  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
  const propfi = new ethers.Contract(PROPFI_MASTER_ADDRESS, PROPFI_MASTER_ABI, signer);

  // We fetch the property locally to find the token price
  const property = await getProperty(payload.propertyId);
  const totalCostInDollars = property.tokenPrice * payload.tokens;
  const totalCost = ethers.parseUnits(totalCostInDollars.toString(), 6); // Mock USDC is 6 decimals
  
  // TX 1: Approve
  console.log('Sending Approve TX for', totalCost.toString(), 'USDC...');
  const approveTx = await usdc.approve(PROPFI_MASTER_ADDRESS, totalCost);
  await approveTx.wait();
  
  // TX 2: Buy Token
  console.log('Sending Buy TX...');
  // The propertyId from the mock server is something like 'prop_001', the smart contract expects uint256.
  const numericId = parseInt(payload.propertyId.replace('prop_', '').replace('land_', ''), 10) || parseInt(payload.propertyId, 10);
  const buyTx = await propfi.buyFractionalToken(numericId, payload.tokens);
  const receipt = await buyTx.wait();

  return {
    txHash: buyTx.hash,
    status: 'confirmed',
    tokensReceived: payload.tokens,
    totalPaid: totalCostInDollars,
    gasFee: 0,
    blockNumber: receipt.blockNumber
  };
};

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
