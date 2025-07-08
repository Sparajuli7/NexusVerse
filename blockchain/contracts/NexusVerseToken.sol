// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NexusVerseToken
 * @dev ERC-20 token for NexusVerse platform governance and payments
 */
contract NexusVerseToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ReentrancyGuard {
    // Token details
    uint256 public constant INITIAL_SUPPLY = 1000000000 * 10**18; // 1 billion tokens
    uint256 public constant MAX_SUPPLY = 10000000000 * 10**18; // 10 billion tokens max
    
    // Staking and rewards
    mapping(address => uint256) public stakedAmount;
    mapping(address => uint256) public stakingStartTime;
    uint256 public totalStaked;
    uint256 public rewardRate = 100; // 1% annual reward rate (basis points)
    
    // Events
    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 newRate);
    
    constructor() ERC20("NexusVerse Token", "NVT") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    /**
     * @dev Stake tokens to earn rewards
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Calculate and claim existing rewards
        uint256 rewards = calculateRewards(msg.sender);
        if (rewards > 0) {
            _mint(msg.sender, rewards);
            emit RewardsClaimed(msg.sender, rewards);
        }
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        // Update staking info
        stakedAmount[msg.sender] += amount;
        stakingStartTime[msg.sender] = block.timestamp;
        totalStaked += amount;
        
        emit TokensStaked(msg.sender, amount);
    }
    
    /**
     * @dev Unstake tokens
     * @param amount Amount of tokens to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(stakedAmount[msg.sender] >= amount, "Insufficient staked amount");
        
        // Calculate and claim rewards
        uint256 rewards = calculateRewards(msg.sender);
        if (rewards > 0) {
            _mint(msg.sender, rewards);
            emit RewardsClaimed(msg.sender, rewards);
        }
        
        // Update staking info
        stakedAmount[msg.sender] -= amount;
        totalStaked -= amount;
        
        // Transfer tokens back to user
        _transfer(address(this), msg.sender, amount);
        
        emit TokensUnstaked(msg.sender, amount);
    }
    
    /**
     * @dev Claim accumulated rewards
     */
    function claimRewards() external nonReentrant {
        uint256 rewards = calculateRewards(msg.sender);
        require(rewards > 0, "No rewards to claim");
        
        _mint(msg.sender, rewards);
        stakingStartTime[msg.sender] = block.timestamp;
        
        emit RewardsClaimed(msg.sender, rewards);
    }
    
    /**
     * @dev Calculate rewards for a user
     * @param user Address of the user
     * @return rewards Amount of rewards earned
     */
    function calculateRewards(address user) public view returns (uint256 rewards) {
        if (stakedAmount[user] == 0) return 0;
        
        uint256 stakingDuration = block.timestamp - stakingStartTime[user];
        rewards = (stakedAmount[user] * rewardRate * stakingDuration) / (365 days * 10000);
    }
    
    /**
     * @dev Get staking info for a user
     * @param user Address of the user
     * @return staked Amount staked
     * @return rewards Pending rewards
     * @return stakingTime Time when staking started
     */
    function getStakingInfo(address user) external view returns (
        uint256 staked,
        uint256 rewards,
        uint256 stakingTime
    ) {
        staked = stakedAmount[user];
        rewards = calculateRewards(user);
        stakingTime = stakingStartTime[user];
    }
    
    /**
     * @dev Update reward rate (owner only)
     * @param newRate New reward rate in basis points
     */
    function updateRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 1000, "Reward rate too high"); // Max 10%
        rewardRate = newRate;
        emit RewardRateUpdated(newRate);
    }
    
    /**
     * @dev Pause token transfers (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Mint new tokens (owner only)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
    
    // Override required functions
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
} 