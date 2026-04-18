### **🔗 PERSON 1: BLOCKCHAIN LEAD — PropFi India (All-India Platform)**

**Scope**: All Indian states, cities, and areas. Dynamic property listing.

---

#### **Setup** ✅ DONE
* [x] Initialized npm + Hardhat v2
* [x] Installed OpenZeppelin v5, hardhat-toolbox, dotenv
* [x] Created `hardhat.config.js` (Solidity 0.8.27, evmVersion: cancun)
* [x] Configured Polygon Amoy Testnet (chainId: 80002) + localhost
* [x] Created `.env.example` and `.gitignore`

**Deliverable**: ✅ Working Hardhat environment — 24 files compiled

---

#### **Smart Contracts** ✅ DONE
* [x] `contracts/MockUSDC.sol` — ERC-20, 6 decimals, public mint
* [x] `contracts/PropFiMaster.sol` — ERC-1155 master contract:
  - `listProperty(name, area, city, state, propertyType, pricePerToken, totalTokens)` — dynamic, any India property
  - `buyFractionalToken(propertyId, amount)` — USDC pull + ERC-1155 mint
  - `depositRent(propertyId, amount)` — landlord deposits rent
  - `distributeRent(propertyId)` — proportional payout loop
  - `distributeRentDirect(propertyId, amount)` — owner one-call convenience
  - `getProperty()`, `getProperties()` (paginated), `getPortfolio()`, `getHolders()`, `getOwnershipShare()`

**Deliverable**: ✅ Two .sol files, compiled successfully

---

#### **Testing** ✅ DONE
* [x] `test/PropFi.test.js` — 26 tests total:
  - MockUSDC: 5 tests (deploy, mint, limits)
  - Property Listing: 5 tests (metadata, multi-state, access control)
  - Token Purchase: 6 tests (buy flow, USDC deduction, edge cases)
  - 🎯 Rent Math: 6 tests (EXACT proportional payouts verified)
  - Portfolio & Views: 4 tests (portfolio, holders, pagination)
* [x] `npx hardhat test` → **26/26 ✓ ALL PASSING**

**Deliverable**: ✅ Terminal showing 26 tests passing

---

#### **Deployment** ✅ DONE (local). TODO: Amoy Testnet
* [x] `scripts/deploy.js` — deploys both contracts, lists 12 properties, seeds demo
* [x] Deployed locally → all 12 Indian properties listed
* [ ] `npx hardhat run scripts/deploy.js --network amoy` → **needs .env filled**

**To deploy to Amoy**:
1. Copy `.env.example` → `.env`
2. Fill `ALCHEMY_AMOY_URL` (from alchemy.com)
3. Fill `PRIVATE_KEY` (MetaMask wallet with Amoy MATIC)
4. Run: `npx hardhat run scripts/deploy.js --network amoy`

---

#### **Golden Handoff** ✅ DONE
* [x] `export/property_data.json` — 12 properties, 10 states, all-India ← **ML Team uses this**
* [x] `export/constants.js` — USDC + PropFiMaster addresses + full ABIs ← **Frontend Team uses this**
* [x] `export/deployed_addresses.json` — contract addresses + network info
* [x] `WEB3_README.md` — Ethers.js integration guide with code examples

---

#### **Properties Listed (12 across India)**

| ID | City | State | Type | Price/Token |
|---|---|---|---|---|
| 1 | Bangalore | Karnataka | Commercial | 100 USDC |
| 2 | Mumbai | Maharashtra | Residential | 250 USDC |
| 3 | Hyderabad | Telangana | Commercial | 80 USDC |
| 4 | Gurugram | Haryana | Mixed | 150 USDC |
| 5 | Kolkata | West Bengal | Commercial | 60 USDC |
| 6 | Chennai | Tamil Nadu | Residential | 110 USDC |
| 7 | Ahmedabad | Gujarat | Commercial | 70 USDC |
| 8 | Noida | Uttar Pradesh | Commercial | 85 USDC |
| 9 | Pune | Maharashtra | Commercial | 95 USDC |
| 10 | Gandhinagar | Gujarat | Commercial | 200 USDC |
| 11 | New Delhi | Delhi | Mixed | 180 USDC |
| 12 | Kochi | Kerala | Commercial | 75 USDC |