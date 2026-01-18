// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/access/AccessControl.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/security/ReentrancyGuard.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/security/Pausable.sol";

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
    
    /// @dev Mapping to prevent front-running (commitment scheme)
    mapping(bytes32 => bool) private commitments;
    
    /// @dev Nonce for each intake officer to prevent replay attacks
    mapping(address => uint256) public officerNonces;
    
    // =====================================================
    // EVENTS
    // =====================================================
    
    /**
     * @dev Emitted when a new report is submitted
     * @param reportId Unique identifier for the report
     * @param reportHash SHA-256 hash of the report
     * @param intakeOfficer Address of submitting officer
     * @param timestamp Block timestamp
     * @param blockNumber Block number
     */
    event ReportSubmitted(
        string indexed reportId,
        bytes32 indexed reportHash,
        address indexed intakeOfficer,
        uint256 timestamp,
        uint256 blockNumber
    );
    
    /**
     * @dev Emitted when a commitment is made (anti-front-running)
     * @param commitment Hash of the commitment
     * @param officer Address of the officer making commitment
     */
    event CommitmentMade(bytes32 indexed commitment, address indexed officer);
    
    /**
     * @dev Emitted when an intake officer is added
     * @param officer Address of the new officer
     * @param admin Address of the admin who added the officer
     */
    event IntakeOfficerAdded(address indexed officer, address indexed admin);
    
    /**
     * @dev Emitted when an intake officer is removed
     * @param officer Address of the removed officer
     * @param admin Address of the admin who removed the officer
     */
    event IntakeOfficerRemoved(address indexed officer, address indexed admin);
    
    // =====================================================
    // MODIFIERS
    // =====================================================
    
    /**
     * @dev Modifier to check if caller is an authorized intake officer
     */
    modifier onlyIntakeOfficer() {
        if (!hasRole(INTAKE_OFFICER_ROLE, msg.sender)) {
            revert UnauthorizedAccess();
        }
        _;
    }
    
    /**
     * @dev Modifier to validate report ID format
     * @param reportId The report ID to validate
     */
    modifier validReportId(string memory reportId) {
        if (bytes(reportId).length == 0 || bytes(reportId).length > 64) {
            revert InvalidReportId();
        }
        _;
    }
    
    /**
     * @dev Modifier to validate SHA-256 hash format
     * @param hash The hash to validate
     */
    modifier validHash(bytes32 hash) {
        if (hash == bytes32(0)) {
            revert InvalidHash();
        }
        _;
    }
    
    // =====================================================
    // CONSTRUCTOR
    // =====================================================
    
    /**
     * @dev Constructor sets up initial roles
     * @param initialAdmin Address to be granted admin role
     */
    constructor(address initialAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);
        
        // Set role hierarchy
        _setRoleAdmin(INTAKE_OFFICER_ROLE, ADMIN_ROLE);
    }
    
    // =====================================================
    // CORE FUNCTIONS
    // =====================================================
    
    /**
     * @dev Submit a report hash with anti-front-running protection
     * @param reportId Unique identifier for the report
     * @param reportHash SHA-256 hash of the report
     * @param nonce Nonce to prevent replay attacks
     * @notice This function implements the commit-reveal scheme for front-running protection
     */
    function submitReport(
        string memory reportId,
        bytes32 reportHash,
        uint256 nonce
    ) 
        external 
        onlyIntakeOfficer 
        whenNotPaused 
        nonReentrant 
        validReportId(reportId)
        validHash(reportHash)
    {
        // Check if report already exists (immutability constraint)
        if (reports[reportId].exists) {
            revert ReportAlreadyExists(reportId);
        }
        
        // Verify nonce to prevent replay attacks
        require(nonce == officerNonces[msg.sender] + 1, "Invalid nonce");
        
        // Update nonce
        officerNonces[msg.sender] = nonce;
        
        // Store the report (immutable after this point)
        reports[reportId] = ReportRecord({
            reportHash: reportHash,
            timestamp: block.timestamp,
            intakeOfficer: msg.sender,
            blockNumber: block.number,
            exists: true
        });
        
        // Add to enumeration array
        reportIds.push(reportId);
        
        // Increment counter
        totalReports++;
        
        // Emit event for transparency
        emit ReportSubmitted(
            reportId,
            reportHash,
            msg.sender,
            block.timestamp,
            block.number
        );
    }
    
    /**
     * @dev Commit to a future report submission (anti-front-running)
     * @param commitment Hash of (reportId + reportHash + nonce + secret)
     * @notice This should be called before submitReport to prevent front-running
     */
    function commitToSubmission(bytes32 commitment) 
        external 
        onlyIntakeOfficer 
        whenNotPaused 
    {
        require(commitment != bytes32(0), "Invalid commitment");
        require(!commitments[commitment], "Commitment already exists");
        
        commitments[commitment] = true;
        
        emit CommitmentMade(commitment, msg.sender);
    }
    
    /**
     * @dev Verify a commitment matches the submitted data
     * @param reportId The report ID
     * @param reportHash The report hash
     * @param nonce The nonce used
     * @param secret The secret used in commitment
     * @return bool Whether the commitment is valid
     */
    function verifyCommitment(
        string memory reportId,
        bytes32 reportHash,
        uint256 nonce,
        bytes32 secret
    ) external view returns (bool) {
        bytes32 commitment = keccak256(
            abi.encodePacked(reportId, reportHash, nonce, secret)
        );
        return commitments[commitment];
    }
    
    // =====================================================
    // VIEW FUNCTIONS
    // =====================================================
    
    /**
     * @dev Get report information by ID
     * @param reportId The report ID to query
     * @return ReportRecord The complete report record
     */
    function getReport(string memory reportId) 
        external 
        view 
        returns (ReportRecord memory) 
    {
        if (!reports[reportId].exists) {
            revert ReportNotFound(reportId);
        }
        return reports[reportId];
    }
    
    /**
     * @dev Check if a report exists
     * @param reportId The report ID to check
     * @return bool Whether the report exists
     */
    function reportExists(string memory reportId) external view returns (bool) {
        return reports[reportId].exists;
    }
    
    /**
     * @dev Get report hash and verification data
     * @param reportId The report ID to query
     * @return reportHash The SHA-256 hash
     * @return timestamp When it was submitted
     * @return intakeOfficer Who submitted it
     * @return blockNumber Block number of submission
     */
    function getReportVerificationData(string memory reportId) 
        external 
        view 
        returns (
            bytes32 reportHash,
            uint256 timestamp,
            address intakeOfficer,
            uint256 blockNumber
        ) 
    {
        if (!reports[reportId].exists) {
            revert ReportNotFound(reportId);
        }
        
        ReportRecord memory report = reports[reportId];
        return (
            report.reportHash,
            report.timestamp,
            report.intakeOfficer,
            report.blockNumber
        );
    }
    
    /**
     * @dev Get all report IDs (for enumeration)
     * @return string[] Array of all report IDs
     * @notice Use with caution for large datasets
     */
    function getAllReportIds() external view returns (string[] memory) {
        return reportIds;
    }
    
    /**
     * @dev Get report IDs in batches (gas-optimized)
     * @param offset Starting index
     * @param limit Number of records to return
     * @return string[] Array of report IDs
     */
    function getReportIdsBatch(uint256 offset, uint256 limit) 
        external 
        view 
        returns (string[] memory) 
    {
        require(offset < reportIds.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > reportIds.length) {
            end = reportIds.length;
        }
        
        string[] memory batch = new string[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            batch[i - offset] = reportIds[i];
        }
        
        return batch;
    }
    
    // =====================================================
    // ADMIN FUNCTIONS
    // =====================================================
    
    /**
     * @dev Add a new intake officer
     * @param officer Address to be granted intake officer role
     */
    function addIntakeOfficer(address officer) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(officer != address(0), "Invalid officer address");
        _grantRole(INTAKE_OFFICER_ROLE, officer);
        emit IntakeOfficerAdded(officer, msg.sender);
    }
    
    /**
     * @dev Remove an intake officer
     * @param officer Address to be removed from intake officer role
     */
    function removeIntakeOfficer(address officer) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        _revokeRole(INTAKE_OFFICER_ROLE, officer);
        emit IntakeOfficerRemoved(officer, msg.sender);
    }
    
    /**
     * @dev Emergency pause function
     * @notice Can only be called by admin in case of security issues
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    // =====================================================
    // SECURITY & UTILITY FUNCTIONS
    // =====================================================
    
    /**
     * @dev Generate a commitment hash for front-running protection
     * @param reportId The report ID
     * @param reportHash The report hash
     * @param nonce The nonce
     * @param secret A secret value
     * @return bytes32 The commitment hash
     */
    function generateCommitment(
        string memory reportId,
        bytes32 reportHash,
        uint256 nonce,
        bytes32 secret
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(reportId, reportHash, nonce, secret));
    }
    
    /**
     * @dev Verify report integrity against stored hash
     * @param reportId The report ID
     * @param reportContent The raw report content
     * @return bool Whether the content matches the stored hash
     */
    function verifyReportIntegrity(
        string memory reportId,
        bytes memory reportContent
    ) external view returns (bool) {
        if (!reports[reportId].exists) {
            revert ReportNotFound(reportId);
        }
        
        bytes32 computedHash = sha256(reportContent);
        return computedHash == reports[reportId].reportHash;
    }
    
    /**
     * @dev Get contract statistics
     * @return totalReportsCount Total number of reports
     * @return contractPaused Whether contract is paused
     */
    function getContractStats() 
        external 
        view 
        returns (
            uint256 totalReportsCount,
            bool contractPaused
        ) 
    {
        totalReportsCount = totalReports;
        contractPaused = paused();
    }
    
    // =====================================================
    // INTERFACE SUPPORT
    // =====================================================
    
    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
