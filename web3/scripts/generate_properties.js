/**
 * PropFi India — Comprehensive Property Data Generator
 *
 * Generates 1000+ real estate listings across ALL of India:
 *   - 28 States + 8 Union Territories (36 total)
 *   - Every major city, district headquarters, town, and village cluster
 *   - Property types: Residential, Commercial, Agricultural, Industrial, Mixed, Plot
 *
 * Run: node scripts/generate_properties.js
 * Output: export/property_data.json
 */

const fs = require("fs");
const path = require("path");

// ============================================================
// INDIA MASTER LOCATION DATABASE
// All 36 States/UTs with districts and key localities
// ============================================================
const INDIA_LOCATIONS = [
  {
    state: "Andhra Pradesh",
    region: "South India",
    tier1Cities: ["Visakhapatnam", "Vijayawada"],
    tier2Cities: ["Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kakinada", "Kadapa", "Anantapur"],
    towns: ["Ongole", "Eluru", "Nandyal", "Chittoor", "Bhimavaram", "Tenali", "Proddatur", "Machilipatnam", "Adoni", "Hindupur"],
    villages: ["Markapur", "Narasaraopet", "Tadepalligudem", "Palakol", "Bobbili", "Srikalahasti"],
    priceMultiplier: 0.85,
  },
  {
    state: "Arunachal Pradesh",
    region: "Northeast India",
    tier1Cities: ["Itanagar"],
    tier2Cities: ["Naharlagun", "Pasighat", "Tezpur"],
    towns: ["Ziro", "Along", "Bomdila", "Tezu", "Aalo", "Changlang"],
    villages: ["Daporijo", "Anini", "Hawai", "Mechuka"],
    priceMultiplier: 0.5,
  },
  {
    state: "Assam",
    region: "Northeast India",
    tier1Cities: ["Guwahati", "Dibrugarh"],
    tier2Cities: ["Silchar", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon"],
    towns: ["Goalpara", "Barpeta", "Sivasagar", "Diphu", "North Lakhimpur", "Karimganj", "Haflong"],
    villages: ["Majuli", "Sualkuchi", "Hailakandi", "Morigaon", "Golaghat"],
    priceMultiplier: 0.6,
  },
  {
    state: "Bihar",
    region: "East India",
    tier1Cities: ["Patna"],
    tier2Cities: ["Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia", "Bihar Sharif"],
    towns: ["Arrah", "Begusarai", "Katihar", "Munger", "Chhapra", "Hajipur", "Saharsa", "Sitamarhi"],
    villages: ["Bodh Gaya", "Rajgir", "Nalanda", "Vaishali", "Buxar", "Bettiah"],
    priceMultiplier: 0.55,
  },
  {
    state: "Chhattisgarh",
    region: "Central India",
    tier1Cities: ["Raipur"],
    tier2Cities: ["Bhilai", "Bilaspur", "Durg", "Korba"],
    towns: ["Rajnandgaon", "Jagdalpur", "Raigarh", "Ambikapur", "Dhamtari"],
    villages: ["Bemetara", "Kawardha", "Kondagaon", "Sukma", "Narayanpur"],
    priceMultiplier: 0.6,
  },
  {
    state: "Goa",
    region: "West India",
    tier1Cities: ["Panaji", "Margao"],
    tier2Cities: ["Vasco da Gama", "Mapusa", "Ponda"],
    towns: ["Calangute", "Candolim", "Vagator", "Anjuna", "Colva", "Morjim"],
    villages: ["Assagao", "Saligao", "Loutolim", "Moira", "Siolim", "Pernem"],
    priceMultiplier: 1.8,
  },
  {
    state: "Gujarat",
    region: "West India",
    tier1Cities: ["Ahmedabad", "Surat"],
    tier2Cities: ["Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Junagadh", "Anand"],
    towns: ["Navsari", "Morbi", "Surendranagar", "Bharuch", "Valsad", "Amreli", "Godhra", "Nadiad"],
    villages: ["Dhoraji", "Veraval", "Porbandar", "Diu", "Mandvi", "Dwarka", "Somnath"],
    priceMultiplier: 0.9,
  },
  {
    state: "Haryana",
    region: "North India",
    tier1Cities: ["Gurugram", "Faridabad"],
    tier2Cities: ["Hisar", "Rohtak", "Panipat", "Ambala", "Karnal", "Sonipat", "Yamunanagar"],
    towns: ["Rewari", "Bhiwani", "Sirsa", "Jhajjar", "Kaithal", "Kurukshetra", "Palwal"],
    villages: ["Manesar", "Bahadurgarh", "Panchkula", "Nuh", "Mewat", "Ballabhgarh"],
    priceMultiplier: 1.1,
  },
  {
    state: "Himachal Pradesh",
    region: "North India",
    tier1Cities: ["Shimla", "Dharamsala"],
    tier2Cities: ["Manali", "Solan", "Mandi", "Kullu"],
    towns: ["Baddi", "Nahan", "Palampur", "Bilaspur", "Hamirpur", "Una", "Chamba"],
    villages: ["Kasol", "Kufri", "Malana", "Spiti", "Kalpa", "Sangla", "Dalhousie"],
    priceMultiplier: 0.95,
  },
  {
    state: "Jharkhand",
    region: "East India",
    tier1Cities: ["Ranchi", "Jamshedpur"],
    tier2Cities: ["Dhanbad", "Bokaro", "Deoghar", "Hazaribagh"],
    towns: ["Giridih", "Ramgarh", "Dumka", "Phusro", "Chirkunda"],
    villages: ["Pakur", "Godda", "Lohardaga", "Khunti", "Simdega"],
    priceMultiplier: 0.65,
  },
  {
    state: "Karnataka",
    region: "South India",
    tier1Cities: ["Bangalore", "Mysuru"],
    tier2Cities: ["Hubli-Dharwad", "Mangaluru", "Belgaum", "Gulbarga", "Davangere", "Bellary", "Shimoga"],
    towns: ["Tumkur", "Raichur", "Bijapur", "Hassan", "Udupi", "Hospet", "Gadag", "Bagalkot"],
    villages: ["Chikmagalur", "Madikeri", "Sullia", "Sringeri", "Tirthahalli", "Agumbe"],
    priceMultiplier: 1.1,
  },
  {
    state: "Kerala",
    region: "South India",
    tier1Cities: ["Kochi", "Thiruvananthapuram"],
    tier2Cities: ["Kozhikode", "Thrissur", "Kollam", "Kannur", "Alappuzha", "Palakkad"],
    towns: ["Malappuram", "Kottayam", "Kasaragod", "Pathanamthitta", "Idukki", "Wayanad"],
    villages: ["Munnar", "Vagamon", "Thekkady", "Varkala", "Kovalam", "Kumbalangi"],
    priceMultiplier: 1.0,
  },
  {
    state: "Madhya Pradesh",
    region: "Central India",
    tier1Cities: ["Indore", "Bhopal"],
    tier2Cities: ["Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna"],
    towns: ["Rewa", "Ratlam", "Murwara", "Chhindwara", "Shivpuri", "Vidisha", "Hoshangabad"],
    villages: ["Khajuraho", "Orchha", "Panna", "Mandla", "Balaghat", "Betul"],
    priceMultiplier: 0.7,
  },
  {
    state: "Maharashtra",
    region: "West India",
    tier1Cities: ["Mumbai", "Pune"],
    tier2Cities: ["Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Navi Mumbai", "Amravati"],
    towns: ["Latur", "Sangli", "Malegaon", "Jalgaon", "Akola", "Nanded", "Osmanabad", "Ratnagiri"],
    villages: ["Lonavala", "Mahabaleshwar", "Alibaug", "Matheran", "Palghar", "Karjat"],
    priceMultiplier: 1.4,
  },
  {
    state: "Manipur",
    region: "Northeast India",
    tier1Cities: ["Imphal"],
    tier2Cities: ["Thoubal", "Bishnupur"],
    towns: ["Churachandpur", "Ukhrul", "Senapati", "Jiribam"],
    villages: ["Moreh", "Chandel", "Kangpokpi", "Noney"],
    priceMultiplier: 0.45,
  },
  {
    state: "Meghalaya",
    region: "Northeast India",
    tier1Cities: ["Shillong"],
    tier2Cities: ["Tura", "Nongpoh"],
    towns: ["Jowai", "Baghmara", "Nongstoin", "Williamnagar"],
    villages: ["Cherrapunji", "Mawsynram", "Dawki", "Mawlynnong"],
    priceMultiplier: 0.55,
  },
  {
    state: "Mizoram",
    region: "Northeast India",
    tier1Cities: ["Aizawl"],
    tier2Cities: ["Lunglei"],
    towns: ["Champhai", "Kolasib", "Mamit", "Saiha"],
    villages: ["Serchhip", "Lawngtlai", "Hnahthial"],
    priceMultiplier: 0.45,
  },
  {
    state: "Nagaland",
    region: "Northeast India",
    tier1Cities: ["Kohima", "Dimapur"],
    tier2Cities: ["Mokokchung"],
    towns: ["Wokha", "Zunheboto", "Tuensang", "Mon"],
    villages: ["Phek", "Kiphire", "Longleng", "Peren"],
    priceMultiplier: 0.5,
  },
  {
    state: "Odisha",
    region: "East India",
    tier1Cities: ["Bhubaneswar", "Cuttack"],
    tier2Cities: ["Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore"],
    towns: ["Baripada", "Bhadrak", "Jeypore", "Paradip", "Jharsuguda", "Rayagada"],
    villages: ["Konark", "Gopalpur", "Kendrapara", "Dhenkanal", "Angul", "Phulbani"],
    priceMultiplier: 0.65,
  },
  {
    state: "Punjab",
    region: "North India",
    tier1Cities: ["Ludhiana", "Amritsar"],
    tier2Cities: ["Jalandhar", "Patiala", "Bathinda", "Pathankot", "Hoshiarpur"],
    towns: ["Mohali", "Moga", "Fazilka", "Kapurthala", "Gurdaspur", "Sangrur"],
    villages: ["Anandpur Sahib", "Fatehgarh Sahib", "Ropar", "Nawanshahr", "Barnala"],
    priceMultiplier: 0.9,
  },
  {
    state: "Rajasthan",
    region: "North India",
    tier1Cities: ["Jaipur", "Jodhpur"],
    tier2Cities: ["Kota", "Bikaner", "Ajmer", "Udaipur", "Alwar", "Bharatpur", "Sikar"],
    towns: ["Pali", "Sri Ganganagar", "Bhilwara", "Barmer", "Jaisalmer", "Chittorgarh", "Hanumangarh"],
    villages: ["Pushkar", "Nathdwara", "Sambhar", "Kuchaman", "Nagaur", "Tonk", "Bundi"],
    priceMultiplier: 0.85,
  },
  {
    state: "Sikkim",
    region: "Northeast India",
    tier1Cities: ["Gangtok"],
    tier2Cities: ["Namchi"],
    towns: ["Gyalshing", "Mangan", "Jorethang"],
    villages: ["Ravangla", "Pelling", "Yuksom", "Lachen", "Lachung"],
    priceMultiplier: 0.7,
  },
  {
    state: "Tamil Nadu",
    region: "South India",
    tier1Cities: ["Chennai", "Coimbatore"],
    tier2Cities: ["Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Vellore", "Erode", "Tiruppur"],
    towns: ["Dindigul", "Thoothukudi", "Thanjavur", "Tiruvannamalai", "Kancheepuram", "Cuddalore", "Hosur"],
    villages: ["Ooty", "Kodaikanal", "Yelagiri", "Yercaud", "Rameswaram", "Kumbakonam"],
    priceMultiplier: 1.0,
  },
  {
    state: "Telangana",
    region: "South India",
    tier1Cities: ["Hyderabad", "Warangal"],
    tier2Cities: ["Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahbubnagar"],
    towns: ["Nalgonda", "Adilabad", "Suryapet", "Miryalaguda", "Jangaon", "Siddipet"],
    villages: ["Medak", "Sangareddy", "Zaheerabad", "Narayanpet", "Bhongir", "Yadadri"],
    priceMultiplier: 0.95,
  },
  {
    state: "Tripura",
    region: "Northeast India",
    tier1Cities: ["Agartala"],
    tier2Cities: ["Dharmanagar"],
    towns: ["Udaipur", "Kailashahar", "Belonia", "Sabroom"],
    villages: ["Khowai", "Sonamura", "Ambassa", "Teliamura"],
    priceMultiplier: 0.45,
  },
  {
    state: "Uttar Pradesh",
    region: "North India",
    tier1Cities: ["Lucknow", "Kanpur"],
    tier2Cities: ["Agra", "Varanasi", "Prayagraj", "Meerut", "Ghaziabad", "Noida", "Aligarh", "Bareilly"],
    towns: ["Moradabad", "Saharanpur", "Gorakhpur", "Mathura", "Firozabad", "Rampur", "Shahjahanpur", "Muzaffarnagar"],
    villages: ["Vrindavan", "Ayodhya", "Bijnor", "Etah", "Mainpuri", "Ballia", "Azamgarh"],
    priceMultiplier: 0.75,
  },
  {
    state: "Uttarakhand",
    region: "North India",
    tier1Cities: ["Dehradun", "Haridwar"],
    tier2Cities: ["Rishikesh", "Haldwani", "Roorkee", "Kashipur"],
    towns: ["Almora", "Nainital", "Mussoorie", "Rudrapur", "Pithoragarh"],
    villages: ["Auli", "Chakrata", "Lansdowne", "Munsiyari", "Chopta", "Tehri"],
    priceMultiplier: 0.85,
  },
  {
    state: "West Bengal",
    region: "East India",
    tier1Cities: ["Kolkata", "Howrah"],
    tier2Cities: ["Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Barasat"],
    towns: ["Kharagpur", "Haldia", "Darjeeling", "Jalpaiguri", "Cooch Behar", "Raiganj"],
    villages: ["Bishnupur", "Murshidabad", "Shantiniketan", "Digha", "Mandarmani", "Bakkhali"],
    priceMultiplier: 0.8,
  },
  // Union Territories
  {
    state: "Delhi",
    region: "North India",
    tier1Cities: ["New Delhi", "Central Delhi"],
    tier2Cities: ["Dwarka", "Rohini", "Janakpuri", "Lajpat Nagar", "Saket", "Noida Extension"],
    towns: ["Najafgarh", "Narela", "Bawana", "Mundka", "Badarpur"],
    villages: ["Gadaipur", "Alipur", "Kapashera", "Ghitorni", "Mehrauli"],
    priceMultiplier: 2.0,
  },
  {
    state: "Jammu and Kashmir",
    region: "North India",
    tier1Cities: ["Srinagar", "Jammu"],
    tier2Cities: ["Anantnag", "Baramulla", "Sopore", "Udhampur"],
    towns: ["Pulwama", "Shopian", "Kulgam", "Rajouri", "Poonch"],
    villages: ["Pahalgam", "Gulmarg", "Sonamarg", "Patnitop", "Katra"],
    priceMultiplier: 0.7,
  },
  {
    state: "Ladakh",
    region: "North India",
    tier1Cities: ["Leh"],
    tier2Cities: ["Kargil"],
    towns: ["Nubra", "Zanskar"],
    villages: ["Pangong", "Turtuk", "Hanle", "Dah"],
    priceMultiplier: 0.55,
  },
  {
    state: "Chandigarh",
    region: "North India",
    tier1Cities: ["Chandigarh"],
    tier2Cities: ["Sector 17", "Sector 35"],
    towns: ["Sector 43", "Industrial Area", "Manimajra"],
    villages: ["Daria", "Khuda Ali Sher", "Hallomajra"],
    priceMultiplier: 1.3,
  },
  {
    state: "Puducherry",
    region: "South India",
    tier1Cities: ["Pondicherry"],
    tier2Cities: ["Karaikal", "Mahe"],
    towns: ["Yanam", "Ariyankuppam", "Oulgaret"],
    villages: ["Villianur", "Bahour", "Mannadipet"],
    priceMultiplier: 0.9,
  },
  {
    state: "Andaman and Nicobar Islands",
    region: "Island",
    tier1Cities: ["Port Blair"],
    tier2Cities: ["Neil Island", "Havelock Island"],
    towns: ["Car Nicobar", "Rangat", "Mayabunder"],
    villages: ["Diglipur", "Long Island", "Wandoor", "Corbyn Cove"],
    priceMultiplier: 1.2,
  },
  {
    state: "Lakshadweep",
    region: "Island",
    tier1Cities: ["Kavaratti"],
    tier2Cities: ["Agatti", "Minicoy"],
    towns: ["Andrott", "Kalpeni", "Amini"],
    villages: ["Bangaram", "Kadmat", "Kiltan"],
    priceMultiplier: 1.5,
  },
  {
    state: "Dadra and Nagar Haveli and Daman and Diu",
    region: "West India",
    tier1Cities: ["Daman", "Silvassa"],
    tier2Cities: ["Diu"],
    towns: ["Naroli", "Khanvel"],
    villages: ["Dadra", "Samarvarni", "Athal"],
    priceMultiplier: 0.8,
  },
];

// ============================================================
// PROPERTY TYPE TEMPLATES BY LOCATION TIER
// ============================================================
const PROPERTY_TYPES_BY_TIER = {
  tier1: [
    { type: "Commercial", names: ["Tech Park", "Business Hub", "Corporate Tower", "IT Park", "Cyber Hub", "Business Park", "Office Complex", "SEZ Block"] },
    { type: "Residential", names: ["Heights", "Towers", "Residency", "Apartments", "Enclave", "Society", "Suites", "Prestige"] },
    { type: "Mixed", names: ["Mall", "City Center", "Lifestyle Hub", "Retail Complex", "Town Square", "Commercial Plaza"] },
    { type: "Industrial", names: ["Industrial Estate", "Warehouse Hub", "Logistics Park", "Manufacturing Zone", "Industrial Plot"] },
  ],
  tier2: [
    { type: "Commercial", names: ["Business Center", "Office Park", "Commercial Complex", "Trade Center"] },
    { type: "Residential", names: ["Colony", "Nagar", "Vihar", "Residency", "Apartments", "Housing Society"] },
    { type: "Agricultural", names: ["Farm Land", "Plantation", "Orchard Estate", "Agricultural Plot"] },
    { type: "Plot", names: ["Residential Plot", "NA Plot", "Development Site", "Approved Layout"] },
  ],
  towns: [
    { type: "Residential", names: ["Housing Colony", "Government Quarter", "Labor Colony", "Township"] },
    { type: "Agricultural", names: ["Farm Plot", "Arable Land", "Field", "Khet", "Zameen"] },
    { type: "Commercial", names: ["Market Complex", "Shop Row", "Bazaar Block", "Commercial Strip"] },
    { type: "Plot", names: ["Site", "Plot", "Gunta Land", "Residential Site"] },
  ],
  villages: [
    { type: "Agricultural", names: ["Khet", "Farm Land", "Gaon Land", "Rural Plot", "Shetkari Bhumi"] },
    { type: "Residential", names: ["Village House", "Rural Home", "Gram Panchayat Plot", "Village Plot"] },
    { type: "Plot", names: ["Open Land", "Khata Plot", "Survey Plot", "Revenue Land"] },
  ],
};

// Base price ranges in USDC per token per property type
const PRICE_RANGES = {
  tier1: { Commercial: [100, 500], Residential: [80, 400], Mixed: [120, 600], Industrial: [60, 250] },
  tier2: { Commercial: [40, 150], Residential: [30, 120], Agricultural: [10, 50], Plot: [20, 100] },
  towns: { Residential: [15, 60], Agricultural: [5, 30], Commercial: [20, 70], Plot: [10, 40] },
  villages: { Agricultural: [3, 20], Residential: [8, 35], Plot: [5, 25] },
};

const TOKEN_COUNT_RANGES = {
  tier1: [500, 5000],
  tier2: [300, 2000],
  towns: [200, 1000],
  villages: [100, 500],
};

// Suffixes and prefixes to diversify property names
const SUFFIXES = ["Phase 1", "Phase 2", "Phase 3", "Block A", "Block B", "Block C", "Unit 1", "Tower 1", "Tower 2", "Wing A", "Wing B", "Extension", "Annexe", "North", "South", "East", "West", ""];
const PREFIXES = ["Shree", "Sai", "Royal", "Grand", "Prime", "Elite", "Green", "Blue", "Golden", "Silver", "New", "Modern", "Classic", "Heritage", "Smart", "Eco", ""];

let propertyId = 0;
const properties = [];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makePropertyName(locationName, tier, typeObj) {
  const prefix = Math.random() > 0.5 ? pickRandom(PREFIXES) : "";
  const suffix = Math.random() > 0.4 ? pickRandom(SUFFIXES) : "";
  const baseName = pickRandom(typeObj.names);
  const parts = [prefix, locationName, baseName, suffix].filter(Boolean);
  return parts.join(" ");
}

function makeProperty(state, region, location, area, tier, priceMultiplier) {
  const tierData = PROPERTY_TYPES_BY_TIER[tier];
  const typeObj = pickRandom(tierData);
  const pType = typeObj.type;

  const priceRange = PRICE_RANGES[tier][pType] || [10, 100];
  const tokenRange = TOKEN_COUNT_RANGES[tier];

  const basePrice = randFloat(priceRange[0], priceRange[1]);
  const adjustedPrice = Math.max(1, Math.round(basePrice * priceMultiplier));
  const totalTokens = randInt(tokenRange[0], tokenRange[1]);
  const rentYield = randFloat(5.0, 14.0);

  propertyId++;

  return {
    id: propertyId,
    name: makePropertyName(location, tier, typeObj),
    area: area || location,
    city: location,
    state,
    region,
    propertyType: pType,
    pricePerToken: adjustedPrice,
    totalTokens,
    expectedAnnualRentYield: rentYield,
    imageUrl: `https://images.unsplash.com/photo-${pickRandom(UNSPLASH_PROPERTY_IDS)}?w=800&auto=format`,
    description: buildDescription(pType, location, state),
    amenities: buildAmenities(pType, tier),
    completionYear: randInt(2018, 2025),
    tier,
  };
}

const UNSPLASH_PROPERTY_IDS = [
  "1486325212027-8081e485255e",
  "1545324418-cc1a3fa10c00",
  "1497366216548-37526070297c",
  "1486406146926-c627a92ad1ab",
  "1577086664693-894d8405334a",
  "1560448204-e02f11c3d0e2",
  "1565372195458-9de0b320ef04",
  "1498050108023-c5249f4df085",
  "1512453979798-5ea266f8880c",
  "1590650153855-d9e808231d41",
  "1464082354059-adeef8cfd17e",
  "1448630360928-25571a24f9bb",
  "1523217582562-09d05ab20d24",
  "1460317442991-0ec209397118",
  "1558618666-fcd25c85cd64",
  "1493246507139-7e1f3b4600b4",
  "1585771724684-38269d6639fd",
  "1600596542815-ffad4c1539a9",
  "1600566753376-12c8ab7fb75b",
  "1600585154340-be6161a56a0c",
];

function buildDescription(pType, city, state) {
  const descs = {
    Commercial: [
      `Premium Grade-A office space in the heart of ${city}, ${state}. Strong demand from IT and BFSI sectors.`,
      `Strategic commercial development in ${city}'s growing business district. Excellent connectivity and infrastructure.`,
      `Modern commercial complex in ${state}'s emerging economic hub — ${city}. High occupancy rates expected.`,
    ],
    Residential: [
      `Quality residential development in a prime ${city} locality. Modern amenities with excellent connectivity.`,
      `Thoughtfully designed homes in ${city}, ${state}. Ideal for families seeking value and comfort.`,
      `Gated community offering premium living standards in ${city}. Green spaces and top-class amenities.`,
    ],
    Agricultural: [
      `Fertile agricultural land in ${city} district, ${state}. Ideal for farming or long-term investment.`,
      `Revenue-generating farm land near ${city}. Water access and soil quality verified. High appreciation potential.`,
      `Prime agricultural plot in ${state}'s agricultural belt. Excellent rainfall and irrigation support.`,
    ],
    Industrial: [
      `Industrial estate near ${city} with excellent logistics and warehouse potential.`,
      `Strategic industrial plot in ${state}'s manufacturing corridor — ${city}.`,
    ],
    Mixed: [
      `Vibrant mixed-use development combining retail, office and residential components in ${city}.`,
      `Integrated lifestyle destination in ${city}'s prime corridor. Retail + residential synergy.`,
    ],
    Plot: [
      `Approved residential/NA plot in ${city} with clear title. High appreciation potential.`,
      `Well-located development plot in ${city}, ${state} — ready for construction.`,
    ],
  };
  const pool = descs[pType] || descs["Commercial"];
  return pickRandom(pool);
}

function buildAmenities(pType, tier) {
  const all = {
    Commercial: ["24/7 Security", "Power Backup", "High-Speed Internet", "Cafeteria", "Conference Rooms", "Car Parking", "CCTV"],
    Residential: ["Swimming Pool", "Gymnasium", "Children's Play Area", "Clubhouse", "24/7 Security", "Car Parking", "Power Backup", "Lift"],
    Agricultural: ["Water Access", "Irrigation Facility", "Road Access", "Clear Title"],
    Industrial: ["Heavy Power Supply", "Truck Dock", "Industrial Water", "Fiber Connectivity", "24/7 Operations"],
    Mixed: ["Food Court", "Retail Stores", "Multiplex", "Parking", "Metro Connectivity"],
    Plot: ["Road Access", "Electricity Connection", "Water Connection", "Approved Layout", "Clear Title"],
  };
  const pool = all[pType] || all["Commercial"];
  const count = tier === "tier1" ? 5 : tier === "tier2" ? 4 : 3;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// ============================================================
// GENERATE PROPERTIES FOR EVERY LOCATION IN INDIA
// ============================================================
console.log("🏗️  Generating comprehensive India property dataset...\n");

for (const loc of INDIA_LOCATIONS) {
  const { state, region, tier1Cities, tier2Cities, towns, villages, priceMultiplier } = loc;

  // Tier 1 Cities — 6-10 properties each (commercial, residential, industrial)
  for (const city of tier1Cities) {
    const count = randInt(6, 10);
    for (let i = 0; i < count; i++) {
      properties.push(makeProperty(state, region, city, city, "tier1", priceMultiplier));
    }
  }

  // Tier 2 Cities — 4-6 properties each
  for (const city of tier2Cities) {
    const count = randInt(4, 6);
    for (let i = 0; i < count; i++) {
      properties.push(makeProperty(state, region, city, city, "tier2", priceMultiplier));
    }
  }

  // Towns — 2-4 properties each
  for (const town of towns) {
    const count = randInt(2, 4);
    for (let i = 0; i < count; i++) {
      properties.push(makeProperty(state, region, town, town, "towns", priceMultiplier));
    }
  }

  // Villages — 1-2 properties each (mostly agricultural)
  for (const village of villages) {
    const count = randInt(1, 2);
    for (let i = 0; i < count; i++) {
      properties.push(makeProperty(state, region, village, village, "villages", priceMultiplier));
    }
  }

  console.log(`  ✅ ${state}: ${properties.filter(p => p.state === state).length} properties`);
}

// ============================================================
// SUMMARY STATS
// ============================================================
const totalProperties = properties.length;
const statesCount = [...new Set(properties.map(p => p.state))].length;
const citiesCount = [...new Set(properties.map(p => p.city))].length;
const typeBreakdown = properties.reduce((acc, p) => {
  acc[p.propertyType] = (acc[p.propertyType] || 0) + 1;
  return acc;
}, {});

console.log(`\n🎉 Generated ${totalProperties} properties`);
console.log(`📍 Covering ${statesCount} states/UTs, ${citiesCount} cities/towns/villages`);
console.log("📊 Property Type Breakdown:", JSON.stringify(typeBreakdown, null, 2));

// ============================================================
// WRITE OUTPUT
// ============================================================
const output = {
  version: "2.0.0",
  generatedAt: new Date().toISOString(),
  description: "PropFi India — Comprehensive property dataset covering all of India",
  totalProperties,
  stats: {
    statesAndUTs: statesCount,
    cities: citiesCount,
    typeBreakdown,
  },
  states: [...new Set(properties.map(p => p.state))].sort(),
  cities: [...new Set(properties.map(p => p.city))].sort(),
  properties,
};

const outputPath = path.join(__dirname, "../export/property_data.json");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\n✅ Saved to: ${outputPath}`);
console.log(`📦 File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
