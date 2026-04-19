# PropFi: Real Estate Tokenization & Trading Platform

PropFi is a decentralized real estate ecosystem built to democratize property investment and neutralize the core manipulation vectors prevalent in Indian real estate markets using Web3 infrastructure and AI.

## The Core Problem
Indian real estate prices are frequently distorted by factors beyond pure market supply and demand. Our platform restricts manipulation from:
1. Developer Manipulation: Faking transaction volumes to inflate early-stage prices.
2. Broker Cartels: Controlling local supply to extract inflated finder fees.
3. Circle Rate Exploitation: Major gaps between official Government guidance values and Listed prices.
4. Black Money Transactions: Undocumented cash components that distort absolute market value.

## The PropFi Solution & Tech Stack
PropFi leverages Blockchain Immutability and an AI-driven pricing oracle to create a transparent, liquid environment for investors.

### Technology Stack & Architecture
- Token Standard: ERC-1155 (Multi-Token Standard) for fractionalizing real estate assets securely.
- Blockchain Network: Polygon Amoy Testnet for high-throughput, low-gas transaction simulation via Ethers.js and MetaMask.
- Smart Contracts: Handling decentralized buy/sell operations, margin locking, and DAO voting weight (vPROP).
- AI/Backend Model: XGBoost Regression Model processing topographical, proximity, and government data to forecast pricing without human bias.
- Frontend: React UI (Vite) with Recharts for data visualization and Leaflet for interactive topological mapping.

## Technical Implementation Overview

### 1. Derivatives Trading (Interactive)
File: src/pages/Derivatives.tsx
- Users can execute "Open Long Position" to trade property indices without physical ownership.
- The UI triggers a 2.5-second blockchain confirmation animation simulating network latency.
- The action button dynamically disables and explicitly shows "Processing Transaction..." during the wait period.
- A success state renders a verifiable mock transaction hash (e.g., Position Opened on-chain! LONG MUM-IDX-DEC · 1,000 USDC margin. TX: 0xa3f2...c91b).
- System handles 10x leverage Math and simulated isolated margin liquidation logic.

### 2. Decentralized Governance DAO (Interactive)
File: src/pages/DAO.tsx
- Live interface for community-driven dispute resolution (e.g., Tenant vs Landlord disputes).
- Both "Support Landlord" and "Support Tenant" actions are fully wired to state.
- Executing a vote triggers a 2-second processing delay with visual feedback.
- Progress bars animate smoothly to reflect the shift in percentage based on the voter's token weight (e.g., 1,450 vPROP).
- Action buttons lock permanently after casting to prevent double-voting.
- The active status badge dynamically shifts from "Active Voting" to "Vote Recorded".
- The system returns a mock on-chain TX receipt mapping the vote hash.

### 3. PropFi Integrity Oracle (Anti-Fraud AI Engine)
File: src/pages/AssetDetail.tsx
- A dedicated anti-fraud UI panel built dynamically into every property detail page.
- Price Composition Model: Visual weighted bars rendering the algorithmic focus:
  - Sub-Registrar / Circle Rate Floor (40%)
  - Rental Yield Back-Calculation (25%)
  - Location & Physical Scoring (20%)
  - Market Sentiment (15%)
- Circle Rate Gap Analysis: 3-column data grid strictly comparing Circle Rate vs Listed Price vs Gap Percentage.
- Manipulation Alerts: Dynamically rendered red flags catching conditions like "Price > 2x circle rate", "Price exceeds rental yield support", or missing legal certifications.
- PropFi Trust Signals: Renders green certification chips upon validation of White money structure, GST trail availability, Broker-free status, and RERA verification.
- Overall Verdict: The algorithmic output text adapts dynamically between Healthy, Moderate Caution, or High Risk based on the calculated manipulation gap.

### 4. AI Valuation Modal
File: src/components/AIValuationModal.tsx
- Visualizes the XGBoost model processing pipeline.
- Loading states explicitly reference the 5-pillar analysis pipeline (e.g., Fetching Sub-Registrar data, Computing rental yield, Running broker filter).
- Injects an Anti-Fraud Pricing Breakdown grid directly after results compile.
- Model Insights text explicitly references localized circle rate compliance, demographic transit proximity, and broker filter clearance.

---
All features above are fully implemented locally and interactive. PropFi stands as a scalable blueprint for transparent, modern property tokenization.