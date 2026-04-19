/**
 * PropFi India – Property Dataset Generator
 * Generates 1000+ realistic properties across 56 Indian cities
 * Run: node generate-properties.js
 */

const fs = require('fs');

// ── 56 Indian Cities with GPS + State + Tier ──────────────────────────────────
const CITIES = [
  { name:'Mumbai',        state:'Maharashtra',       lat:19.0760,  lng:72.8777,  tier:1, idx:'MUM' },
  { name:'Bengaluru',     state:'Karnataka',         lat:12.9716,  lng:77.5946,  tier:1, idx:'BLR' },
  { name:'Delhi',         state:'Delhi',             lat:28.7041,  lng:77.1025,  tier:1, idx:'DEL' },
  { name:'Hyderabad',     state:'Telangana',         lat:17.3850,  lng:78.4867,  tier:1, idx:'HYD' },
  { name:'Chennai',       state:'Tamil Nadu',        lat:13.0827,  lng:80.2707,  tier:1, idx:'CHN' },
  { name:'Pune',          state:'Maharashtra',       lat:18.5204,  lng:73.8567,  tier:1, idx:'PNQ' },
  { name:'Kolkata',       state:'West Bengal',       lat:22.5726,  lng:88.3639,  tier:1, idx:'CCU' },
  { name:'Ahmedabad',     state:'Gujarat',           lat:23.0225,  lng:72.5714,  tier:1, idx:'AMD' },
  { name:'Navi Mumbai',   state:'Maharashtra',       lat:19.0330,  lng:73.0297,  tier:1, idx:'NMB' },
  { name:'Noida',         state:'Uttar Pradesh',     lat:28.5355,  lng:77.3910,  tier:1, idx:'NOI' },
  { name:'Gurgaon',       state:'Haryana',           lat:28.4595,  lng:77.0266,  tier:1, idx:'GGN' },
  { name:'Thane',         state:'Maharashtra',       lat:19.2183,  lng:72.9781,  tier:2, idx:'TNE' },
  { name:'Jaipur',        state:'Rajasthan',         lat:26.9124,  lng:75.7873,  tier:2, idx:'JAI' },
  { name:'Surat',         state:'Gujarat',           lat:21.1702,  lng:72.8311,  tier:2, idx:'SRT' },
  { name:'Lucknow',       state:'Uttar Pradesh',     lat:26.8467,  lng:80.9462,  tier:2, idx:'LKO' },
  { name:'Nagpur',        state:'Maharashtra',       lat:21.1458,  lng:79.0882,  tier:2, idx:'NAG' },
  { name:'Indore',        state:'Madhya Pradesh',    lat:22.7196,  lng:75.8577,  tier:2, idx:'IDR' },
  { name:'Bhopal',        state:'Madhya Pradesh',    lat:23.2599,  lng:77.4126,  tier:2, idx:'BHO' },
  { name:'Visakhapatnam', state:'Andhra Pradesh',    lat:17.6868,  lng:83.2185,  tier:2, idx:'VIZ' },
  { name:'Nashik',        state:'Maharashtra',       lat:20.0059,  lng:73.7910,  tier:2, idx:'NSK' },
  { name:'Coimbatore',    state:'Tamil Nadu',        lat:11.0168,  lng:76.9558,  tier:2, idx:'CBE' },
  { name:'Vadodara',      state:'Gujarat',           lat:22.3072,  lng:73.1812,  tier:2, idx:'BRC' },
  { name:'Patna',         state:'Bihar',             lat:25.5941,  lng:85.1376,  tier:2, idx:'PAT' },
  { name:'Chandigarh',    state:'Punjab',            lat:30.7333,  lng:76.7794,  tier:2, idx:'IXC' },
  { name:'Kochi',         state:'Kerala',            lat:9.9312,   lng:76.2673,  tier:2, idx:'COK' },
  { name:'Agra',          state:'Uttar Pradesh',     lat:27.1767,  lng:78.0081,  tier:2, idx:'AGR' },
  { name:'Ludhiana',      state:'Punjab',            lat:30.9010,  lng:75.8573,  tier:2, idx:'LUH' },
  { name:'Mysuru',        state:'Karnataka',         lat:12.2958,  lng:76.6394,  tier:2, idx:'MYQ' },
  { name:'Rajkot',        state:'Gujarat',           lat:22.3039,  lng:70.8022,  tier:2, idx:'RAJ' },
  { name:'Varanasi',      state:'Uttar Pradesh',     lat:25.3176,  lng:82.9739,  tier:2, idx:'VNS' },
  { name:'Meerut',        state:'Uttar Pradesh',     lat:28.9845,  lng:77.7064,  tier:2, idx:'MRT' },
  { name:'Bhubaneswar',   state:'Odisha',            lat:20.2961,  lng:85.8245,  tier:2, idx:'BBI' },
  { name:'Thiruvananthapuram', state:'Kerala',       lat:8.5241,   lng:76.9366,  tier:2, idx:'TRV' },
  { name:'Ranchi',        state:'Jharkhand',         lat:23.3441,  lng:85.3096,  tier:2, idx:'IXR' },
  { name:'Guwahati',      state:'Assam',             lat:26.1445,  lng:91.7362,  tier:2, idx:'GAU' },
  { name:'Amritsar',      state:'Punjab',            lat:31.6340,  lng:74.8723,  tier:2, idx:'ATQ' },
  { name:'Jodhpur',       state:'Rajasthan',         lat:26.2389,  lng:73.0243,  tier:2, idx:'JDH' },
  { name:'Dehradun',      state:'Uttarakhand',       lat:30.3165,  lng:78.0322,  tier:2, idx:'DED' },
  { name:'Mangaluru',     state:'Karnataka',         lat:12.9141,  lng:74.8560,  tier:2, idx:'IXE' },
  { name:'Gandhinagar',   state:'Gujarat',           lat:23.2156,  lng:72.6369,  tier:2, idx:'GNR' },
  { name:'Wayanad',       state:'Kerala',            lat:11.6854,  lng:76.1320,  tier:3, idx:'WAY' },
  { name:'Dewas',         state:'Madhya Pradesh',    lat:22.9676,  lng:76.0534,  tier:3, idx:'DEW' },
  { name:'Hooghly',       state:'West Bengal',       lat:22.9003,  lng:88.3979,  tier:3, idx:'HOO' },
  { name:'Udaipur',       state:'Rajasthan',         lat:24.5854,  lng:73.7125,  tier:2, idx:'UDR' },
  { name:'Shimla',        state:'Himachal Pradesh',  lat:31.1048,  lng:77.1734,  tier:3, idx:'SLV' },
  { name:'Raipur',        state:'Chhattisgarh',      lat:21.2514,  lng:81.6296,  tier:2, idx:'RPR' },
  { name:'Aurangabad',    state:'Maharashtra',       lat:19.8762,  lng:75.3433,  tier:2, idx:'ADB' },
  { name:'Kannur',        state:'Kerala',            lat:11.8745,  lng:75.3704,  tier:3, idx:'CNN' },
  { name:'Vijayawada',    state:'Andhra Pradesh',    lat:16.5062,  lng:80.6480,  tier:2, idx:'VGA' },
  { name:'Tirupati',      state:'Andhra Pradesh',    lat:13.6288,  lng:79.4192,  tier:2, idx:'TIR' },
  { name:'Panaji',        state:'Goa',               lat:15.4909,  lng:73.8278,  tier:2, idx:'GOA' },
  { name:'Madurai',       state:'Tamil Nadu',        lat:9.9252,   lng:78.1198,  tier:2, idx:'IXM' },
  { name:'Faridabad',     state:'Haryana',           lat:28.4089,  lng:77.3178,  tier:2, idx:'FBD' },
  { name:'Srinagar',      state:'Jammu & Kashmir',   lat:34.0837,  lng:74.7973,  tier:3, idx:'SXR' },
  { name:'Nagercoil',     state:'Tamil Nadu',        lat:8.1780,   lng:77.4324,  tier:3, idx:'NGQ' },
  { name:'Hubli',         state:'Karnataka',         lat:15.3647,  lng:75.1240,  tier:3, idx:'HBX' },
];

// ── Property type templates ────────────────────────────────────────────────────
const TYPES = [
  'Residential Plot', 'Agricultural Land', 'Commercial Plot',
  'Industrial Plot', 'Apartment', 'Premium Apartment',
  'Luxury Apartment', 'Studio Apartment', 'Commercial Shop',
  'Commercial Office', 'Villa', 'Luxury Villa', 'Independent House',
  'Penthouse', 'Row House', 'Farmhouse',
];

const LAND_IMAGES = [
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
  'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&q=80',
  'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&q=80',
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80',
  'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80',
  'https://images.unsplash.com/photo-1448630360428-65456885c650?w=800&q=80',
];

const APT_IMAGES = [
  'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
  'https://images.unsplash.com/photo-1587555592517-1a5e8c7f1ad6?w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80',
  'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80',
];

const COMM_IMAGES = [
  'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
  'https://images.unsplash.com/photo-1587393836332-9a0fcafefeb6?w=800&q=80',
];

const FARM_IMAGES = [
  'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80',
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
];

// Micro-areas per city (realistic sub-locations)
const MICRO_AREAS = {
  'Mumbai':        ['Bandra','Andheri West','Powai','Worli','Juhu','Malad','Dahisar','Mulund','Kandivali','Borivali','Chembur','Kurla'],
  'Bengaluru':     ['Whitefield','Koramangala','HSR Layout','Indiranagar','Yelahanka','Sarjapur','Hebbal','Electronic City','JP Nagar','Bannerghatta'],
  'Delhi':         ['Vasant Kunj','Dwarka','Rohini','Saket','Preet Vihar','Lajpat Nagar','Defence Colony','Greater Kailash','Shahdara','Pitampura'],
  'Hyderabad':     ['Jubilee Hills','Gachibowli','Kondapur','Hitech City','Banjara Hills','Madhapur','Kokapet','Shamshabad','Kompally','LB Nagar'],
  'Chennai':       ['Anna Nagar','OMR','Adyar','T.Nagar','Velachery','Perambur','Tambaram','Sholinganallur','Porur','Ambattur'],
  'Pune':          ['Hinjewadi','Kharadi','Wakad','Baner','Hadapsar','Pimple Saudagar','Viman Nagar','Kalyani Nagar','Kondhwa','Nibm'],
  'Kolkata':       ['Salt Lake','New Town','Rajarhat','Garia','Behala','Alipore','Dum Dum','Baranagar','Jadavpur','Tollygunge'],
  'Ahmedabad':     ['SG Highway','Prahlad Nagar','Bopal','Thaltej','Gota','Naroda','Odhav','Vastrapur','Satellite','Chandkheda'],
  'Navi Mumbai':   ['Vashi','Nerul','Belapur','Kharghar','Panvel','Ulwe','Karanjade','Dronagiri','Taloja','Koperkhairane'],
  'Noida':         ['Sector 62','Sector 18','Sector 82','Sector 137','Greater Noida West','Techzone 4','Sector 150','Sector 128','Yamuna Expressway'],
  'Gurgaon':       ['DLF Cyber City','Golf Course Road','Sohna Road','Dwarka Expressway','MG Road','Sector 56','Sector 49','Manesar'],
  'Jaipur':        ['Vaishali Nagar','Malviya Nagar','Jagatpura','Sitapura','Mansarovar','C-Scheme','Bani Park','Sanganer'],
  'Surat':         ['Adajan','Vesu','Pal','Katargam','Varachha','Udhna','Althan','Bhatar'],
  'Lucknow':       ['Gomti Nagar','Hazratganj','Aliganj','Indira Nagar','Mahanagar','Alambagh','Vikas Nagar','Chinhat'],
  'default':       ['Sector A','Sector B','Phase 1','Phase 2','Extension','Ring Road','Highway Zone','City Centre'],
};

// Amenities by property type
const AMENITY_MAP = {
  'plot':   ['NA Conversion Done','Road Access','Clear Title','Boundary Wall','Water Connection'],
  'agri':   ['Bore Well','Canal Irrigation','7/12 Clear','Farm Road','Storage Shed'],
  'apt':    ['Gym','Swimming Pool','Parking','Security','Power Backup','Clubhouse','Play Area'],
  'luxury': ['Concierge','Home Theater','Private Pool','Smart Home','Rooftop Garden','EV Charging'],
  'comm':   ['24/7 Security','Cafeteria','Conference Rooms','Parking','Generator','Fire Safety'],
  'villa':  ['Private Garden','4-Car Garage','Servant Quarter','Solar Panels','Jacuzzi'],
};

// Price multipliers by tier and type
const BASE_PRICE = {
  'Residential Plot':   { 1: 2800, 2: 1200, 3: 600 },
  'Agricultural Land':  { 1:  800, 2:  450, 3: 220 },
  'Commercial Plot':    { 1: 6500, 2: 2800, 3: 1100 },
  'Industrial Plot':    { 1: 3500, 2: 1800, 3:  800 },
  'Apartment':          { 1: 1800, 2:  950, 3:  480 },
  'Premium Apartment':  { 1: 3500, 2: 1800, 3:  850 },
  'Luxury Apartment':   { 1: 7500, 2: 3200, 3: 1400 },
  'Studio Apartment':   { 1:  950, 2:  520, 3:  260 },
  'Commercial Shop':    { 1: 3200, 2: 1400, 3:  650 },
  'Commercial Office':  { 1:12000, 2: 5500, 3: 2200 },
  'Villa':              { 1: 5500, 2: 2600, 3: 1100 },
  'Luxury Villa':       { 1:15000, 2: 6500, 3: 2600 },
  'Independent House':  { 1: 2800, 2: 1300, 3:  600 },
  'Penthouse':          { 1:18000, 2: 9000, 3: 3500 },
  'Row House':          { 1: 3200, 2: 1500, 3:  700 },
  'Farmhouse':          { 1: 2200, 2: 1100, 3:  500 },
};

// Which types generate rental income
const RENTAL_TYPES = new Set(['Apartment','Premium Apartment','Luxury Apartment','Studio Apartment','Commercial Shop','Commercial Office','Luxury Villa','Villa','Penthouse','Row House','Independent House']);
const APPRECIATION_TYPES = new Set(['Residential Plot','Agricultural Land','Commercial Plot','Industrial Plot','Farmhouse']);

// Property name templates
const AREA_SLOGANS = {
  'Residential Plot':   ['Prime Plot','NA Plot','Corner Plot','Main Road Plot','TDR Plot','Vastu Plot'],
  'Agricultural Land':  ['Organic Farm','Vineyard Land','Paddy Field','Mango Orchard','Sugarcane Farm','Agri Plot'],
  'Commercial Plot':    ['Commercial Site','Business Plot','Corner Commercial','Mixed-Use Site','Approved Plot'],
  'Industrial Plot':    ['Industrial Site','MIDC Land','SEZ Plot','Warehouse Plot','Logistics Hub'],
  'Apartment':          ['2BHK Apartment','3BHK Flat','2.5BHK Home','3BHK Unit','2BHK Home'],
  'Premium Apartment':  ['Premium 3BHK','Duplex 3BHK','3BHK + Study','Premium 4BHK','Executive Suite'],
  'Luxury Apartment':   ['Luxury 4BHK','Sky Villa','Signature 3BHK','Elite Residence','Prestige Suite'],
  'Studio Apartment':   ['Studio Hotel Suite','Micro Studio','Studio Compact','1RK Studio','Work-Live Studio'],
  'Commercial Shop':    ['Ground Floor Shop','Retail Outlet','High Street Shop','Mall Shop','Corner Shop'],
  'Commercial Office':  ['IT Office Space','BPO Floor','Corp HQ Floor','Grade-A Office','Tech Campus'],
  'Villa':              ['4BHK Villa','Duplex Villa','Row Villa','Garden Villa','Pool Villa'],
  'Luxury Villa':       ['Luxury 5BHK Villa','Bungalow Estate','Palace Villa','Private Estate'],
  'Independent House':  ['Independent Bungalow','G+2 House','Corner House','Heritage House'],
  'Penthouse':          ['Sky Penthouse','Roof-top Suite','Duplex Penthouse','Crown Penthouse'],
  'Row House':          ['Row House Unit','Townhouse','Gated Row Home','Corner Row House'],
  'Farmhouse':          ['Weekend Farmhouse','Eco Farmhouse','Luxury Farmhouse','Organic Farm Villa'],
};

const LEGAL_STATUSES = ['Clear Title','RERA Registered','Patta Land','7/12 Clear','Freehold','Leasehold','DTCP Approved'];

// ── REAL INDIAN LAND CERTIFICATIONS ────────────────────────────────────────────
// Every property gets a realistic subset based on its type
const CERTIFICATIONS_RESIDENTIAL = [
  'RERA Registered',            // Real Estate Regulatory Authority
  'Encumbrance Certificate',    // EC from Sub-Registrar office
  'Sale Deed Registered',       // Registration Act 1908
  'Title Deed Verified',        // Title search clear
  'Mutation Certificate',       // Revenue records updated
  'Khata Certificate',          // Karnataka/municipal
  'Completion Certificate',     // From municipal corporation
  'Occupancy Certificate',      // OC from planning authority
  'Building Plan Approved',     // Approved by local planning
  'NOC - Fire Department',      // Fire safety clearance
  'NOC - Environment',          // Environmental clearance
  'Property Tax Paid',          // Latest tax receipt
];

const CERTIFICATIONS_LAND = [
  '7/12 Extract Clear',         // Maharashtra land record
  'Patta Transfer Done',        // Tamil Nadu / AP land record
  'Revenue Records Clear',      // Tahsildar office
  'NA Conversion Order',        // Non-Agricultural conversion
  'Land Use Certificate',       // From Town Planning dept
  'Encumbrance Certificate',    // EC from Sub-Registrar
  'Title Deed Verified',        // Full title investigation
  'Mutation Certificate',       // Name transfer in records
  'Soil Testing Report',        // For agricultural / construction
  'Survey Number Verified',     // Taluk office verification
  'Boundary Verification Done', // Physical survey
  'Stamp Duty Paid',            // Registration stamp
];

const CERTIFICATIONS_COMMERCIAL = [
  'RERA Registered',
  'DTCP Approved',              // Directorate of Town & Country Planning
  'BMRDA Approved',             // Bangalore Metropolitan Region Dev Authority
  'Commercial License',         // Municipal trade license
  'Fire Safety Certificate',    // Fire dept NOC
  'Structural Stability Certificate',
  'Encumbrance Certificate',
  'Completion Certificate',
  'Occupancy Certificate',
  'Property Tax Paid',
  'GST Registration',           // For commercial income
  'Insurance Verified',         // Building insurance
];

function getCertifications(type) {
  const isLand = APPRECIATION_TYPES.has(type);
  const isComm = type.includes('Commercial') || type.includes('Industrial');
  const pool = isLand ? CERTIFICATIONS_LAND :
               isComm ? CERTIFICATIONS_COMMERCIAL :
               CERTIFICATIONS_RESIDENTIAL;
  // 2 to 6 certifications per property (more = premium)
  const count = rndInt(2, 6);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Certification count affects price: each cert adds 1.5% to base price
function certPriceMultiplier(certCount) {
  return 1 + (certCount * 0.015);
}

function rnd(min, max) {
  return Math.random() * (max - min) + min;
}

function rndInt(min, max) {
  return Math.floor(rnd(min, max + 1));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function jitter(base, pct = 0.25) {
  return Math.round(base * (1 + (Math.random() - 0.5) * 2 * pct));
}

function genPriceHistory(finalPrice) {
  const history = [];
  const months = ['2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04'];
  let p = Math.round(finalPrice * rnd(0.78, 0.90));
  for (let m of months) {
    history.push({ date: m, price: p });
    p = Math.round(p * rnd(1.01, 1.04));
  }
  history[history.length - 1].price = finalPrice;
  return history;
}

function getImage(type) {
  if (APPRECIATION_TYPES.has(type)) {
    if (type === 'Agricultural Land' || type === 'Farmhouse') return pick(FARM_IMAGES);
    if (type.includes('Commercial') || type.includes('Industrial')) return pick(COMM_IMAGES);
    return pick(LAND_IMAGES);
  }
  if (type.includes('Commercial')) return pick(COMM_IMAGES);
  if (type.includes('Luxury') || type === 'Penthouse') return pick(APT_IMAGES.slice(4));
  return pick(APT_IMAGES);
}

function getAmenities(type) {
  if (type.includes('Agricultural') || type === 'Farmhouse') return pick(['agri','agri','plot']).split('').map(_ => null).filter(_ => _ !== null);
  if (type.includes('Agri') || type.includes('Farm')) {
    const base = [...AMENITY_MAP['agri']];
    return base.slice(0, rndInt(2, 4));
  }
  if (type.includes('Commercial')) return AMENITY_MAP['comm'].slice(0, rndInt(3, 5));
  if (type.includes('Luxury') || type === 'Penthouse') return [...AMENITY_MAP['apt'].slice(0,4), ...AMENITY_MAP['luxury'].slice(0,3)];
  if (type.includes('Villa')) return [...AMENITY_MAP['apt'].slice(0,3), ...AMENITY_MAP['villa'].slice(0,3)];
  if (type.includes('Plot') || type.includes('Industrial')) return AMENITY_MAP['plot'].slice(0, rndInt(2,4));
  return AMENITY_MAP['apt'].slice(0, rndInt(3, 6));
}

// ── MAIN GENERATION ─────────────────────────────────────────────────────────────
const properties = [];
let uid = 1;

// How many properties per city (aim for ~18-20 per city → ~1000-1100 total)
const PER_CITY = 19;

for (const city of CITIES) {
  const areas = MICRO_AREAS[city.name] || MICRO_AREAS['default'];
  const typesForCity = [...TYPES];
  // Tier 3 cities: exclude some high-end types
  const filteredTypes = city.tier === 3
    ? typesForCity.filter(t => !['Penthouse','Luxury Villa','Commercial Office','Industrial Plot'].includes(t))
    : typesForCity;

  for (let i = 0; i < PER_CITY; i++) {
    const type = pick(filteredTypes);
    const area = pick(areas);
    const basePriceMap = BASE_PRICE[type] || BASE_PRICE['Apartment'];
    const baseTokenPrice = jitter(basePriceMap[city.tier] || basePriceMap[2], 0.30);

    // Generate certifications for this property
    const certifications = getCertifications(type);
    // More certifications = higher price (each cert = +1.5%)
    const certMultiplier = certPriceMultiplier(certifications.length);
    const adjustedTokenPrice = Math.round(baseTokenPrice * certMultiplier);

    const totalValue = Math.round(adjustedTokenPrice * 10000 * rnd(0.8, 1.2));
    const totalTokens = 10000;
    const soldPct = rnd(0.05, 0.75);
    const availableTokens = Math.round(totalTokens * (1 - soldPct));
    const tokenHolders = Math.round(soldPct * totalTokens / rnd(3, 15));

    const isRental = RENTAL_TYPES.has(type);
    const isAppreciation = APPRECIATION_TYPES.has(type);
    const appreciationYield = isAppreciation ? parseFloat((rnd(6, 22)).toFixed(1)) : null;
    const rentalYield = isRental ? parseFloat((rnd(4.5, 12)).toFixed(1)) : 0;
    const monthlyRent = isRental ? Math.round((totalValue * rentalYield / 100) / 12) : 0;
    const leaseIncome = isAppreciation && rnd(0,1) > 0.5 ? Math.round(totalValue * rnd(0.01, 0.04) / 12) : 0;

    const riskScore = Math.min(95, Math.round(
      55 + (city.tier === 1 ? 20 : city.tier === 2 ? 10 : 0) + rnd(-10, 15)
    ));

    const aiGrowth = isRental ? rnd(4, 12) : rnd(8, 22);
    const aiPrediction = `+${aiGrowth.toFixed(1)}%`;
    const confidence = parseFloat((rnd(0.72, 0.97)).toFixed(2));

    // GPS with small scatter around city centre
    const lat = parseFloat((city.lat + rnd(-0.08, 0.08)).toFixed(6));
    const lng = parseFloat((city.lng + rnd(-0.08, 0.08)).toFixed(6));

    const nameSuffix = pick(AREA_SLOGANS[type] || ['Property']);
    const name = `${area} ${nameSuffix}`;
    const id = `prop_${String(uid).padStart(4, '0')}`;

    // Size fields
    let sqft = null, plotSqYards = null, plotAcres = null, bedrooms = null, bathrooms = null;
    if (type.includes('Plot')) plotSqYards = rndInt(100, 2000);
    else if (type === 'Agricultural Land' || type === 'Farmhouse') plotAcres = parseFloat((rnd(0.5, 20)).toFixed(2));
    else if (type === 'Industrial Plot') plotSqYards = rndInt(500, 5000);
    else {
      sqft = rndInt(350, 5500);
      if (type.includes('Studio')) { bedrooms = 1; bathrooms = 1; }
      else if (type.includes('Villa') || type === 'Penthouse') { bedrooms = rndInt(4, 6); bathrooms = rndInt(4, 6); }
      else if (type.includes('4BHK') || type.includes('Luxury')) { bedrooms = 4; bathrooms = 4; }
      else { bedrooms = rndInt(2, 3); bathrooms = rndInt(2, 3); }
    }

    const nearbyDevelopments = [
      `${city.name} ${pick(['Metro','Highway','IT Park','Expressway','Airport','Mall','Hospital','University'])}`,
      `${area} ${pick(['Road widening','Smart City Project','Industrial Zone','SEZ Development'])}`
    ];

    properties.push({
      id,
      name,
      address: `${rndInt(1, 999)}, ${area}, ${city.name}`,
      area: `${area}, ${city.name}`,
      city: city.name,
      state: city.state,
      location: { lat, lng },
      type,
      landCategory: isAppreciation ? pick(['NA Plot','Agricultural Zone','Industrial Zone','Commercial Zone']) : null,
      zoning: isAppreciation ? type.replace(' Plot','').replace(' Land','') : null,
      plotSqYards,
      plotAcres,
      bedrooms,
      bathrooms,
      sqft,
      floor: (!isAppreciation && sqft) ? rndInt(1, 28) : null,
      totalFloors: (!isAppreciation && sqft) ? rndInt(3, 40) : null,
      age: (!isAppreciation && sqft) ? rndInt(0, 20) : null,
      totalValue,
      tokenPrice: adjustedTokenPrice,
      totalTokens,
      availableTokens,
      rentalYield,
      appreciationYield,
      monthlyRent,
      leaseIncome,
      riskScore,
      aiPrediction,
      aiPredictionPeriod: isRental ? '6 months' : '12 months',
      confidence,
      image: getImage(type),
      amenities: getAmenities(type),
      legalStatus: pick(LEGAL_STATUSES),
      registryStatus: 'Registered',
      certifications,
      certificationCount: certifications.length,
      governmentGuidanceValue: Math.round(totalValue * rnd(0.65, 0.85)),
      distanceToMetro: parseFloat((rnd(0.1, 8)).toFixed(1)),
      distanceToAirport: parseFloat((rnd(3, 55)).toFixed(1)),
      nearbyDevelopments,
      priceHistory: genPriceHistory(baseTokenPrice),
      verified: Math.random() > 0.05,
      tokenHolders,
      status: 'active',
      isLand: isAppreciation,
      cityTier: city.tier,
      symbolIndex: `${city.idx}-${String(i + 1).padStart(2,'0')}`,
    });

    uid++;
  }
}

// Write output
const outPath = './data/properties.json';
fs.writeFileSync(outPath, JSON.stringify(properties, null, 2));
console.log(`✅ Generated ${properties.length} properties across ${CITIES.length} cities → ${outPath}`);

// Stats
const byCityCount = {};
properties.forEach(p => { byCityCount[p.city] = (byCityCount[p.city] || 0) + 1; });
console.log('📊 Properties per city:');
Object.entries(byCityCount).forEach(([c, n]) => console.log(`  ${c}: ${n}`));
