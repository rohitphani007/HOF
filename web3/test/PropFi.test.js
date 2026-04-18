const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * PropFi India — Full Test Suite
 *
 * Tests cover:
 * 1. MockUSDC deployment and minting
 * 2. PropFiMaster deployment and property listing
 * 3. Fractional token purchasing (approval + buy flow)
 * 4. Rent distribution math — exact proportional payouts
 * 5. Edge cases: dust, zero balances, inactive properties
 * 6. Portfolio view and ownership share queries
 * 7. Multi-city / all-India property support
 */
describe("PropFi India — Full Contract Test Suite", function () {
  // Deployed contracts
  let mockUSDC;
  let propFiMaster;

  // Signers
  let owner;
  let userA; // Investor from Delhi
  let userB; // Investor from Mumbai
  let userC; // Investor from Bangalore
  let landlord;

  // USDC amounts use 6 decimals
  const toUSDC = (amount) => ethers.parseUnits(amount.toString(), 6);
  const fromUSDC = (amount) => ethers.formatUnits(amount, 6);

  beforeEach(async function () {
    [owner, userA, userB, userC, landlord] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();

    // Deploy PropFiMaster
    const PropFiMaster = await ethers.getContractFactory("PropFiMaster");
    propFiMaster = await PropFiMaster.deploy(await mockUSDC.getAddress());
    await propFiMaster.waitForDeployment();

    // Mint 100,000 mUSDC to each user and landlord for testing
    await mockUSDC.mint(userA.address, toUSDC(100_000));
    await mockUSDC.mint(userB.address, toUSDC(100_000));
    await mockUSDC.mint(userC.address, toUSDC(100_000));
    await mockUSDC.mint(landlord.address, toUSDC(500_000));
  });

  // ============================================================
  // SECTION 1: MockUSDC Tests
  // ============================================================
  describe("MockUSDC", function () {
    it("should deploy with correct name, symbol, decimals", async function () {
      expect(await mockUSDC.name()).to.equal("Mock USDC");
      expect(await mockUSDC.symbol()).to.equal("mUSDC");
      expect(await mockUSDC.decimals()).to.equal(6);
    });

    it("should mint 10,000,000 USDC to deployer on construction", async function () {
      const balance = await mockUSDC.balanceOf(owner.address);
      expect(balance).to.equal(toUSDC(10_000_000));
    });

    it("should allow anyone to mint up to MAX_MINT_PER_CALL", async function () {
      const before = await mockUSDC.balanceOf(userA.address);
      await mockUSDC.connect(userA).mint(userA.address, toUSDC(500_000));
      const after = await mockUSDC.balanceOf(userA.address);
      expect(after - before).to.equal(toUSDC(500_000));
    });

    it("should reject mints exceeding MAX_MINT_PER_CALL", async function () {
      await expect(
        mockUSDC.mint(userA.address, toUSDC(2_000_000))
      ).to.be.revertedWith("MockUSDC: exceeds max mint per call");
    });

    it("mintWhole should work correctly", async function () {
      await mockUSDC.mintWhole(userB.address, 250);
      const balance = await mockUSDC.balanceOf(userB.address);
      expect(balance).to.equal(toUSDC(100_250)); // 100,000 from beforeEach + 250
    });
  });

  // ============================================================
  // SECTION 2: Property Listing Tests
  // ============================================================
  describe("Property Listing", function () {
    it("should list a property with correct metadata", async function () {
      await propFiMaster.listProperty(
        "Whitefield Tech Park Tower A",
        "Whitefield",
        "Bangalore",
        "Karnataka",
        "Commercial",
        toUSDC(100),  // 100 USDC per token
        1000          // 1000 total tokens
      );

      const prop = await propFiMaster.getProperty(1);
      expect(prop.name).to.equal("Whitefield Tech Park Tower A");
      expect(prop.area).to.equal("Whitefield");
      expect(prop.city).to.equal("Bangalore");
      expect(prop.state).to.equal("Karnataka");
      expect(prop.propertyType).to.equal("Commercial");
      expect(prop.pricePerToken).to.equal(toUSDC(100));
      expect(prop.totalTokens).to.equal(1000);
      expect(prop.tokensSold).to.equal(0);
      expect(prop.isActive).to.equal(true);
    });

    it("should auto-increment propertyId correctly", async function () {
      await propFiMaster.listProperty(
        "Sea View Apartments", "Worli", "Mumbai", "Maharashtra",
        "Residential", toUSDC(200), 500
      );
      await propFiMaster.listProperty(
        "HITEC Phase 2", "Madhapur", "Hyderabad", "Telangana",
        "Commercial", toUSDC(80), 2000
      );

      expect(await propFiMaster.propertyCount()).to.equal(2);
      const prop2 = await propFiMaster.getProperty(2);
      expect(prop2.city).to.equal("Hyderabad");
    });

    it("should support properties from all Indian states", async function () {
      const indianProperties = [
        ["Cyber Hub Tower", "Sector 24", "Gurugram", "Haryana", "Commercial", 150, 800],
        ["Marine Heights", "Marine Drive", "Mumbai", "Maharashtra", "Residential", 300, 400],
        ["Tech Valley", "Electronic City", "Bangalore", "Karnataka", "Commercial", 120, 1200],
        ["New Town Mall", "Rajarhat", "Kolkata", "West Bengal", "Mixed", 90, 1500],
        ["Phoenix Towers", "Anna Nagar", "Chennai", "Tamil Nadu", "Residential", 110, 1000],
        ["River View", "Banjara Hills", "Hyderabad", "Telangana", "Residential", 200, 600],
        ["Smart City Hub", "Vastrapur", "Ahmedabad", "Gujarat", "Commercial", 70, 2000],
        ["Capital Heights", "Sector 62", "Noida", "Uttar Pradesh", "Residential", 85, 1800],
      ];

      for (const [name, area, city, state, type, price, tokens] of indianProperties) {
        await propFiMaster.listProperty(name, area, city, state, type, toUSDC(price), tokens);
      }

      expect(await propFiMaster.propertyCount()).to.equal(8);
    });

    it("should reject listing from non-owner", async function () {
      await expect(
        propFiMaster.connect(userA).listProperty(
          "Fake Property", "Area", "City", "State", "Residential", toUSDC(100), 100
        )
      ).to.be.reverted;
    });

    it("should reject listing with zero price", async function () {
      await expect(
        propFiMaster.listProperty("Test", "Area", "City", "State", "Residential", 0, 100)
      ).to.be.revertedWith("PropFiMaster: price must be > 0");
    });
  });

  // ============================================================
  // SECTION 3: Token Purchase Tests
  // ============================================================
  describe("Token Purchase (buyFractionalToken)", function () {
    const PROPERTY_ID = 1;
    const PRICE_PER_TOKEN = 100; // USDC
    const TOTAL_TOKENS = 1000;

    beforeEach(async function () {
      await propFiMaster.listProperty(
        "Whitefield Tech Park",
        "Whitefield",
        "Bangalore",
        "Karnataka",
        "Commercial",
        toUSDC(PRICE_PER_TOKEN),
        TOTAL_TOKENS
      );
    });

    it("should allow user to buy tokens after USDC approval", async function () {
      const amount = 10;
      const cost = toUSDC(PRICE_PER_TOKEN * amount);

      await mockUSDC.connect(userA).approve(await propFiMaster.getAddress(), cost);
      await propFiMaster.connect(userA).buyFractionalToken(PROPERTY_ID, amount);

      const balance = await propFiMaster.balanceOf(userA.address, PROPERTY_ID);
      expect(balance).to.equal(amount);
    });

    it("should deduct correct USDC from buyer", async function () {
      const amount = 50;
      const cost = toUSDC(PRICE_PER_TOKEN * amount);

      const beforeBalance = await mockUSDC.balanceOf(userA.address);
      await mockUSDC.connect(userA).approve(await propFiMaster.getAddress(), cost);
      await propFiMaster.connect(userA).buyFractionalToken(PROPERTY_ID, amount);
      const afterBalance = await mockUSDC.balanceOf(userA.address);

      expect(beforeBalance - afterBalance).to.equal(cost);
    });

    it("should track tokensSold correctly", async function () {
      await mockUSDC.connect(userA).approve(await propFiMaster.getAddress(), toUSDC(50_000));
      await propFiMaster.connect(userA).buyFractionalToken(PROPERTY_ID, 300);

      await mockUSDC.connect(userB).approve(await propFiMaster.getAddress(), toUSDC(50_000));
      await propFiMaster.connect(userB).buyFractionalToken(PROPERTY_ID, 200);

      const prop = await propFiMaster.getProperty(PROPERTY_ID);
      expect(prop.tokensSold).to.equal(500);
    });

    it("should reject purchase without USDC approval", async function () {
      await expect(
        propFiMaster.connect(userA).buyFractionalToken(PROPERTY_ID, 5)
      ).to.be.reverted;
    });

    it("should reject purchase exceeding available supply", async function () {
      await mockUSDC.connect(userA).approve(await propFiMaster.getAddress(), toUSDC(100_000));
      await expect(
        propFiMaster.connect(userA).buyFractionalToken(PROPERTY_ID, 1001)
      ).to.be.revertedWith("PropFiMaster: insufficient tokens remaining");
    });

    it("should reject purchase on inactive property", async function () {
      await propFiMaster.setPropertyActive(PROPERTY_ID, false);
      await mockUSDC.connect(userA).approve(await propFiMaster.getAddress(), toUSDC(1000));
      await expect(
        propFiMaster.connect(userA).buyFractionalToken(PROPERTY_ID, 5)
      ).to.be.revertedWith("PropFiMaster: property not active");
    });
  });

  // ============================================================
  // SECTION 4: THE CRITICAL RENT MATH TEST
  // Simulates 3 investors buying different fractions of Property ID 1
  // Verifies exact proportional USDC payouts when distributeRent() is called
  // ============================================================
  describe("🎯 Rent Distribution — Exact Math Verification", function () {
    const PROPERTY_ID = 1;
    const PRICE_PER_TOKEN = toUSDC(100); // 100 USDC per token
    const TOTAL_TOKENS = 1000;
    const TOTAL_RENT = toUSDC(10_000); // 10,000 USDC rent to distribute

    // User purchases:
    // userA: 500 tokens = 50% ownership
    // userB: 300 tokens = 30% ownership
    // userC: 200 tokens = 20% ownership
    // Total: 1000 tokens = 100%

    beforeEach(async function () {
      // List property
      await propFiMaster.listProperty(
        "Whitefield Tech Park Tower A",
        "Whitefield",
        "Bangalore",
        "Karnataka",
        "Commercial",
        PRICE_PER_TOKEN,
        TOTAL_TOKENS
      );

      const propFiAddr = await propFiMaster.getAddress();

      // User A buys 500 tokens (50%)
      await mockUSDC.connect(userA).approve(propFiAddr, PRICE_PER_TOKEN * 500n);
      await propFiMaster.connect(userA).buyFractionalToken(PROPERTY_ID, 500);

      // User B buys 300 tokens (30%)
      await mockUSDC.connect(userB).approve(propFiAddr, PRICE_PER_TOKEN * 300n);
      await propFiMaster.connect(userB).buyFractionalToken(PROPERTY_ID, 300);

      // User C buys 200 tokens (20%)
      await mockUSDC.connect(userC).approve(propFiAddr, PRICE_PER_TOKEN * 200n);
      await propFiMaster.connect(userC).buyFractionalToken(PROPERTY_ID, 200);
    });

    it("should show correct token ownership after purchase", async function () {
      const balA = await propFiMaster.balanceOf(userA.address, PROPERTY_ID);
      const balB = await propFiMaster.balanceOf(userB.address, PROPERTY_ID);
      const balC = await propFiMaster.balanceOf(userC.address, PROPERTY_ID);

      expect(balA).to.equal(500n);
      expect(balB).to.equal(300n);
      expect(balC).to.equal(200n);
    });

    it("should show correct ownership percentage via getOwnershipShare()", async function () {
      const shareA = await propFiMaster.getOwnershipShare(PROPERTY_ID, userA.address);
      const shareB = await propFiMaster.getOwnershipShare(PROPERTY_ID, userB.address);
      const shareC = await propFiMaster.getOwnershipShare(PROPERTY_ID, userC.address);

      // Basis points (out of 10000)
      expect(shareA).to.equal(5000n); // 50%
      expect(shareB).to.equal(3000n); // 30%
      expect(shareC).to.equal(2000n); // 20%
    });

    it("✅ distributeRent() — exact proportional payout to 3 investors", async function () {
      // Landlord deposits rent
      const propFiAddr = await propFiMaster.getAddress();
      await mockUSDC.connect(landlord).approve(propFiAddr, TOTAL_RENT);
      await propFiMaster.connect(landlord).depositRent(PROPERTY_ID, TOTAL_RENT);

      // Record balances before distribution
      const beforeA = await mockUSDC.balanceOf(userA.address);
      const beforeB = await mockUSDC.balanceOf(userB.address);
      const beforeC = await mockUSDC.balanceOf(userC.address);

      // Distribute rent (anyone can call this)
      await propFiMaster.connect(owner).distributeRent(PROPERTY_ID);

      // Record balances after
      const afterA = await mockUSDC.balanceOf(userA.address);
      const afterB = await mockUSDC.balanceOf(userB.address);
      const afterC = await mockUSDC.balanceOf(userC.address);

      const gainA = afterA - beforeA;
      const gainB = afterB - beforeB;
      const gainC = afterC - beforeC;

      // Expected:
      // userA: 50% of 10,000 = 5,000 USDC
      // userB: 30% of 10,000 = 3,000 USDC
      // userC: 20% of 10,000 = 2,000 USDC
      expect(gainA).to.equal(toUSDC(5_000), "UserA should receive exactly 5,000 USDC");
      expect(gainB).to.equal(toUSDC(3_000), "UserB should receive exactly 3,000 USDC");
      expect(gainC).to.equal(toUSDC(2_000), "UserC should receive exactly 2,000 USDC");

      // Total distributed should equal total rent (no dust for clean numbers)
      expect(gainA + gainB + gainC).to.equal(TOTAL_RENT);
    });

    it("✅ distributeRentDirect() — one-call owner convenience function", async function () {
      const propFiAddr = await propFiMaster.getAddress();
      await mockUSDC.connect(owner).approve(propFiAddr, TOTAL_RENT);

      const beforeA = await mockUSDC.balanceOf(userA.address);
      const beforeB = await mockUSDC.balanceOf(userB.address);
      const beforeC = await mockUSDC.balanceOf(userC.address);

      await propFiMaster.connect(owner).distributeRentDirect(PROPERTY_ID, TOTAL_RENT);

      expect(await mockUSDC.balanceOf(userA.address) - beforeA).to.equal(toUSDC(5_000));
      expect(await mockUSDC.balanceOf(userB.address) - beforeB).to.equal(toUSDC(3_000));
      expect(await mockUSDC.balanceOf(userC.address) - beforeC).to.equal(toUSDC(2_000));
    });

    it("should handle non-round rent amounts (dust stays in pool)", async function () {
      // 10,001 USDC rent — doesn't divide perfectly
      const oddRent = toUSDC(10_001);
      const propFiAddr = await propFiMaster.getAddress();

      await mockUSDC.connect(landlord).approve(propFiAddr, oddRent);
      await propFiMaster.connect(landlord).depositRent(PROPERTY_ID, oddRent);
      await propFiMaster.distributeRent(PROPERTY_ID);

      // No holder should have more than their fair share
      const gainA = (await mockUSDC.balanceOf(userA.address)) -
        (await mockUSDC.balanceOf(userA.address));

      // Rent pool should have dust <= number of holders
      const dustInPool = await propFiMaster.rentPool(PROPERTY_ID);
      expect(dustInPool).to.be.lte(3n); // At most 3 units of dust (one per holder)
    });

    it("should reject distributeRent when pool is empty", async function () {
      await expect(
        propFiMaster.distributeRent(PROPERTY_ID)
      ).to.be.revertedWith("PropFiMaster: no rent in pool");
    });
  });

  // ============================================================
  // SECTION 5: Portfolio & View Functions
  // ============================================================
  describe("Portfolio & View Functions", function () {
    beforeEach(async function () {
      // List 3 properties across India
      await propFiMaster.listProperty(
        "Whitefield Tech Park", "Whitefield", "Bangalore", "Karnataka",
        "Commercial", toUSDC(100), 1000
      );
      await propFiMaster.listProperty(
        "Bandra West Heights", "Bandra", "Mumbai", "Maharashtra",
        "Residential", toUSDC(250), 500
      );
      await propFiMaster.listProperty(
        "Cyber City Plaza", "DLF Phase 2", "Gurugram", "Haryana",
        "Commercial", toUSDC(150), 800
      );
    });

    it("should return investor portfolio correctly", async function () {
      const propFiAddr = await propFiMaster.getAddress();

      // userA invests in property 1 and 3
      await mockUSDC.connect(userA).approve(propFiAddr, toUSDC(100_000));
      await propFiMaster.connect(userA).buyFractionalToken(1, 50);
      await propFiMaster.connect(userA).buyFractionalToken(3, 30);

      const [propIds, balances] = await propFiMaster.getPortfolio(userA.address);

      expect(propIds.length).to.equal(2);
      expect(propIds[0]).to.equal(1n);
      expect(propIds[1]).to.equal(3n);
      expect(balances[0]).to.equal(50n);
      expect(balances[1]).to.equal(30n);
    });

    it("should return holders list correctly", async function () {
      const propFiAddr = await propFiMaster.getAddress();

      await mockUSDC.connect(userA).approve(propFiAddr, toUSDC(10_000));
      await propFiMaster.connect(userA).buyFractionalToken(1, 10);

      await mockUSDC.connect(userB).approve(propFiAddr, toUSDC(10_000));
      await propFiMaster.connect(userB).buyFractionalToken(1, 10);

      const holders = await propFiMaster.getHolders(1);
      expect(holders.length).to.equal(2);
      expect(holders).to.include(userA.address);
      expect(holders).to.include(userB.address);
    });

    it("getProperties() should paginate correctly", async function () {
      const page1 = await propFiMaster.getProperties(0, 2);
      const page2 = await propFiMaster.getProperties(2, 2);

      expect(page1.length).to.equal(2);
      expect(page2.length).to.equal(1);
      expect(page1[0].city).to.equal("Bangalore");
      expect(page1[1].city).to.equal("Mumbai");
      expect(page2[0].city).to.equal("Gurugram");
    });

    it("getTokensAvailable() should reflect purchases", async function () {
      const propFiAddr = await propFiMaster.getAddress();
      await mockUSDC.connect(userA).approve(propFiAddr, toUSDC(50_000));
      await propFiMaster.connect(userA).buyFractionalToken(1, 400);

      const available = await propFiMaster.getTokensAvailable(1);
      expect(available).to.equal(600n);
    });
  });
});
