# PropFi India — Web3 README
## Blockchain Integration Guide for All Teams

---

## 📋 Quick Reference

| Contract | Description |
|---|---|
| `MockUSDC` | Fake USDC token (6 decimals). Anyone can mint for demos. |
| `PropFiMaster` | ERC-1155 master contract. One contract governs ALL Indian properties. |

**All addresses after deployment → see `export/deployed_addresses.json`**  
**Ready-to-use ABI + addresses for Frontend → see `export/constants.js`**

---

## 🗺️ Properties Covered

12 flagship properties across India (with more supported dynamically):

| ID | Property | City | State | Price/Token |
|---|---|---|---|---|
| 1 | Whitefield Tech Park Tower A | Bangalore | Karnataka | 100 USDC |
| 2 | Bandra West Heights | Mumbai | Maharashtra | 250 USDC |
| 3 | HITEC One Cyber Tower | Hyderabad | Telangana | 80 USDC |
| 4 | Cyber Hub Prestige Tower | Gurugram | Haryana | 150 USDC |
| 5 | New Town Smart City Hub | Kolkata | West Bengal | 60 USDC |
| 6 | Phoenix Greens Residential | Chennai | Tamil Nadu | 110 USDC |
| 7 | SG Highway Business Park | Ahmedabad | Gujarat | 70 USDC |
| 8 | Sector 62 Tech Enclave | Noida | Uttar Pradesh | 85 USDC |
| 9 | Hinjewadi Phase III Plaza | Pune | Maharashtra | 95 USDC |
| 10 | GIFT City FinTech Tower | Gandhinagar | Gujarat | 200 USDC |
| 11 | Aerocity Business Hub | New Delhi | Delhi | 180 USDC |
| 12 | TechnoCity Kochi Tower | Kochi | Kerala | 75 USDC |

---

## 🔧 Setup (For Frontend Team)

```bash
npm install ethers
```

```js
import { ethers } from "ethers";
import { 
  USDC_ADDRESS, USDC_ABI, 
  PROPFI_MASTER_ADDRESS, PROPFI_MASTER_ABI 
} from "./web3/export/constants.js";
```

### Connect to MetaMask (Wagmi / Ethers.js)

```js
// Ethers v6
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
const propfi = new ethers.Contract(PROPFI_MASTER_ADDRESS, PROPFI_MASTER_ABI, signer);
```

---

## 🔑 Key Workflows

### 1. Get Free Test USDC (Demo)

```js
// Mint 10,000 mUSDC to yourself (6 decimal precision)
await usdc.mint(userAddress, ethers.parseUnits("10000", 6));
```

### 2. Buy Fractional Tokens — TWO TRANSACTIONS REQUIRED

> ⚠️ **Critical**: You must approve USDC spend BEFORE calling buyFractionalToken

```js
const propertyId = 1; // Whitefield Tech Park
const numTokensToBuy = 10;
const pricePerToken = ethers.parseUnits("100", 6); // 100 USDC in 6 decimals
const totalCost = pricePerToken * BigInt(numTokensToBuy); // 1000 USDC

// TX 1: Approve USDC spend
const approveTx = await usdc.approve(PROPFI_MASTER_ADDRESS, totalCost);
await approveTx.wait();

// TX 2: Buy the tokens
const buyTx = await propfi.buyFractionalToken(propertyId, numTokensToBuy);
await buyTx.wait();

console.log("✅ Bought", numTokensToBuy, "tokens for Property ID", propertyId);
```

### 3. Get All Properties (Paginated)

```js
// Get first 12 properties (all of them for now)
const properties = await propfi.getProperties(0, 12);

// Each property has:
// {
//   propertyId, name, area, city, state, propertyType,
//   pricePerToken, totalTokens, tokensSold,
//   totalRentDistributed, isActive
// }

// Format price for display
const priceDisplay = ethers.formatUnits(properties[0].pricePerToken, 6) + " USDC";
```

### 4. Get User Portfolio

```js
const [propIds, balances] = await propfi.getPortfolio(userAddress);

// propIds: [1, 3, 7]  — property IDs the user owns
// balances: [10, 5, 20] — tokens owned in each
```

### 5. Check Ownership Percentage

```js
// Returns basis points (e.g., 5000 = 50%)
const share = await propfi.getOwnershipShare(propertyId, userAddress);
const percentage = (Number(share) / 100).toFixed(2) + "%";
```

### 6. Deposit Rent (Landlord)

```js
const rentAmount = ethers.parseUnits("10000", 6); // 10,000 USDC

// Step 1: Approve
await usdc.approve(PROPFI_MASTER_ADDRESS, rentAmount);

// Step 2: Deposit
await propfi.depositRent(propertyId, rentAmount);
```

### 7. Trigger Rent Distribution

```js
// Anyone can call this — distributes proportionally to all holders
await propfi.distributeRent(propertyId);
```

### 8. Listen to Events (Real-time UI Updates)

```js
// New property listed
propfi.on("PropertyListed", (id, name, city, state, price, tokens) => {
  console.log(`New property: ${name} in ${city}, ${state}`);
});

// Tokens purchased
propfi.on("TokensPurchased", (propId, buyer, amount, cost) => {
  console.log(`${buyer} bought ${amount} tokens for property ${propId}`);
});

// Rent claimed
propfi.on("RentClaimed", (propId, holder, amount) => {
  const usdcAmount = ethers.formatUnits(amount, 6);
  console.log(`${holder} received ${usdcAmount} USDC rent from property ${propId}`);
});
```

---

## 🏃 Running Locally

```bash
# Terminal 1: Start local blockchain
cd HOF/web3
npx hardhat node

# Terminal 2: Deploy to local network
npx hardhat run scripts/deploy.js --network localhost

# Run tests
npx hardhat test
```

## 🚀 Deploy to Polygon Amoy Testnet

```bash
# 1. Copy .env.example to .env and fill in values
cp .env.example .env

# 2. Get free Amoy MATIC from faucet:
#    https://faucet.polygon.technology/

# 3. Deploy!
npx hardhat run scripts/deploy.js --network amoy

# 4. Verify on Polygonscan (optional)
npx hardhat verify --network amoy <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

---

## 🧮 Rent Math (For ML Team Reference)

The contract uses **integer-safe proportional math**:

```
holderShare = (holderTokenBalance × totalRentPool) ÷ totalTokensSupply
```

Example:
- Property has 1000 total tokens
- User owns 300 tokens → 30% ownership
- Rent pool = 10,000 USDC
- User receives: (300 × 10,000) / 1000 = **3,000 USDC exactly**

> Rounding dust (< 1 USDC cent) stays in the rent pool for the next round.

---

## 🔒 Security Notes

- `buyFractionalToken` uses `nonReentrant` guard
- `distributeRent` zeroes the pool BEFORE transfers (prevents re-entrancy)
- All amounts in mUSDC use 6 decimal precision (match real USDC)
- Private key → `.env` file only, never committed to git

---

## 📞 Team Sync

| What you need | Where to get it |
|---|---|
| Contract addresses | `export/deployed_addresses.json` |
| ABIs + addresses combined | `export/constants.js` |
| Property list with IDs | `export/property_data.json` |
| ML property data format | `export/property_data.json` (same file) |
