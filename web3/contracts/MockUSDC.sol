// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @author PropFi India
 * @notice A mock USDC token for hackathon demo purposes.
 *         Uses 6 decimal places to match real USDC.
 *         Anyone can mint for demo purposes.
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;

    // Max mint per call to prevent abuse (1,000,000 USDC)
    uint256 public constant MAX_MINT_PER_CALL = 1_000_000 * 10 ** 6;

    event Minted(address indexed to, uint256 amount);

    constructor() ERC20("Mock USDC", "mUSDC") Ownable(msg.sender) {
        // Mint 10,000,000 USDC to deployer for demo seeding
        _mint(msg.sender, 10_000_000 * 10 ** DECIMALS);
    }

    /**
     * @dev Override decimals to return 6 (USDC standard)
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @notice Public mint function — anyone can mint for hackathon demos
     * @param to Recipient address
     * @param amount Amount in USDC (with 6 decimals, e.g., 100e6 = 100 USDC)
     */
    function mint(address to, uint256 amount) external {
        require(amount <= MAX_MINT_PER_CALL, "MockUSDC: exceeds max mint per call");
        require(to != address(0), "MockUSDC: cannot mint to zero address");
        _mint(to, amount);
        emit Minted(to, amount);
    }

    /**
     * @notice Convenience: mint exactly N whole USDC tokens
     * @param to Recipient address
     * @param wholeAmount Amount in whole USDC (e.g., 100 = 100 USDC)
     */
    function mintWhole(address to, uint256 wholeAmount) external {
        uint256 amount = wholeAmount * 10 ** DECIMALS;
        require(amount <= MAX_MINT_PER_CALL, "MockUSDC: exceeds max mint per call");
        require(to != address(0), "MockUSDC: cannot mint to zero address");
        _mint(to, amount);
        emit Minted(to, amount);
    }
}
