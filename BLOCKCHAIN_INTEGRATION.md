# VerifiableIntakeProtocol Integration Guide

## Overview

The **VerifiableIntakeProtocol** smart contract has been integrated into the EMI system. This contract provides a secure, immutable record of medical intake reports on the blockchain using SHA-256 hashing and role-based access control.

## Smart Contract Features

### Core Features
- **Immutable Report Storage**: Once submitted, reports cannot be modified
- **SHA-256 Hashing**: Uses industry-standard cryptographic hashing
- **Role-Based Access Control**: Separates admin and intake officer roles
- **Anti-Front-Running Protection**: Commit-reveal scheme to prevent transaction manipulation
- **Replay Attack Prevention**: Nonce-based system for each intake officer
- **Emergency Controls**: Pausable functionality for security incidents

### Key Functions

#### Submit Report
```solidity
submitReport(string reportId, bytes32 reportHash, uint256 nonce)
```
Submits a new report hash to the blockchain.

#### Commit-Reveal Scheme
```solidity
commitToSubmission(bytes32 commitment)
verifyCommitment(reportId, reportHash, nonce, secret)
```
Prevents front-running attacks by requiring a commitment before submission.

#### Verification
```solidity
getReport(string reportId)
reportExists(string reportId)
getReportVerificationData(string reportId)
verifyReportIntegrity(string reportId, bytes reportContent)
```

#### Admin Functions
```solidity
addIntakeOfficer(address officer)
removeIntakeOfficer(address officer)
pause()
unpause()
```

## Environment Variables

Add the following to your `.env.local` file:

```bash
# Contract Address (deploy contract first)
NEXT_PUBLIC_VERIFIABLE_INTAKE_CONTRACT_ADDRESS=0x...

# RPC URL for blockchain connection
NEXT_PUBLIC_VERIFIABLE_INTAKE_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Chain ID (1 = Ethereum Mainnet, 5 = Goerli Testnet, 137 = Polygon)
NEXT_PUBLIC_VERIFIABLE_INTAKE_CHAIN_ID=1

# Private key for server-side transactions (NEVER commit this!)
VERIFIABLE_INTAKE_PRIVATE_KEY=your_private_key_here

# Admin wallet address
VERIFIABLE_INTAKE_ADMIN_ADDRESS=0x...
```

## TypeScript Integration

### Import the utilities

```typescript
import {
  hashReport,
  submitReportHash,
  verifyReport,
  getReportDetails,
  getContractStats,
  generateSecret,
  VERIFIABLE_INTAKE_ABI,
} from "@/lib/kairo";
```

### Example: Submit a Report

```typescript
// 1. Generate report hash
const reportData = {
  id: "RPT-12345",
  patientId: "PT-9876",
  chiefComplaint: "Chest pain",
  timestamp: new Date(),
  // ... other report data
};

const reportHash = hashReport(reportData);

// 2. Get current nonce for the officer
// const nonce = await getCurrentNonce(officerAddress);

// 3. Submit to blockchain with commit-reveal
const result = await submitReportHash(
  "RPT-12345",
  reportHash,
  1 // nonce
);

console.log("Transaction:", result.transactionHash);
console.log("Block:", result.blockNumber);
```

### Example: Verify a Report

```typescript
// Verify report exists
const verification = await verifyReport("RPT-12345");

if (verification.isVerified) {
  console.log("Report verified on-chain!");
  console.log("Submitted by:", verification.report?.intakeOfficer);
  console.log("Block explorer:", verification.explorerUrl);
} else {
  console.log("Report not found on blockchain");
}
```

### Example: Get Report Details

```typescript
const report = await getReportDetails("RPT-12345");

if (report) {
  console.log("Hash:", report.reportHash);
  console.log("Timestamp:", report.timestamp);
  console.log("Officer:", report.intakeOfficer);
  console.log("Block:", report.blockNumber);
}
```

### Example: Get Contract Statistics

```typescript
const stats = await getContractStats();

if (stats) {
  console.log("Total Reports:", stats.totalReports);
  console.log("Active Officers:", stats.totalOfficers);
}
```

## Contract Deployment

### Prerequisites

1. Install OpenZeppelin contracts:
```bash
npm install @openzeppelin/contracts
```

2. Install Hardhat or Foundry for deployment

### Deployment Steps

1. **Compile the contract**:
```bash
npx hardhat compile
```

2. **Deploy to network**:
```bash
npx hardhat run scripts/deploy.ts --network goerli
```

3. **Verify on Etherscan**:
```bash
npx hardhat verify --network goerli DEPLOYED_CONTRACT_ADDRESS "ADMIN_ADDRESS"
```

4. **Add intake officers**:
```solidity
// As admin, grant INTAKE_OFFICER_ROLE to authorized addresses
contract.addIntakeOfficer("0x...");
```

### Example Deployment Script

```typescript
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying VerifiableIntakeProtocol with account:", deployer.address);

  const VerifiableIntakeProtocol = await ethers.getContractFactory("VerifiableIntakeProtocol");
  const contract = await VerifiableIntakeProtocol.deploy(deployer.address);

  await contract.deployed();

  console.log("VerifiableIntakeProtocol deployed to:", contract.address);
  
  // Add intake officers
  const officerAddress = "0x...";
  await contract.addIntakeOfficer(officerAddress);
  console.log("Added intake officer:", officerAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

## Security Considerations

### Audit Recommendations

1. **Submit to kairoaisec.com**: Get a professional security audit
2. **Test thoroughly**: Run extensive tests on testnet before mainnet deployment
3. **Monitor events**: Set up event listeners for suspicious activity
4. **Key management**: Use hardware wallets for admin keys
5. **Rate limiting**: Implement off-chain rate limiting for submissions

### Best Practices

- **Never store PHI on-chain**: Only store hashes, never patient data
- **Rotate nonces**: Ensure each transaction uses the correct nonce
- **Use commit-reveal**: Always use the commitment scheme for high-value transactions
- **Monitor gas prices**: Set appropriate gas limits and prices
- **Backup data**: Maintain off-chain backups of all reports

## Testing

### Unit Tests Example

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("VerifiableIntakeProtocol", function () {
  it("Should submit a report", async function () {
    const [admin, officer] = await ethers.getSigners();
    
    const Contract = await ethers.getContractFactory("VerifiableIntakeProtocol");
    const contract = await Contract.deploy(admin.address);
    
    // Add officer
    await contract.addIntakeOfficer(officer.address);
    
    // Submit report
    const reportId = "RPT-001";
    const reportHash = ethers.utils.sha256(ethers.utils.toUtf8Bytes("test report"));
    const nonce = 1;
    
    await contract.connect(officer).submitReport(reportId, reportHash, nonce);
    
    // Verify
    const exists = await contract.reportExists(reportId);
    expect(exists).to.be.true;
  });
});
```

## Troubleshooting

### Common Issues

1. **"Invalid nonce" error**: 
   - Check current nonce with `officerNonces(address)`
   - Nonce must be `currentNonce + 1`

2. **"UnauthorizedAccess" error**:
   - Ensure address has `INTAKE_OFFICER_ROLE`
   - Check with `hasRole(INTAKE_OFFICER_ROLE, address)`

3. **"ReportAlreadyExists" error**:
   - Each reportId must be unique
   - Use UUID or timestamp-based IDs

4. **Transaction fails**:
   - Check contract is not paused
   - Ensure sufficient gas limit
   - Verify network connection

## Resources

- **OpenZeppelin Documentation**: https://docs.openzeppelin.com/
- **Kairo Security**: https://kairoaisec.com
- **Ethers.js Docs**: https://docs.ethers.org/
- **Hardhat Documentation**: https://hardhat.org/docs

## Support

For issues or questions:
1. Check the contract events for detailed error information
2. Review the transaction on a block explorer
3. Consult the TypeScript integration examples
4. Test on testnet before mainnet deployment
