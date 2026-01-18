// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title VerifiableIntakeProtocol
 * @dev A secure smart contract for establishing legal 'Source of Truth' on-chain
 * @notice This contract allows authorized Intake Officers to submit immutable SHA-256 hashes
 */
contract VerifiableIntakeProtocol is AccessControl, ReentrancyGuard, Pausable {
    
    // =====================================================
    // ROLES & CONSTANTS
    // =====================================================
    
    bytes32 public constant INTAKE_OFFICER_ROLE = keccak256("INTAKE_OFFICER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // =====================================================
    // CUSTOM ERRORS
    // =====================================================
    
    error ReportAlreadyExists(string reportId);
    error InvalidReportId();
    error InvalidHash();
    error UnauthorizedAccess();
    error ReportNotFound(string reportId);
    
    // =====================================================
    // DATA STRUCTURES
    // =====================================================
    
    /**
     * @dev Struct to store report information
     * @param reportHash SHA-256 hash of the report
     * @param timestamp Block timestamp when submitted
     * @param intakeOfficer Address of the officer who submitted
     * @param blockNumber Block number when submitted
     * @param exists Flag to check if report exists (gas optimization)
     */
    struct ReportRecord {
        bytes32 reportHash;
        uint256 timestamp;
        address intakeOfficer;
        uint256 blockNumber;
        bool exists;
    }
    
    // =====================================================
    // STATE VARIABLES
    // =====================================================
    
    /// @dev Mapping from reportId to ReportRecord
    mapping(string => ReportRecord) private reports;
    
    /// @dev Array to track all report IDs for enumeration
    string[] private reportIds;
    
    /// @dev Counter for total reports (gas-optimized alternative to array length)
    uint256 public totalReports;
    
    // ============ Structs ============
    
    /**
     * @notice Structure holding report registration details
     * @param timestamp Block timestamp when report was registered
     * @param registrar Address that registered the report
     * @param exists Whether the report has been registered
     */
    struct ReportRecord {
        uint256 timestamp;
        address registrar;
        bool exists;
    }
    
    // ============ Events ============
    
    /**
     * @notice Emitted when a new report hash is registered
     * @param reportHash The keccak256 hash of the report
     * @param registrar The address that registered the report
     * @param timestamp The block timestamp of registration
     */
    event ReportRegistered(
        bytes32 indexed reportHash,
        address indexed registrar,
        uint256 timestamp
    );
    
    /**
     * @notice Emitted when a registrar is authorized or deauthorized
     * @param registrar The registrar address
     * @param authorized Whether the registrar is now authorized
     */
    event RegistrarUpdated(
        address indexed registrar,
        bool authorized
    );
    
    /**
     * @notice Emitted when ownership is transferred
     * @param previousOwner The previous owner address
     * @param newOwner The new owner address
     */
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    
    // ============ Modifiers ============
    
    /**
     * @notice Restricts function to contract owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "IntakeRegistry: caller is not owner");
        _;
    }
    
    /**
     * @notice Restricts function to authorized registrars
     */
    modifier onlyAuthorized() {
        require(
            authorizedRegistrars[msg.sender] || msg.sender == owner,
            "IntakeRegistry: caller is not authorized"
        );
        _;
    }
    
    // ============ Constructor ============
    
    /**
     * @notice Initializes the contract with the deployer as owner
     */
    constructor() {
        owner = msg.sender;
        authorizedRegistrars[msg.sender] = true;
        emit OwnershipTransferred(address(0), msg.sender);
        emit RegistrarUpdated(msg.sender, true);
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Register a new report hash on-chain
     * @param reportHash The keccak256 hash of the clinical report
     * @dev Only authorized registrars can call this function
     * @dev Reverts if the hash has already been registered
     */
    function registerReport(bytes32 reportHash) external onlyAuthorized {
        require(reportHash != bytes32(0), "IntakeRegistry: invalid hash");
        require(!reports[reportHash].exists, "IntakeRegistry: already registered");
        
        reports[reportHash] = ReportRecord({
            timestamp: block.timestamp,
            registrar: msg.sender,
            exists: true
        });
        
        totalReports++;
        
        emit ReportRegistered(reportHash, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Verify if a report hash has been registered
     * @param reportHash The hash to verify
     * @return isRegistered True if the hash exists in the registry
     */
    function verifyReport(bytes32 reportHash) external view returns (bool isRegistered) {
        return reports[reportHash].exists;
    }
    
    /**
     * @notice Get detailed information about a registered report
     * @param reportHash The hash to query
     * @return timestamp The registration timestamp
     * @return registrar The address that registered the report
     * @return exists Whether the report is registered
     */
    function getReportDetails(bytes32 reportHash) 
        external 
        view 
        returns (
            uint256 timestamp,
            address registrar,
            bool exists
        ) 
    {
        ReportRecord memory record = reports[reportHash];
        return (record.timestamp, record.registrar, record.exists);
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Add or remove an authorized registrar
     * @param registrar The address to update
     * @param authorized Whether to authorize or deauthorize
     * @dev Only the owner can call this function
     */
    function setRegistrar(address registrar, bool authorized) external onlyOwner {
        require(registrar != address(0), "IntakeRegistry: invalid address");
        authorizedRegistrars[registrar] = authorized;
        emit RegistrarUpdated(registrar, authorized);
    }
    
    /**
     * @notice Transfer ownership of the contract
     * @param newOwner The address of the new owner
     * @dev Only the current owner can call this function
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "IntakeRegistry: invalid address");
        address previousOwner = owner;
        owner = newOwner;
        authorizedRegistrars[newOwner] = true;
        emit OwnershipTransferred(previousOwner, newOwner);
    }
    
    /**
     * @notice Batch register multiple report hashes
     * @param reportHashes Array of hashes to register
     * @dev Gas-efficient method for registering multiple reports
     * @dev Skips already registered hashes instead of reverting
     */
    function batchRegisterReports(bytes32[] calldata reportHashes) external onlyAuthorized {
        uint256 length = reportHashes.length;
        require(length > 0 && length <= 100, "IntakeRegistry: invalid batch size");
        
        for (uint256 i = 0; i < length; ) {
            bytes32 hash = reportHashes[i];
            
            if (hash != bytes32(0) && !reports[hash].exists) {
                reports[hash] = ReportRecord({
                    timestamp: block.timestamp,
                    registrar: msg.sender,
                    exists: true
                });
                
                totalReports++;
                emit ReportRegistered(hash, msg.sender, block.timestamp);
            }
            
            unchecked { ++i; }
        }
    }
}
