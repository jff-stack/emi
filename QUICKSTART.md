# 🚀 Quick Start Guide - VerifiableIntakeProtocol

## Installation (5 minutes)

### 1. Install Required Dependencies

```bash
# Core blockchain dependencies
npm install ethers viem

# Development dependencies for smart contracts
npm install --save-dev \
  hardhat \
  @nomicfoundation/hardhat-toolbox \
  @nomicfoundation/hardhat-ethers \
  @openzeppelin/contracts \
  dotenv \
  @types/mocha \
  @types/chai
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local and add your values
# (You can skip the contract address for now - add it after deployment)
```

## Testing Locally (2 minutes)

### 1. Compile the Contract

```bash
npm run compile
```

### 2. Run Tests

```bash
npm run test:contract
```

Expected output:
```
VerifiableIntakeProtocol
  Deployment
    ✓ Should set the correct admin
    ✓ Should start with zero reports
  Role Management
    ✓ Should allow admin to add intake officers
    ...
  
  54 passing
```

### 3. Deploy to Local Network

```bash
# Terminal 1: Start local Hardhat node
npx hardhat node

# Terminal 2: Deploy contract
npm run deploy:local
```

## Deploying to Testnet (10 minutes)

### 1. Get Testnet ETH

Get free Sepolia ETH from faucets:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

### 2. Add RPC URL

Sign up for a free RPC provider:
- **Alchemy**: https://www.alchemy.com/ (recommended)
- **Infura**: https://infura.io/

Add to `.env.local`:
```bash
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

### 3. Deploy to Sepolia

```bash
npm run deploy:sepolia
```

Copy the contract address from the output and add to `.env.local`:
```bash
NEXT_PUBLIC_VERIFIABLE_INTAKE_CONTRACT_ADDRESS=0x...
```

### 4. Verify on Etherscan

Get a free API key: https://etherscan.io/myapikey

```bash
# Add to .env.local
ETHERSCAN_API_KEY=your_api_key

# Verify contract
npm run verify:sepolia -- <CONTRACT_ADDRESS> "<ADMIN_ADDRESS>"
```

## First Report Submission (2 minutes)

### 1. Add an Intake Officer

From a script or console:

```typescript
// Using ethers
const contract = new ethers.Contract(
  process.env.NEXT_PUBLIC_VERIFIABLE_INTAKE_CONTRACT_ADDRESS!,
  VERIFIABLE_INTAKE_ABI,
  signer
);

await contract.addIntakeOfficer("0xYourOfficerAddress");
```

### 2. Submit a Test Report

```typescript
import { hashReport, submitReportHash } from "@/lib/kairo";

const testReport = {
  id: "TEST-001",
  patient: "Test Patient",
  complaint: "Testing blockchain integration",
  timestamp: new Date()
};

const hash = hashReport(testReport);
const result = await submitReportHash("TEST-001", hash, 1);

console.log("✅ Report submitted!");
console.log("Transaction:", result.transactionHash);
```

### 3. Verify the Report

```typescript
import { verifyReport } from "@/lib/kairo";

const verification = await verifyReport("TEST-001");

if (verification.isVerified) {
  console.log("✅ Report verified on blockchain!");
  console.log("Officer:", verification.report?.intakeOfficer);
  console.log("Block:", verification.report?.blockNumber);
}
```

## Common Issues & Solutions

### Issue: "Cannot find module 'hardhat'"
**Solution**: Run `npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox`

### Issue: "Invalid nonce"
**Solution**: Get the current nonce first:
```typescript
const nonce = await contract.officerNonces(officerAddress);
// Use nonce + 1 for next submission
```

### Issue: "UnauthorizedAccess"
**Solution**: Make sure the address has INTAKE_OFFICER_ROLE:
```typescript
await contract.addIntakeOfficer(officerAddress);
```

### Issue: "Insufficient funds"
**Solution**: 
- **Testnet**: Get free ETH from faucets
- **Mainnet**: Add ETH to your wallet

### Issue: Contract deployment fails
**Solution**: Check:
1. You have enough ETH for gas
2. RPC URL is correct in .env.local
3. Private key is set correctly

## Next Steps

1. ✅ **Test thoroughly** on testnet before mainnet
2. 🔒 **Security audit** - Submit to [kairoaisec.com](https://kairoaisec.com)
3. 📊 **Monitor** - Set up event listeners for suspicious activity
4. 🔑 **Secure keys** - Use hardware wallets for production
5. 📝 **Document** - Keep records of all deployments

## Production Checklist

Before deploying to mainnet:

- [ ] All tests passing
- [ ] Contract verified on Etherscan
- [ ] Security audit completed
- [ ] Keys secured (hardware wallet)
- [ ] Backup admin key stored safely
- [ ] Event monitoring set up
- [ ] Gas price strategy defined
- [ ] Emergency pause procedure documented
- [ ] Initial officers identified and added
- [ ] Frontend integration tested
- [ ] Rollback plan documented

## Resources

- **Full Documentation**: [BLOCKCHAIN_INTEGRATION.md](./BLOCKCHAIN_INTEGRATION.md)
- **Smart Contract**: [src/contracts/VerifiableIntakeProtocol.sol](./src/contracts/VerifiableIntakeProtocol.sol)
- **Test Suite**: [test/VerifiableIntakeProtocol.test.ts](./test/VerifiableIntakeProtocol.test.ts)
- **Hardhat Docs**: https://hardhat.org/docs
- **OpenZeppelin**: https://docs.openzeppelin.com/

## Support

Need help? Check:
1. Error messages in terminal
2. Transaction details on block explorer
3. Test output for hints
4. Documentation files in this repo

Happy deploying! 🚀
