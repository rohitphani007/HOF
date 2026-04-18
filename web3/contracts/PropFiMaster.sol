// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PropFiMaster
 * @author PropFi India
 * @notice ERC-1155 Master Contract for fractional real estate tokenization.
 *         Covers all of India — every state, city, and area can have a
 *         property listed. Each property gets a unique Token ID.
 *
 * @dev Architecture:
 *   - One contract manages ALL Indian real estate properties
 *   - Each property = one Token ID in the ERC-1155
 *   - Payments are in Mock USDC (6 decimals)
 *   - Rent distribution is proportional: (userTokens / totalTokens) * totalRent
 */
contract PropFiMaster is ERC1155Supply, Ownable, ReentrancyGuard {
    // ============================================================
    // STATE VARIABLES
    // ============================================================

    IERC20 public immutable usdc;

    uint256 public propertyCount;

    // propertyId => PropertyInfo
    mapping(uint256 => PropertyInfo) public properties;

    // propertyId => holder address => true/false (to avoid duplicate holders)
    mapping(uint256 => mapping(address => bool)) private _isHolder;

    // propertyId => array of all token holders
    mapping(uint256 => address[]) private _holders;

    // Total USDC held per property (for rent before distribution)
    mapping(uint256 => uint256) public rentPool;

    // ============================================================
    // STRUCTS
    // ============================================================

    struct PropertyInfo {
        uint256 propertyId;
        string name;          // e.g., "Whitefield Tech Park Tower A"
        string area;          // e.g., "Whitefield"
        string city;          // e.g., "Bangalore"
        string state;         // e.g., "Karnataka"
        string propertyType;  // e.g., "Residential", "Commercial", "Mixed"
        uint256 pricePerToken; // in mUSDC (6 decimals), e.g., 100e6 = 100 USDC
        uint256 totalTokens;   // max fractions available
        uint256 tokensSold;    // fractions sold so far
        uint256 totalRentDistributed; // lifetime rent paid out
        bool isActive;         // can tokens be bought?
        bool exists;           // sanity check
    }

    // ============================================================
    // EVENTS
    // ============================================================

    event PropertyListed(
        uint256 indexed propertyId,
        string name,
        string city,
        string state,
        uint256 pricePerToken,
        uint256 totalTokens
    );

    event TokensPurchased(
        uint256 indexed propertyId,
        address indexed buyer,
        uint256 amount,
        uint256 totalCost
    );

    event RentDeposited(
        uint256 indexed propertyId,
        address indexed depositor,
        uint256 amount
    );

    event RentDistributed(
        uint256 indexed propertyId,
        uint256 totalAmount,
        uint256 holdersCount
    );

    event RentClaimed(
        uint256 indexed propertyId,
        address indexed holder,
        uint256 amount
    );

    event PropertyStatusChanged(uint256 indexed propertyId, bool isActive);

    // ============================================================
    // CONSTRUCTOR
    // ============================================================

    constructor(address _usdcAddress)
        ERC1155("https://propfi.india/api/token/{id}.json")
        Ownable(msg.sender)
    {
        require(_usdcAddress != address(0), "PropFiMaster: invalid USDC address");
        usdc = IERC20(_usdcAddress);
    }

    // ============================================================
    // OWNER FUNCTIONS
    // ============================================================

    /**
     * @notice Lists a new property on the platform
     * @dev Only owner (deployer) can list properties
     * @param name Full property name (e.g., "Prestige Towers Block B")
     * @param area Locality/area (e.g., "Koramangala", "Andheri West")
     * @param city City name (e.g., "Bangalore", "Mumbai")
     * @param state Indian state (e.g., "Karnataka", "Maharashtra")
     * @param propertyType "Residential" | "Commercial" | "Mixed" | "Industrial"
     * @param pricePerToken Price in mUSDC per fractional token (6 decimals)
     * @param totalTokens Total fractions to issue (e.g., 1000 = 1000 shares)
     * @return propertyId The new property's Token ID
     */
    function listProperty(
        string calldata name,
        string calldata area,
        string calldata city,
        string calldata state,
        string calldata propertyType,
        uint256 pricePerToken,
        uint256 totalTokens
    ) external onlyOwner returns (uint256) {
        return _listProperty(name, area, city, state, propertyType, pricePerToken, totalTokens);
    }

    /**
     * @notice Batch list multiple properties in a single transaction.
     *         Use this for large-scale seeding (1000s of properties).
     * @dev Arrays must all have same length. Max 50 per call to avoid gas limit.
     */
    struct PropertyInput {
        string name;
        string area;
        string city;
        string state;
        string propertyType;
        uint256 pricePerToken;
        uint256 totalTokens;
    }

    function batchListProperties(PropertyInput[] calldata inputs)
        external
        onlyOwner
        returns (uint256[] memory ids)
    {
        uint256 len = inputs.length;
        require(len > 0 && len <= 50, "PropFiMaster: batch size 1-50");
        ids = new uint256[](len);
        for (uint256 i = 0; i < len; i++) {
            ids[i] = _listProperty(
                inputs[i].name,
                inputs[i].area,
                inputs[i].city,
                inputs[i].state,
                inputs[i].propertyType,
                inputs[i].pricePerToken,
                inputs[i].totalTokens
            );
        }
    }

    function _listProperty(
        string calldata name,
        string calldata area,
        string calldata city,
        string calldata state,
        string calldata propertyType,
        uint256 pricePerToken,
        uint256 totalTokens
    ) internal returns (uint256) {
        require(bytes(name).length > 0, "PropFiMaster: name required");
        require(bytes(city).length > 0, "PropFiMaster: city required");
        require(bytes(state).length > 0, "PropFiMaster: state required");
        require(pricePerToken > 0, "PropFiMaster: price must be > 0");
        require(totalTokens > 0 && totalTokens <= 1_000_000, "PropFiMaster: invalid token count");

        propertyCount++;
        uint256 newId = propertyCount;

        properties[newId] = PropertyInfo({
            propertyId: newId,
            name: name,
            area: area,
            city: city,
            state: state,
            propertyType: propertyType,
            pricePerToken: pricePerToken,
            totalTokens: totalTokens,
            tokensSold: 0,
            totalRentDistributed: 0,
            isActive: true,
            exists: true
        });

        emit PropertyListed(newId, name, city, state, pricePerToken, totalTokens);
        return newId;
    }

    /**
     * @notice Toggles whether a property accepts new purchases
     */
    function setPropertyActive(uint256 propertyId, bool active) external onlyOwner {
        require(properties[propertyId].exists, "PropFiMaster: property not found");
        properties[propertyId].isActive = active;
        emit PropertyStatusChanged(propertyId, active);
    }

    /**
     * @notice Updates the metadata URI template
     */
    function setURI(string calldata newuri) external onlyOwner {
        _setURI(newuri);
    }

    // ============================================================
    // INVESTOR FUNCTIONS
    // ============================================================

    /**
     * @notice Buy fractional tokens for a property
     * @dev Requires prior USDC approval: usdc.approve(PropFiMasterAddress, amount * pricePerToken)
     * @param propertyId The property Token ID to invest in
     * @param amount Number of fractional tokens to purchase
     */
    function buyFractionalToken(uint256 propertyId, uint256 amount)
        external
        nonReentrant
    {
        PropertyInfo storage prop = properties[propertyId];
        require(prop.exists, "PropFiMaster: property not found");
        require(prop.isActive, "PropFiMaster: property not active");
        require(amount > 0, "PropFiMaster: amount must be > 0");
        require(
            prop.tokensSold + amount <= prop.totalTokens,
            "PropFiMaster: insufficient tokens remaining"
        );

        uint256 totalCost = prop.pricePerToken * amount;

        // Pull USDC from buyer (buyer must have approved this contract)
        bool success = usdc.transferFrom(msg.sender, address(this), totalCost);
        require(success, "PropFiMaster: USDC transfer failed");

        // Mint ERC-1155 tokens
        _mint(msg.sender, propertyId, amount, "");

        prop.tokensSold += amount;

        // Track holder for rent distribution
        if (!_isHolder[propertyId][msg.sender]) {
            _isHolder[propertyId][msg.sender] = true;
            _holders[propertyId].push(msg.sender);
        }

        emit TokensPurchased(propertyId, msg.sender, amount, totalCost);
    }

    /**
     * @notice Deposit USDC rent into a property's rent pool
     * @dev Anyone can deposit rent (landlord, owner, etc.)
     * @param propertyId The property to deposit rent for
     * @param amount Amount of mUSDC to deposit (6 decimals)
     */
    function depositRent(uint256 propertyId, uint256 amount) external nonReentrant {
        require(properties[propertyId].exists, "PropFiMaster: property not found");
        require(amount > 0, "PropFiMaster: amount must be > 0");

        bool success = usdc.transferFrom(msg.sender, address(this), amount);
        require(success, "PropFiMaster: USDC transfer failed");

        rentPool[propertyId] += amount;
        emit RentDeposited(propertyId, msg.sender, amount);
    }

    /**
     * @notice Distribute accumulated rent pool to all token holders
     * @dev Can be called by anyone — loops through all holders and pays proportionally
     * @param propertyId The property to distribute rent for
     *
     * RENT MATH (integer-safe):
     *   holderShare = (holderBalance * rentPool) / totalTokensSold
     *
     * We use multiplication BEFORE division to preserve precision.
     * Any dust (rounding remainder) stays in the contract for next round.
     */
    function distributeRent(uint256 propertyId) external nonReentrant {
        PropertyInfo storage prop = properties[propertyId];
        require(prop.exists, "PropFiMaster: property not found");

        uint256 pool = rentPool[propertyId];
        require(pool > 0, "PropFiMaster: no rent in pool");

        uint256 totalSupplyForProp = totalSupply(propertyId);
        require(totalSupplyForProp > 0, "PropFiMaster: no tokens sold yet");

        address[] storage holders = _holders[propertyId];
        uint256 holdersLen = holders.length;
        require(holdersLen > 0, "PropFiMaster: no holders");

        // Zero out pool BEFORE transfers (reentrancy protection)
        rentPool[propertyId] = 0;

        uint256 totalDistributed = 0;

        for (uint256 i = 0; i < holdersLen; i++) {
            address holder = holders[i];
            uint256 holderBalance = balanceOf(holder, propertyId);

            if (holderBalance == 0) continue;

            // Integer-safe: multiply first, then divide
            uint256 holderShare = (holderBalance * pool) / totalSupplyForProp;

            if (holderShare > 0) {
                bool success = usdc.transfer(holder, holderShare);
                require(success, "PropFiMaster: rent transfer failed");
                totalDistributed += holderShare;
                emit RentClaimed(propertyId, holder, holderShare);
            }
        }

        prop.totalRentDistributed += totalDistributed;

        // Any dust (rounding leftovers) goes back to rent pool
        uint256 dust = pool - totalDistributed;
        if (dust > 0) {
            rentPool[propertyId] = dust;
        }

        emit RentDistributed(propertyId, totalDistributed, holdersLen);
    }

    /**
     * @notice Distribute a specific amount of rent directly (without pre-deposit)
     * @dev Owner convenience function — pulls USDC and distributes in one call
     * @param propertyId Property to distribute rent for
     * @param totalRentAmount Total USDC rent to distribute (6 decimals)
     */
    function distributeRentDirect(uint256 propertyId, uint256 totalRentAmount)
        external
        nonReentrant
        onlyOwner
    {
        PropertyInfo storage prop = properties[propertyId];
        require(prop.exists, "PropFiMaster: property not found");
        require(totalRentAmount > 0, "PropFiMaster: amount must be > 0");

        uint256 totalSupplyForProp = totalSupply(propertyId);
        require(totalSupplyForProp > 0, "PropFiMaster: no tokens sold yet");

        // Pull rent USDC from caller
        bool pullSuccess = usdc.transferFrom(msg.sender, address(this), totalRentAmount);
        require(pullSuccess, "PropFiMaster: USDC pull failed");

        address[] storage holders = _holders[propertyId];
        uint256 holdersLen = holders.length;

        uint256 totalDistributed = 0;

        for (uint256 i = 0; i < holdersLen; i++) {
            address holder = holders[i];
            uint256 holderBalance = balanceOf(holder, propertyId);

            if (holderBalance == 0) continue;

            // Integer-safe rent math
            uint256 holderShare = (holderBalance * totalRentAmount) / totalSupplyForProp;

            if (holderShare > 0) {
                bool success = usdc.transfer(holder, holderShare);
                require(success, "PropFiMaster: rent transfer failed");
                totalDistributed += holderShare;
                emit RentClaimed(propertyId, holder, holderShare);
            }
        }

        // Dust back to pool
        uint256 dust = totalRentAmount - totalDistributed;
        if (dust > 0) {
            rentPool[propertyId] += dust;
        }

        prop.totalRentDistributed += totalDistributed;
        emit RentDistributed(propertyId, totalDistributed, holdersLen);
    }

    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================

    /**
     * @notice Get full property details
     */
    function getProperty(uint256 propertyId)
        external
        view
        returns (PropertyInfo memory)
    {
        require(properties[propertyId].exists, "PropFiMaster: property not found");
        return properties[propertyId];
    }

    /**
     * @notice Get all properties (paginated)
     * @param offset Start index (0-based)
     * @param limit Max properties to return
     */
    function getProperties(uint256 offset, uint256 limit)
        external
        view
        returns (PropertyInfo[] memory)
    {
        uint256 total = propertyCount;
        if (offset >= total) return new PropertyInfo[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;

        uint256 size = end - offset;
        PropertyInfo[] memory result = new PropertyInfo[](size);

        for (uint256 i = 0; i < size; i++) {
            result[i] = properties[offset + i + 1]; // IDs are 1-indexed
        }

        return result;
    }

    /**
     * @notice Get all holders for a property
     */
    function getHolders(uint256 propertyId)
        external
        view
        returns (address[] memory)
    {
        require(properties[propertyId].exists, "PropFiMaster: property not found");
        return _holders[propertyId];
    }

    /**
     * @notice Get an investor's portfolio — all properties and balances
     * @param investor Address to query
     */
    function getPortfolio(address investor)
        external
        view
        returns (uint256[] memory propIds, uint256[] memory balances)
    {
        uint256 total = propertyCount;
        uint256 count = 0;

        // Count owned properties
        for (uint256 i = 1; i <= total; i++) {
            if (balanceOf(investor, i) > 0) count++;
        }

        propIds = new uint256[](count);
        balances = new uint256[](count);
        uint256 idx = 0;

        for (uint256 i = 1; i <= total; i++) {
            uint256 bal = balanceOf(investor, i);
            if (bal > 0) {
                propIds[idx] = i;
                balances[idx] = bal;
                idx++;
            }
        }
    }

    /**
     * @notice Calculate what share of rent a holder would receive
     * @param propertyId Property to query
     * @param holder Holder address
     * @return share Proportion in basis points (e.g., 5000 = 50%)
     */
    function getOwnershipShare(uint256 propertyId, address holder)
        external
        view
        returns (uint256 share)
    {
        uint256 holderBalance = balanceOf(holder, propertyId);
        uint256 totalSup = totalSupply(propertyId);
        if (totalSup == 0) return 0;
        // Return in basis points (1/10000)
        return (holderBalance * 10000) / totalSup;
    }

    /**
     * @notice Get tokens remaining for purchase in a property
     */
    function getTokensAvailable(uint256 propertyId)
        external
        view
        returns (uint256)
    {
        PropertyInfo storage prop = properties[propertyId];
        if (!prop.exists) return 0;
        return prop.totalTokens - prop.tokensSold;
    }
}
