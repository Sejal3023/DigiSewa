# 🚀 DigiSewa Document System - Complete Setup Guide

## ✅ What's Been Implemented

### Phase 1: Document Preparation & Upload (Applicant Side)
- ✅ File upload with validation (PDF, DOC, DOCX, images, text)
- ✅ AES-256 encryption of documents
- ✅ Upload to Pinata IPFS with metadata
- ✅ Smart contract registration (`shareDocumentWithDepartment`)
- ✅ Access code generation and blockchain storage
- ✅ Complete audit trail

### Phase 2: Document Retrieval & Decryption (Department Side)
- ✅ Access code validation via smart contract
- ✅ Document retrieval from IPFS
- ✅ Document integrity verification
- ✅ Decryption capabilities
- ✅ Secure access control

## 🔧 API Endpoints

### Document Upload & Management
```
POST /documents/upload
- Upload document with encryption
- Body: FormData with file, departmentId, applicationId
- Response: { success, data: { applicationId, cid, accessCode, blockchainTxHash } }

POST /documents/access-code
- Generate new access code
- Body: { applicationId }
- Response: { success, data: { applicationId, accessCode } }
```

### Document Retrieval & Verification
```
POST /documents/retrieve
- Retrieve document with access code
- Body: { applicationId, accessCode }
- Response: { success, data: { cid, documentData, documentHash, isValid } }

POST /documents/verify
- Verify document integrity
- Body: { applicationId, documentHash }
- Response: { success, data: { isValid } }

GET /documents/info/:applicationId
- Get document information
- Response: { success, data: { encryptedCID, documentHash, departmentId, isActive } }

POST /documents/decrypt
- Decrypt document data
- Body: { encryptedData, aesKey, iv }
- Response: { success, data: { decryptedData } }
```

## 🚀 How to Start the System

### 1. Start Hardhat Node (Terminal 1)
```bash
cd backend
npx hardhat node
```

### 2. Start Backend Server (Terminal 2)
```bash
cd backend
npm start
```

### 3. Test the System
```bash
cd backend
node scripts/test-document-flow.cjs
```

## 📋 Complete Workflow

### For Applicants (Upload Process):
1. **Select File**: Choose document in React frontend
2. **Upload**: Send to `POST /documents/upload` with:
   - File (multipart/form-data)
   - `departmentId`: Target department
   - `applicationId`: Unique application identifier
3. **Response**: Get back:
   - `applicationId`: For tracking
   - `accessCode`: To share with department
   - `blockchainTxHash`: Transaction proof

### For Departments (Retrieval Process):
1. **Get Access Code**: From applicant
2. **Retrieve**: Send to `POST /documents/retrieve` with:
   - `applicationId`: From applicant
   - `accessCode`: From applicant
3. **Response**: Get back:
   - `documentData`: Encrypted document (base64)
   - `documentHash`: For verification
   - `isValid`: Integrity check result

## 🔐 Security Features

### Encryption & Access Control:
- **AES-256 Encryption**: Documents encrypted before IPFS upload
- **Access Code System**: Smart contract validates access codes
- **Document Integrity**: SHA-256 hashing for verification
- **Audit Trail**: All operations recorded on blockchain

### File Validation:
- **File Size Limit**: 10MB maximum
- **File Type Validation**: PDF, DOC, DOCX, images, text only
- **Content Verification**: Hash-based integrity checking

## 🧪 Testing

### Manual Testing:
```bash
# Test document upload
curl -X POST http://localhost:5001/documents/upload \
  -F "document=@test.pdf" \
  -F "departmentId=1" \
  -F "applicationId=TEST_001"

# Test document retrieval
curl -X POST http://localhost:5001/documents/retrieve \
  -H "Content-Type: application/json" \
  -d '{"applicationId":"TEST_001","accessCode":"DIGI_TEST_001_1234567890"}'
```

### Automated Testing:
```bash
node scripts/test-document-flow.cjs
```

## 🔧 Configuration

### Environment Variables:
```env
# Pinata IPFS Configuration
PINATA_API_KEY=3c20da6a7a85e758ab9f
PINATA_SECRET_KEY=09ef08934818cee8db11286ca66af0cc9b8d70f1ec774a82243b245064feabf6
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Blockchain Configuration
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_PRIVATE_KEY=fee34a983bcc390e76dd59cacda9eaac99564cb1d664efd19463007bda48cfcc
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

## 📊 System Architecture

```
Frontend (React) → Backend API → Pinata IPFS
                      ↓
                 Smart Contract (Blockchain)
                      ↓
                 Document Verification
```

## 🎯 Next Steps

1. **Frontend Integration**: Connect React frontend to new APIs
2. **Department Keys**: Implement RSA key management for departments
3. **Database Storage**: Store document metadata in PostgreSQL
4. **User Authentication**: Add JWT-based access control
5. **Production Deployment**: Deploy to testnet/mainnet

## 🚨 Troubleshooting

### Common Issues:
1. **Hardhat Node Not Running**: Start with `npx hardhat node`
2. **Backend Not Starting**: Check port 5001 is available
3. **File Upload Fails**: Check file size and type restrictions
4. **Blockchain Errors**: Verify contract address and private key

### Debug Commands:
```bash
# Check Hardhat node
curl http://localhost:8545

# Check backend health
curl http://localhost:5001/health

# Test blockchain connection
npx hardhat run scripts/test-contract-simple.cjs --network localhost
```

---
**Status**: ✅ **DOCUMENT SYSTEM FULLY IMPLEMENTED AND READY TO USE!**

The complete document upload and retrieval system is now operational with:
- ✅ IPFS storage via Pinata
- ✅ Blockchain integration
- ✅ AES encryption
- ✅ Access control
- ✅ Document verification
- ✅ Complete API endpoints

