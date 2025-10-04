// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title CertificateRegistry
 * @dev Smart contract for storing and verifying government certificates on blockchain
 */
contract CertificateRegistry {
    struct Certificate {
        string applicationId;
        string ipfsHash;
        string certificateType;
        address issuedBy;
        uint256 issuedAt;
        bool isValid;
    }
    
    // Mapping from application ID to certificate
    mapping(string => Certificate) public certificates;
    
    // Mapping of authorized issuers
    mapping(address => bool) public authorizedIssuers;
    
    // Owner of the contract
    address public owner;
    
    // Events
    event CertificateIssued(
        string indexed applicationId,
        string ipfsHash,
        string certificateType,
        address indexed issuedBy,
        uint256 issuedAt
    );
    
    event CertificateRevoked(
        string indexed applicationId,
        address indexed revokedBy,
        uint256 revokedAt
    );
    
    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedIssuers[msg.sender], "Not an authorized issuer");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }
    
    /**
     * @dev Issue a new certificate
     */
    function issueCertificate(
        string memory _applicationId,
        string memory _ipfsHash,
        string memory _certificateType
    ) public onlyAuthorized {
        require(bytes(_applicationId).length > 0, "Application ID cannot be empty");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(!certificates[_applicationId].isValid, "Certificate already exists");
        
        certificates[_applicationId] = Certificate({
            applicationId: _applicationId,
            ipfsHash: _ipfsHash,
            certificateType: _certificateType,
            issuedBy: msg.sender,
            issuedAt: block.timestamp,
            isValid: true
        });
        
        emit CertificateIssued(
            _applicationId,
            _ipfsHash,
            _certificateType,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @dev Revoke a certificate
     */
    function revokeCertificate(string memory _applicationId) public onlyAuthorized {
        require(certificates[_applicationId].isValid, "Certificate does not exist or already revoked");
        
        certificates[_applicationId].isValid = false;
        
        emit CertificateRevoked(_applicationId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Verify a certificate
     */
    function verifyCertificate(string memory _applicationId) 
        public 
        view 
        returns (
            bool isValid,
            string memory ipfsHash,
            string memory certificateType,
            address issuedBy,
            uint256 issuedAt
        ) 
    {
        Certificate memory cert = certificates[_applicationId];
        return (
            cert.isValid,
            cert.ipfsHash,
            cert.certificateType,
            cert.issuedBy,
            cert.issuedAt
        );
    }
    
    /**
     * @dev Authorize a new issuer
     */
    function authorizeIssuer(address _issuer) public onlyOwner {
        require(_issuer != address(0), "Invalid issuer address");
        authorizedIssuers[_issuer] = true;
        emit IssuerAuthorized(_issuer);
    }
    
    /**
     * @dev Revoke an issuer's authorization
     */
    function revokeIssuer(address _issuer) public onlyOwner {
        authorizedIssuers[_issuer] = false;
        emit IssuerRevoked(_issuer);
    }
}
