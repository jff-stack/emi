This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## EMI - Emergency Medical Intake System

A comprehensive emergency medical intake system with blockchain-based verification using the **VerifiableIntakeProtocol** smart contract.

### Features

- 🏥 **Voice-Activated Triage**: AI-powered voice interface for rapid patient intake
- 📊 **Real-time Vital Monitoring**: Track and display patient vitals
- 🔒 **Blockchain Verification**: Immutable report storage using smart contracts
- 🎯 **AI-Powered Analysis**: Gemini AI integration for clinical decision support
- 📝 **Report Generation**: Automated medical report generation with verification

### Blockchain Integration

This project uses the **VerifiableIntakeProtocol** smart contract for secure, immutable storage of medical report hashes on the blockchain. See [BLOCKCHAIN_INTEGRATION.md](./BLOCKCHAIN_INTEGRATION.md) for detailed documentation.

## Getting Started

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_VERIFIABLE_INTAKE_CONTRACT_ADDRESS` - Your deployed contract address
- `NEXT_PUBLIC_VERIFIABLE_INTAKE_RPC_URL` - Blockchain RPC endpoint
- `VERIFIABLE_INTAKE_PRIVATE_KEY` - Private key for transactions (server-side only)

### 3. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Smart Contract Deployment

### Prerequisites

Install Hardhat and dependencies:

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts
```

### Deploy to Testnet

```bash
npx hardhat run scripts/deploy-verifiable-intake.ts --network sepolia
```

### Verify on Etherscan

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> "<ADMIN_ADDRESS>"
```

See [BLOCKCHAIN_INTEGRATION.md](./BLOCKCHAIN_INTEGRATION.md) for complete deployment instructions.

## Project Structure

```
emi/
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   │   └── emi/         # EMI-specific components
│   ├── contracts/       # Solidity smart contracts
│   │   └── VerifiableIntakeProtocol.sol
│   ├── hooks/           # React hooks
│   └── lib/             # Utility libraries
│       ├── kairo.ts    # Blockchain integration
│       ├── gemini.ts   # AI integration
│       └── ...
├── scripts/             # Deployment scripts
├── public/              # Static assets
└── hardhat.config.ts   # Hardhat configuration
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
