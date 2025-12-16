// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract DigiSewaLicenses {
    // State variables for document management
    struct DocumentRecord {
        string encryptedCID;           // Encrypted IPFS CID
        string documentHash;          // Hash of the document for verification
        uint256 departmentId;         // Department that owns the document
        uint256 timestamp;            // When document was shared
        bool isActive;                // Whether document is still active
    }
    
    struct AccessCode {
        string codeHash;              // Hash of the access code
        uint256 departmentId;         // Department that can use this code
        uint256 timestamp;            // When code was generated
        bool isUsed;                  // Whether code has been used
    }
    
    // Mappings
    mapping(string => DocumentRecord) public documents;           // applicationId => DocumentRecord
    mapping(string => AccessCode) public accessCodes;             // applicationId => AccessCode
    mapping(string => bool) public documentExists;                // applicationId => exists
    mapping(string => bool) public accessCodeExists;              // applicationId => has access code
    
    // Events
    event DocumentShared(
        string indexed applicationId,
        string indexed encryptedCID,
        string indexed documentHash,
        uint256 departmentId,
        uint256 timestamp
    );
    
    event AccessCodeGenerated(
        string indexed applicationId,
        string indexed codeHash,
        uint256 departmentId,
        uint256 timestamp
    );
    
    event DocumentAccessed(
        string indexed applicationId,
        uint256 departmentId,
        uint256 timestamp
    );
    
    event DocumentVerified(
        string indexed applicationId,
        bool isValid,
        uint256 timestamp
    );

    /**
     * @dev Function 1: shareDocumentWithDepartment
     * Called by Applicant (via Backend)
     * Logs the application, links it to a department, stores the encrypted CID and its hash
     */
    function shareDocumentWithDepartment(
        string memory applicationId,
        string memory encryptedCID,
        string memory documentHash,
        uint256 departmentId
    ) external {
        require(!documentExists[applicationId], "Document already exists for this application");
        require(bytes(encryptedCID).length > 0, "Encrypted CID cannot be empty");
        require(bytes(documentHash).length > 0, "Document hash cannot be empty");
        require(departmentId > 0, "Invalid department ID");
        
        documents[applicationId] = DocumentRecord({
            encryptedCID: encryptedCID,
            documentHash: documentHash,
            departmentId: departmentId,
            timestamp: block.timestamp,
            isActive: true
        });
        
        documentExists[applicationId] = true;
        
        emit DocumentShared(applicationId, encryptedCID, documentHash, departmentId, block.timestamp);
    }

    /**
     * @dev Function 2: getDocumentCode
     * Called by Applicant (via Backend)
     * Generates and returns the secret accessCode. Stores its hash on-chain
     */
    function getDocumentCode(
        string memory applicationId,
        string memory accessCodeHash
    ) external returns (string memory) {
        require(documentExists[applicationId], "Document does not exist for this application");
        require(!accessCodeExists[applicationId], "Access code already generated for this application");
        require(bytes(accessCodeHash).length > 0, "Access code hash cannot be empty");
        
        // Generate a unique access code (in real implementation, this would be generated off-chain)
        string memory accessCode = string(abi.encodePacked(
            "DIGI_",
            applicationId,
            "_",
            uint2str(block.timestamp)
        ));
        
        accessCodes[applicationId] = AccessCode({
            codeHash: accessCodeHash,
            departmentId: documents[applicationId].departmentId,
            timestamp: block.timestamp,
            isUsed: false
        });
        
        accessCodeExists[applicationId] = true;
        
        emit AccessCodeGenerated(applicationId, accessCodeHash, documents[applicationId].departmentId, block.timestamp);
        
        return accessCode;
    }

    /**
     * @dev Function 3: getDocumentCID
     * Called by Department (via Backend)
     * Access Control Gate: Returns the encrypted CID only if the correct accessCode is provided
     */
    function getDocumentCID(
        string memory applicationId,
        string memory providedAccessCodeHash
    ) external returns (string memory) {
        require(documentExists[applicationId], "Document does not exist for this application");
        require(accessCodeExists[applicationId], "No access code generated for this application");
        require(documents[applicationId].isActive, "Document is no longer active");
        
        AccessCode storage accessCode = accessCodes[applicationId];
        
        // Verify the access code hash matches
        require(
            keccak256(bytes(accessCode.codeHash)) == keccak256(bytes(providedAccessCodeHash)),
            "Invalid access code"
        );
        
        // Mark access code as used
        accessCodes[applicationId].isUsed = true;
        
        emit DocumentAccessed(applicationId, accessCode.departmentId, block.timestamp);
        
        return documents[applicationId].encryptedCID;
    }

    /**
     * @dev Function 4: verifyDocument
     * Called by Anyone (via Backend)
     * Verifies the integrity of a downloaded document by comparing its hash to the on-chain record
     */
    function verifyDocument(
        string memory applicationId,
        string memory providedDocumentHash
    ) external returns (bool) {
        require(documentExists[applicationId], "Document does not exist for this application");
        
        bool isValid = keccak256(bytes(documents[applicationId].documentHash)) == 
                      keccak256(bytes(providedDocumentHash));
        
        emit DocumentVerified(applicationId, isValid, block.timestamp);
        
        return isValid;
    }

    /**
     * @dev Helper function to get document information
     */
    function getDocumentInfo(string memory applicationId) external view returns (
        string memory encryptedCID,
        string memory documentHash,
        uint256 departmentId,
        uint256 timestamp,
        bool isActive
    ) {
        require(documentExists[applicationId], "Document does not exist for this application");
        
        DocumentRecord storage doc = documents[applicationId];
        return (doc.encryptedCID, doc.documentHash, doc.departmentId, doc.timestamp, doc.isActive);
    }

    /**
     * @dev Helper function to check if access code exists and is valid
     */
    function checkAccessCode(string memory applicationId) external view returns (
        bool exists,
        bool isUsed,
        uint256 departmentId
    ) {
        if (!accessCodeExists[applicationId]) {
            return (false, false, 0);
        }
        
        AccessCode storage accessCode = accessCodes[applicationId];
        return (true, accessCode.isUsed, accessCode.departmentId);
    }

    /**
     * @dev Helper function to deactivate a document
     */
    function deactivateDocument(string memory applicationId) external {
        require(documentExists[applicationId], "Document does not exist for this application");
        documents[applicationId].isActive = false;
    }

    /**
     * @dev Utility function to convert uint to string
     */
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    // Legacy functions for backward compatibility
    function recordIssuance(
        string memory licenseId, 
        string memory payloadHash, 
        string memory issuerPubKey, 
        uint256 timestamp
    ) external {
        // Legacy implementation - can be removed if not needed
    }

    function revokeLicense(
        string memory licenseId, 
        string memory reason, 
        uint256 timestamp
    ) external {
        // Legacy implementation - can be removed if not needed
    }
    // ============================================
// NEW: APPROVAL TRACKING
// ============================================

struct ApprovalRecord {
    string department;
    bytes32 approvalHash;
    string action;
    uint256 timestamp;
    address approver;
}

mapping(string => ApprovalRecord[]) public applicationApprovals;

event ApprovalRecorded(
    string indexed applicationId,
    string department,
    bytes32 approvalHash,
    string action,
    uint256 timestamp,
    address approver
);

function recordApproval(
    string memory _applicationId,
    string memory _department,
    bytes32 _approvalHash,
    string memory _action
) external {
    applicationApprovals[_applicationId].push(ApprovalRecord({
        department: _department,
        approvalHash: _approvalHash,
        action: _action,
        timestamp: block.timestamp,
        approver: msg.sender
    }));

    emit ApprovalRecorded(
        _applicationId,
        _department,
        _approvalHash,
        _action,
        block.timestamp,
        msg.sender
    );
}

function getApprovals(string memory _applicationId) 
    external 
    view 
    returns (ApprovalRecord[] memory) 
{
    return applicationApprovals[_applicationId];
}

}