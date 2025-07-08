// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title NexusVerseIdentity
 * @dev Self-sovereign identity management for NexusVerse platform
 */
contract NexusVerseIdentity is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    
    // Identity structure
    struct Identity {
        bytes32 identityHash;
        uint256 createdAt;
        bool isVerified;
        bool isActive;
        string metadata;
    }
    
    // Verification structure
    struct Verification {
        address verifier;
        uint256 timestamp;
        bool isValid;
        string reason;
    }
    
    // State variables
    mapping(address => Identity) public identities;
    mapping(address => Verification[]) public verifications;
    mapping(bytes32 => address) public identityHashToAddress;
    mapping(address => bool) public authorizedVerifiers;
    
    // Events
    event IdentityRegistered(address indexed user, bytes32 indexed identityHash);
    event IdentityVerified(address indexed user, address indexed verifier);
    event IdentityRevoked(address indexed user);
    event VerifierAuthorized(address indexed verifier);
    event VerifierRevoked(address indexed verifier);
    event MetadataUpdated(address indexed user, string metadata);
    
    // Modifiers
    modifier onlyAuthorizedVerifier() {
        require(authorizedVerifiers[msg.sender], "Not authorized verifier");
        _;
    }
    
    modifier identityExists(address user) {
        require(identities[user].isActive, "Identity does not exist");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        // Authorize the contract owner as the first verifier
        authorizedVerifiers[msg.sender] = true;
        emit VerifierAuthorized(msg.sender);
    }
    
    /**
     * @dev Register a new identity
     * @param identityHash Hash of the identity data
     * @param metadata Additional metadata (IPFS hash)
     */
    function registerIdentity(bytes32 identityHash, string memory metadata) external {
        require(identityHash != bytes32(0), "Invalid identity hash");
        require(!identities[msg.sender].isActive, "Identity already exists");
        require(identityHashToAddress[identityHash] == address(0), "Identity hash already used");
        
        identities[msg.sender] = Identity({
            identityHash: identityHash,
            createdAt: block.timestamp,
            isVerified: false,
            isActive: true,
            metadata: metadata
        });
        
        identityHashToAddress[identityHash] = msg.sender;
        
        emit IdentityRegistered(msg.sender, identityHash);
    }
    
    /**
     * @dev Verify an identity (authorized verifiers only)
     * @param user Address of the user to verify
     * @param isValid Whether the verification is valid
     * @param reason Reason for verification decision
     */
    function verifyIdentity(
        address user,
        bool isValid,
        string memory reason
    ) external onlyAuthorizedVerifier identityExists(user) {
        require(!identities[user].isVerified, "Identity already verified");
        
        identities[user].isVerified = isValid;
        
        verifications[user].push(Verification({
            verifier: msg.sender,
            timestamp: block.timestamp,
            isValid: isValid,
            reason: reason
        }));
        
        emit IdentityVerified(user, msg.sender);
    }
    
    /**
     * @dev Revoke an identity
     * @param user Address of the user to revoke
     */
    function revokeIdentity(address user) external onlyOwner identityExists(user) {
        identities[user].isActive = false;
        delete identityHashToAddress[identities[user].identityHash];
        
        emit IdentityRevoked(user);
    }
    
    /**
     * @dev Update identity metadata
     * @param metadata New metadata (IPFS hash)
     */
    function updateMetadata(string memory metadata) external identityExists(msg.sender) {
        identities[msg.sender].metadata = metadata;
        emit MetadataUpdated(msg.sender, metadata);
    }
    
    /**
     * @dev Authorize a new verifier
     * @param verifier Address of the verifier to authorize
     */
    function authorizeVerifier(address verifier) external onlyOwner {
        require(verifier != address(0), "Invalid verifier address");
        require(!authorizedVerifiers[verifier], "Verifier already authorized");
        
        authorizedVerifiers[verifier] = true;
        emit VerifierAuthorized(verifier);
    }
    
    /**
     * @dev Revoke verifier authorization
     * @param verifier Address of the verifier to revoke
     */
    function revokeVerifier(address verifier) external onlyOwner {
        require(authorizedVerifiers[verifier], "Verifier not authorized");
        require(verifier != owner(), "Cannot revoke owner");
        
        authorizedVerifiers[verifier] = false;
        emit VerifierRevoked(verifier);
    }
    
    /**
     * @dev Get identity information
     * @param user Address of the user
     * @return identity Identity struct
     */
    function getIdentity(address user) external view returns (Identity memory identity) {
        identity = identities[user];
    }
    
    /**
     * @dev Get verification history for a user
     * @param user Address of the user
     * @return verificationHistory Array of verification records
     */
    function getVerificationHistory(address user) external view returns (Verification[] memory verificationHistory) {
        verificationHistory = verifications[user];
    }
    
    /**
     * @dev Check if an address has a verified identity
     * @param user Address to check
     * @return hasVerifiedIdentity Whether the address has a verified identity
     */
    function hasVerifiedIdentity(address user) external view returns (bool hasVerifiedIdentity) {
        hasVerifiedIdentity = identities[user].isActive && identities[user].isVerified;
    }
    
    /**
     * @dev Get address by identity hash
     * @param identityHash Hash of the identity
     * @return userAddress Address associated with the identity hash
     */
    function getAddressByIdentityHash(bytes32 identityHash) external view returns (address userAddress) {
        userAddress = identityHashToAddress[identityHash];
    }
    
    /**
     * @dev Get total number of verifications for a user
     * @param user Address of the user
     * @return count Number of verifications
     */
    function getVerificationCount(address user) external view returns (uint256 count) {
        count = verifications[user].length;
    }
    
    /**
     * @dev Check if an address is an authorized verifier
     * @param verifier Address to check
     * @return isAuthorized Whether the address is an authorized verifier
     */
    function isAuthorizedVerifier(address verifier) external view returns (bool isAuthorized) {
        isAuthorized = authorizedVerifiers[verifier];
    }
} 