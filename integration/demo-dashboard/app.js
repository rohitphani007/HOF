// ── Config ──────────────────────────────────────────────────────────────────
const API = 'http://localhost:3001/api';
const WS_URL = 'ws://localhost:3001';

// ── State ────────────────────────────────────────────────────────────────────
let allProperties = [];
let selectedProp = null;
let priceChart = null;
let ws = null;

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadProperties();
  loadTxFeed();
  loadPortfolio();
  loadDAOProposals();
  connectWebSocket();
  animateBlockNumber();
});

// ── WebSocket Live Feed ───────────────────────────────────────────────────────
function connectWebSocket() {
  try {
    ws = new WebSocket(WS_URL);
    ws.onopen = () => {
      document.querySelector('.dot').style.background = '#10b981';
    };
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'PRICE_TICK') handlePriceTick(msg.data);
      if (msg.type === 'NEW_TRANSACTION') handleNewTx(msg.data);
      // INIT: only sync prices into existing allProperties — never overwrite
      // (REST loadProperties() is the source of truth for the full list)
      if (msg.type === 'INIT' && allProperties.length === 0) {
        allProperties = msg.data.properties;
        renderProperties(allProperties);
        populateChartSelect();
        loadChart(allProperties[0].id);
      }
    };
    ws.onerror = () => {
      document.querySelector('.dot').style.background = '#f59e0b';
    };
  } catch (e) {
    console.warn('WS unavailable, using REST fallback');
  }
}

function handlePriceTick(updates) {
  updates.forEach(u => {
    const prop = allProperties.find(p => p.id === u.id);
    if (prop) prop.tokenPrice = u.tokenPrice;
    // Update price in card DOM
    const el = document.getElementById(`price-${u.id}`);
    if (el) {
      el.textContent = `₹${u.tokenPrice.toFixed(2)}`;
      el.classList.add('flash');
      setTimeout(() => el.classList.remove('flash'), 600);
    }
  });
}

function handleNewTx(tx) {
  prependTxItem(tx);
  animateBlockNumber();
}

// ── Properties ────────────────────────────────────────────────────────────────
async function loadProperties() {
  try {
    const res = await fetch(`${API}/properties`);
    allProperties = await res.json();
    renderProperties(allProperties);
    populateChartSelect();
    loadChart(allProperties[0].id);
    // Update status bar count dynamically
    const countEl = document.getElementById('totalPropsCount');
    if (countEl) countEl.textContent = allProperties.length;
  } catch (e) {
    console.error('Using offline data', e);
  }
}

function renderProperties(props) {
  const grid = document.getElementById('propertyGrid');
  grid.innerHTML = props.map(p => propCardHTML(p)).join('');
}

function propCardHTML(p) {
  const sold = Math.round(((p.totalTokens - p.availableTokens) / p.totalTokens) * 100);
  const riskClass = p.riskScore >= 80 ? 'risk-low' : 'risk-med';
  const riskLabel = p.riskScore >= 80 ? 'Low Risk' : 'Medium Risk';

  // ── Land-specific card ─────────────────────────────────────────────────────
  if (p.isLand) {
    const sizeLabel = p.plotAcres
      ? `${p.plotAcres} Acres`
      : `${p.plotSqYards} Sq. Yds`;
    const yieldLabel = p.appreciationYield
      ? `${p.appreciationYield}% appreciation`
      : `${p.rentalYield}% rental`;
    const incomeVal = p.leaseIncome
      ? `₹${(p.leaseIncome/1000).toFixed(1)}K/mo lease`
      : 'Appreciation play';
    return `
    <div class="prop-card land-card" onclick="openBuyModal('${p.id}')">
      <div class="land-img-wrap">
        <img class="prop-img" src="${p.image}" alt="${p.name}" loading="lazy"/>
        <div class="land-overlay-badge">🌍 ${p.zoning}</div>
      </div>
      <div class="prop-body">
        <div class="prop-type-badge land-badge">${p.type}</div>
        <div class="prop-name">${p.name}</div>
        <div class="prop-area">📍 ${p.area}</div>
        <div class="ai-pred">🤖 AI: <strong>${p.aiPrediction}</strong> in ${p.aiPredictionPeriod}</div>
        <div class="prop-metrics">
          <div class="metric">
            <div class="metric-label">Plot Size</div>
            <div class="metric-value teal">${sizeLabel}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Expected Gain</div>
            <div class="metric-value green">${yieldLabel}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Income</div>
            <div class="metric-value">${incomeVal}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Land Value</div>
            <div class="metric-value">₹${(p.totalValue/1000000).toFixed(1)}Cr</div>
          </div>
        </div>
        <div class="land-legal">
          <span class="legal-tag">⚖️ ${p.legalStatus}</span>
          <span class="legal-tag">📄 ${p.registryStatus}</span>
        </div>
        ${p.nearbyDevelopments ? `<div class="nearby-dev">🏗 ${p.nearbyDevelopments[0]}</div>` : ''}
        <div class="prop-token-row" style="margin-top:8px">
          <div class="token-price" id="price-${p.id}">₹${p.tokenPrice} <span>/ token</span></div>
          <div class="risk-badge ${riskClass}">${riskLabel} ${p.riskScore}/100</div>
        </div>
        <div class="token-bar-wrap">
          <div class="token-bar-info">
            <span>${sold}% funded</span>
            <span>${p.availableTokens.toLocaleString('en-IN')} tokens left</span>
          </div>
          <div class="token-bar"><div class="token-bar-fill" style="width:${sold}%"></div></div>
        </div>
        <button class="btn-invest land-invest">🌍 Invest from ₹${p.tokenPrice.toLocaleString('en-IN')}</button>
      </div>
    </div>`;
  }

  // ── Regular property card ──────────────────────────────────────────────────
  return `
  <div class="prop-card" onclick="openBuyModal('${p.id}')">
    <img class="prop-img" src="${p.image}" alt="${p.name}" loading="lazy"/>
    <div class="prop-body">
      <div class="prop-type-badge">${p.type}</div>
      <div class="prop-name">${p.name}</div>
      <div class="prop-area">📍 ${p.area}</div>
      <div class="ai-pred">🤖 AI Prediction: <strong>${p.aiPrediction}</strong> in ${p.aiPredictionPeriod}</div>
      <div class="prop-metrics">
        <div class="metric">
          <div class="metric-label">Rental Yield</div>
          <div class="metric-value green">${p.rentalYield}% p.a.</div>
        </div>
        <div class="metric">
          <div class="metric-label">Monthly Rent</div>
          <div class="metric-value teal">₹${(p.monthlyRent/1000).toFixed(0)}K</div>
        </div>
        <div class="metric">
          <div class="metric-label">Holders</div>
          <div class="metric-value">${p.tokenHolders}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Property Value</div>
          <div class="metric-value">₹${(p.totalValue/1000000).toFixed(1)}Cr</div>
        </div>
      </div>
      <div class="prop-token-row">
        <div class="token-price" id="price-${p.id}">₹${p.tokenPrice} <span>/ token</span></div>
        <div class="risk-badge ${riskClass}">${riskLabel} ${p.riskScore}/100</div>
      </div>
      <div class="token-bar-wrap">
        <div class="token-bar-info">
          <span>${sold}% funded</span>
          <span>${p.availableTokens.toLocaleString('en-IN')} tokens left</span>
        </div>
        <div class="token-bar"><div class="token-bar-fill" style="width:${sold}%"></div></div>
      </div>
      <button class="btn-invest">💰 Invest from ₹${p.tokenPrice.toLocaleString('en-IN')}</button>
    </div>
  </div>`;
}

function filterProps(city, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  let filtered;
  if (city === 'all') filtered = allProperties;
  else if (city === 'Land') filtered = allProperties.filter(p => p.isLand);
  else filtered = allProperties.filter(p => p.city === city && !p.isLand);
  renderProperties(filtered);
}

// ── Buy Modal ─────────────────────────────────────────────────────────────────
function openBuyModal(propId) {
  selectedProp = allProperties.find(p => p.id === propId);
  if (!selectedProp) return;
  document.getElementById('modalPropName').textContent = selectedProp.name + ' · ' + selectedProp.area;
  document.getElementById('buyTokens').value = 10;
  document.getElementById('txResult').classList.add('hidden');
  updateBuyCost();
  document.getElementById('buyModal').classList.remove('hidden');
}

function closeBuyModal() {
  document.getElementById('buyModal').classList.add('hidden');
  selectedProp = null;
}

function updateBuyCost() {
  if (!selectedProp) return;
  const tokens = parseInt(document.getElementById('buyTokens').value) || 0;
  const cost = tokens * selectedProp.tokenPrice;
  const gas = 12;
  document.getElementById('cbPrice').textContent = `₹${selectedProp.tokenPrice.toLocaleString('en-IN')}`;
  document.getElementById('cbCost').textContent = `₹${cost.toLocaleString('en-IN')}`;
  document.getElementById('cbGas').textContent = `₹${gas}`;
  document.getElementById('cbTotal').textContent = `₹${(cost + gas).toLocaleString('en-IN')}`;
  const pct = ((tokens / selectedProp.totalTokens) * 100).toFixed(3);
  document.getElementById('ownershipPct').textContent = `${pct}%`;
  if (selectedProp.isLand) {
    const apprYield = selectedProp.appreciationYield || 0;
    const annualGain = Math.round(cost * apprYield / 100);
    document.getElementById('monthlyEarn').textContent = `₹${annualGain.toLocaleString('en-IN')}/yr appreciation`;
  } else {
    const monthlyEarn = Math.round((selectedProp.monthlyRent * tokens) / selectedProp.totalTokens);
    document.getElementById('monthlyEarn').textContent = `₹${monthlyEarn.toLocaleString('en-IN')}/month`;
  }
}

async function confirmBuy() {
  if (!selectedProp) return;
  const tokens = parseInt(document.getElementById('buyTokens').value);
  const btn = document.getElementById('confirmBuyBtn');
  btn.textContent = '⏳ Confirming on Polygon...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/blockchain/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId: selectedProp.id, tokens, walletAddress: '0x742d35Cc6634C0532925a3b8D4C9b8B8F7e2c3A1' })
    });
    const tx = await res.json();
    const resultEl = document.getElementById('txResult');
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = `
      ✅ <strong>Transaction Confirmed!</strong><br/>
      You now own <strong>${tokens} tokens</strong> of ${selectedProp.name}<br/>
      Earning <strong class="green">₹${Math.round(selectedProp.monthlyRent * tokens / selectedProp.totalTokens).toLocaleString('en-IN')}/month</strong> in rent<br/>
      <span class="tx-hash-link">Tx: ${tx.txHash}</span><br/>
      Block: #${tx.blockNumber} · Gas: ₹${tx.gasFee}
    `;
    btn.textContent = '✅ Investment Complete!';
    // Update local state
    const localProp = allProperties.find(p => p.id === selectedProp.id);
    if (localProp) localProp.availableTokens -= tokens;
    loadPortfolio();
  } catch (e) {
    btn.textContent = '❌ Failed - Retry';
    btn.disabled = false;
  }
}

// Close modal on backdrop click
document.getElementById('buyModal').addEventListener('click', function(e) {
  if (e.target === this) closeBuyModal();
});

// ── Transaction Feed ──────────────────────────────────────────────────────────
async function loadTxFeed() {
  try {
    const res = await fetch(`${API}/blockchain/transactions?limit=8`);
    const txs = await res.json();
    const feed = document.getElementById('txFeed');
    feed.innerHTML = '';
    txs.forEach(tx => prependTxItem(tx, false));
  } catch (e) { console.error(e); }
}

function prependTxItem(tx, animate = true) {
  const feed = document.getElementById('txFeed');
  const typeClass = tx.type === 'BUY' ? 'tx-buy' : tx.type === 'SELL' ? 'tx-sell' : 'tx-rent';
  const amtClass = tx.type === 'SELL' ? 'red' : 'green';
  const amt = tx.type === 'RENT_DISTRIBUTION'
    ? `+₹${tx.yourShare?.toLocaleString('en-IN') || '-'}`
    : `₹${tx.totalAmount?.toLocaleString('en-IN') || '-'}`;
  const el = document.createElement('div');
  el.className = 'tx-item';
  if (!animate) el.style.animation = 'none';
  el.innerHTML = `
    <span class="tx-type ${typeClass}">${tx.type}</span>
    <div class="tx-info">
      <div class="tx-prop">${tx.propertyName}</div>
      <div class="tx-detail">${tx.shortAddress || tx.walletAddress?.slice(0,10)+'...' } · ${tx.tokens} tokens</div>
    </div>
    <span class="tx-amount ${amtClass}">${amt}</span>
  `;
  feed.insertBefore(el, feed.firstChild);
  // Keep max 10 items
  while (feed.children.length > 10) feed.removeChild(feed.lastChild);
}

// ── Portfolio ─────────────────────────────────────────────────────────────────
async function loadPortfolio() {
  try {
    const res = await fetch(`${API}/rental/portfolio`);
    const data = await res.json();
    document.getElementById('ptValue').textContent = `₹${data.totalValue.toLocaleString('en-IN')}`;
    document.getElementById('ptRental').textContent = `₹${data.totalMonthlyRental.toLocaleString('en-IN')}`;
    document.getElementById('ptYield').textContent = `${data.averageYield}%`;
    const list = document.getElementById('holdingsList');
    list.innerHTML = data.holdings.map(h => `
      <div class="holding-item">
        <div class="hi-top">
          <span class="hi-name">${h.propertyName.split(' ').slice(0,3).join(' ')}</span>
          <span class="hi-tokens">${h.tokens} tokens</span>
        </div>
        <div class="hi-bottom">
          <span class="hi-value">₹${h.tokenValue.toLocaleString('en-IN')}</span>
          <span class="hi-rent">+₹${h.monthlyRental.toLocaleString('en-IN')}/mo</span>
          <span>${h.rentalYield}% yield</span>
        </div>
      </div>`).join('');
  } catch (e) { console.error(e); }
}

// ── Price Chart ───────────────────────────────────────────────────────────────
function populateChartSelect() {
  const sel = document.getElementById('chartPropSelect');
  sel.innerHTML = allProperties.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

function updateChart() {
  const id = document.getElementById('chartPropSelect').value;
  loadChart(id);
}

async function loadChart(propId) {
  const prop = allProperties.find(p => p.id === propId);
  if (!prop) return;

  const labels = prop.priceHistory.map(h => h.date);
  const data = prop.priceHistory.map(h => h.price);

  if (priceChart) priceChart.destroy();

  const ctx = document.getElementById('priceChart').getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 160);
  gradient.addColorStop(0, 'rgba(124,58,237,0.4)');
  gradient.addColorStop(1, 'rgba(124,58,237,0)');

  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Token Price (₹)',
        data,
        borderColor: '#9f67ff',
        backgroundColor: gradient,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#9f67ff',
        pointRadius: 3,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#1f2640' } },
        y: { ticks: { color: '#64748b', font: { size: 10 }, callback: v => '₹'+v }, grid: { color: '#1f2640' } }
      }
    }
  });

  // Load AI factors
  try {
    const res = await fetch(`${API}/ai/price/${propId}`);
    const ai = await res.json();
    const factorsEl = document.getElementById('aiFactors');
    factorsEl.innerHTML = Object.entries(ai.factors).map(([key, f]) => {
      const isPos = f.impact >= 0;
      const barW = Math.min(Math.abs(f.impact) / 5 * 100, 100);
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
      return `
        <div class="af-row">
          <span class="af-label">${f.label || label}</span>
          <div class="af-bar-wrap"><div class="af-bar ${isPos?'pos':'neg'}" style="width:${barW}%"></div></div>
          <span class="af-val ${isPos?'pos':'neg'}">${isPos?'+':''}${f.impact}%</span>
        </div>`;
    }).join('');
  } catch (e) { console.error(e); }
}

// ── ZK Proof ──────────────────────────────────────────────────────────────────
async function generateZKProof() {
  const type = document.getElementById('zkType').value;
  const threshold = parseInt(document.getElementById('zkThreshold').value) || 10000;
  const resultEl = document.getElementById('zkResult');
  resultEl.classList.remove('hidden');
  resultEl.innerHTML = '<span class="zk-spinner">⚙️</span> Generating ZK-SNARK proof on Polygon...';

  try {
    const res = await fetch(`${API}/zk/generate-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proofType: type, threshold })
    });
    const data = await res.json();
    resultEl.innerHTML = `
      ✅ <strong>Proof Verified!</strong><br/>
      ${data.message}<br/>
      <span class="zk-hash">Proof: ${data.proof}</span>
      <span class="zk-hash">VKey: ${data.verificationKey}</span>
      <small style="color:var(--text3)">Expires: ${new Date(data.expiresAt).toLocaleDateString('en-IN')}</small>
    `;
  } catch (e) {
    resultEl.innerHTML = '❌ ZK service unavailable';
  }
}

// ── DAO Proposals ─────────────────────────────────────────────────────────────
async function loadDAOProposals() {
  try {
    const res = await fetch(`${API}/dao/proposals`);
    const proposals = await res.json();
    document.getElementById('daoProposals').innerHTML = proposals.map(p => {
      const forPct = Math.round((p.votesFor / p.totalVotes) * 100);
      const statusClass = p.status === 'ACTIVE' ? 'dao-active' : 'dao-passed';
      return `
        <div class="dao-item">
          <div class="dao-title">${p.title}</div>
          <div class="dao-desc">${p.description}</div>
          <div class="dao-vote-bar">
            <div class="dao-vote-for" style="width:${forPct}%"></div>
            <div class="dao-vote-against" style="width:${100-forPct}%"></div>
          </div>
          <div class="dao-vote-stats">
            <span class="green">✅ For: ${p.votesFor.toLocaleString()}</span>
            <span class="red">❌ Against: ${p.votesAgainst.toLocaleString()}</span>
          </div>
          <span class="dao-status ${statusClass}">${p.status}</span>
          ${p.status === 'ACTIVE' ? '<br/><button class="btn-vote" onclick="castVote(this)">🗳 Vote For</button>' : ''}
        </div>`;
    }).join('');
  } catch (e) { console.error(e); }
}

function castVote(btn) {
  btn.textContent = '✅ Vote Cast!';
  btn.disabled = true;
  btn.style.color = 'var(--green)';
  btn.style.borderColor = 'var(--green)';
}

// ── Block Number Animator ─────────────────────────────────────────────────────
function animateBlockNumber() {
  const el = document.getElementById('blockNum');
  let n = parseInt(el.textContent.replace(/,/g, '')) + Math.floor(Math.random() * 3 + 1);
  el.textContent = n.toLocaleString('en-IN');
}
setInterval(animateBlockNumber, 5000);

// ── Flash animation (price tick) ─────────────────────────────────────────────
const flashStyle = document.createElement('style');
flashStyle.textContent = `.flash{color:#10b981!important;transition:color .6s}`;
document.head.appendChild(flashStyle);
