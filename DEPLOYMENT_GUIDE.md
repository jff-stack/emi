# Smart Contract Deployment Guide

## Issue: Node.js Version Incompatibility

Hardhat requires Node.js 22.10.0+ (LTS), but you're currently using Node.js 20.19.2.

## Solutions

### Option 1: Upgrade Node.js (Recommended)

```bash
# Using nvm (Node Version Manager)
nvm install 22
nvm use 22

# Or download from nodejs.org
# https://nodejs.org/
```

After upgrading, run:
```bash
cd "/Users/arnavjain/VS Code Projects/emi"
npx hardhat compile
npx hardhat run scripts/deploy-verifiable-intake.ts --network sepolia
```

### Option 2: Deploy Using Remix IDE (No Node Upgrade Required)

1. **Open Remix**: Go to [remix.ethereum.org](https://remix.ethereum.org)

2. **Copy Contract**: 
   - Create new file: `VerifiableIntakeProtocol.sol`
   - Copy content from: `src/contracts/VerifiableIntakeProtocol.sol`

3. **Compile**:
   - Select Solidity Compiler (0.8.19)
   - Click "Compile VerifiableIntakeProtocol.sol"

4. **Deploy**:
   - Select "Deploy & Run Transactions"
   - Environment: "Injected Provider - MetaMask"
   - Connect to Sepolia Testnet
   - Constructor parameter: Your wallet address (admin)
   - Click "Deploy"

5. **Copy Contract Address**:
   - After deployment, copy the contract address
   - Add to `.env.local`:
     ```
     NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddress
     ```

### Option 3: Use Pre-Deployed Test Contract

For testing purposes, you can use this pre-deployed contract on Sepolia:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/demo
```

⚠️ **Note**: This is for testing only. Deploy your own contract for production.

## Required Environment Variables

Add to `.env.local`:

```env
# Blockchain Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractAddress
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# For Hardhat Deployment (if upgrading Node)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
VERIFIABLE_INTAKE_PRIVATE_KEY=your_wallet_private_key_here
```

## Get Sepolia ETH (Testnet)

1. Visit [Sepolia Faucet](https://sepoliafaucet.com/)
2. Enter your wallet address
3. Receive test ETH for gas fees

## Get RPC URL

### Alchemy (Recommended)
1. Sign up at [alchemy.com](https://alchemy.com)
2. Create new app (Ethereum → Sepolia)
3. Copy HTTPS URL

### Infura
1. Sign up at [infura.io](https://infura.io)
2. Create new project
3. Select Sepolia network
4. Copy endpoint URL

## Verify Deployment

After deploying, test the blockchain integration:

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Complete an appointment and medical intake

3. Click "Verify on Blockchain"

4. MetaMask will prompt for transaction signature

5. After confirmation, you'll see the real transaction hash

## Contract Features

✅ **Immutable Reports**: Once submitted, reports cannot be changed
✅ **Timestamped**: Blockchain timestamp proves when report was created
✅ **Verifiable**: Anyone can verify the report hash exists on-chain
✅ **Access Control**: Only authorized intake officers can submit reports
✅ **Audit Trail**: Complete history of all submissions

## Security Notes

- **Never commit private keys** to git
- Use `.env.local` for sensitive data
- `.env.local` is already in `.gitignore`
- For production, use hardware wallets or key management services
- Consider using a separate admin wallet for contract management
