# 🏙️ PropFi: Fraud-Proof Real Estate Tokenization & Trading

PropFi is a cutting-edge, decentralized real estate ecosystem that democratizes property investment while completely isolating the **5 core manipulation vectors** prevalent in Indian real estate markets.

## 🚨 The Core Problem We Solve
In the massive Indian real estate market, prices are heavily manipulated. Ground reality dictates that prices are not driven purely by supply/demand, but are distorted by:
1. 🏗️ **Developer Manipulation:** Creating fake volume to artificially inflate early-stage prices.
2. 🤝 **Broker Cartels (Dalals):** Controlling local supply to squeeze inflated finder fees.
3. 🏛️ **Circle Rate Exploitation:** Staggering gaps between official Govt guidance value and "Market Listed" price.
4. 💰 **Black Money Factor:** Undocumented cash components inherently distorting market value.
5. 👨‍👩‍👧 **Local Interference:** Evictions and disputes stalled by lengthy localized legal structures.

## 💡 The PropFi Solution
PropFi leverages **Web3 Immutability** and an **AI-driven Integrity Oracle** to tear down these barriers, creating a transparent, highly-liquid, and manipulation-proof environment for both institutional and retail investors.

---

## 🛠️ Key Features Fully Implemented

### 1. PropFi Integrity Oracle (Anti-Fraud AI Pricing Engine)
Instead of trusting "listed prices", our platform analyzes every property through a robust 4-pillar algorithmic model:
* **Government Data Anchoring (40%):** Sub-Registrar / Circle rate baseline tracking.
* **Rental Yield Back-Calculation (25%):** Checking if the local monthly rent actually justifies the property's capital value.
* **Location & Sentiment (35%):** Processing topographical data and transit proximity.
* **Visual Trust Dashboard:** Instantly flags manipulation (e.g., *“Listed price > 2× circle rate”*, *“Price exceeds rental supply yield”*) ensuring investors only buy assets verified by AI and on-chain intelligence.

### 2. Decentralized Governance (Dispute Resolution DAO)
Bypasses traditional inefficient legal courts.
* **Community Arbitration:** Token holders (vPROP) vote on live disputes (e.g., Tenant Eviction vs Landlord).
* **AI Evidence Analyzer:** On-chain logs parsed by NLP immediately surface the root cause (e.g., smart contract revert vs actual default).
* **Live Voting Mechanism:** Fully interactive sliders locked on-chain via Ethers.js/MetaMask signing with immediate TX hash generation.

### 3. Property Derivatives & Futures
* Allows speculators to trade market movements without acquiring complex physical assets.
* Fully interactive UI to take leveraged positions (up to 10x Notional) on localized indices (e.g., Mumbai Commercial Index).

### 4. Dynamic Financial Portfolio 
* Parses the user's localized 'bank statement' sequence of actual demo purchases.
* Plots a pure, mathematically-accurate Mark-to-Market (MTM) growth curve showcasing portfolio progression based exactly on real purchase history against real-time yields.

### 5. High-Fidelity UI/UX
* Completely custom vector visuals with premium "Warm Beige/Espresso" theming.
* Zero-latency browser interactions using React Router `<Link>` components mapped to an interactive Leaflet JS topological overlay. 
* Flawless onboarding user-flow with local session handling.

---

## 💻 Tech Stack
* **Frontend UI:** React + TypeScript (Vite), native CSS variables for extreme styling control.
* **Data Visualization:** Recharts, React-Leaflet.
* **Web3 Integration:** Ethers.js connected directly to the Polygon Amoy Testnet for simulated high-throughput state updates.
* **AI/Backend Model Foundation:** Python + XGBoost modeling structures handling topography & pricing predictions.

## 🚀 How to Run the Demo Locally
1. **Navigate** into the `frontend` directory: `cd frontend`
2. **Install Packages**: `npm install`
3. **Start the Application**: `npm run dev`
4. The platform will automatically orchestrate the splash screen once per session and guide you securely into the dashboard!