import { ethers } from "ethers";

// Contract ABI - only the functions we need
const VERIFIABLE_INTAKE_ABI = [
    "function submitReport(string memory reportId, bytes32 reportHash) external",
    "function getReport(string memory reportId) external view returns (bytes32 reportHash, uint256 timestamp, address intakeOfficer, uint256 blockNumber)",
    "function reportExists(string memory reportId) external view returns (bool)",
    "event ReportSubmitted(string indexed reportId, bytes32 reportHash, address indexed intakeOfficer, uint256 timestamp)"
];

/**
 * Get the contract instance
 */
export function getContract() {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    
    if (!contractAddress) {
        throw new Error("Contract address not configured");
    }

    // Connect to provider (read-only)
    const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/demo"
    );

    return new ethers.Contract(contractAddress, VERIFIABLE_INTAKE_ABI, provider);
}

/**
 * Get contract with signer for transactions
 */
export async function getContractWithSigner() {
    if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask not installed");
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!contractAddress) {
        throw new Error("Contract address not configured");
    }

    // Validate and ensure address is properly formatted (checksummed)
    try {
        const checksummedAddress = ethers.getAddress(contractAddress);
        return new ethers.Contract(checksummedAddress, VERIFIABLE_INTAKE_ABI, signer);
    } catch (error) {
        throw new Error(`Invalid contract address: ${contractAddress}. Please check your NEXT_PUBLIC_CONTRACT_ADDRESS environment variable.`);
    }
}

/**
 * Hash report data for blockchain submission
 */
export function hashReport(reportData: any): string {
    const dataString = JSON.stringify(reportData);
    return ethers.keccak256(ethers.toUtf8Bytes(dataString));
}

/**
 * Submit report to blockchain
 */
export async function submitReportToBlockchain(reportId: string, reportData: any) {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    
    // Validate contract address format
    let isValidAddress = false;
    if (contractAddress) {
        try {
            ethers.getAddress(contractAddress);
            isValidAddress = true;
        } catch {
            console.warn(`Invalid contract address format: ${contractAddress}. Using mock mode.`);
        }
    }
    
    // Mock mode: Return simulated blockchain submission if contract not configured or invalid
    if (!contractAddress || !isValidAddress) {
        if (!contractAddress) {
            console.warn("Contract address not configured. Using mock blockchain submission.");
        }
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate mock transaction hash
        const mockTxHash = `0x${Array.from({ length: 64 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('')}`;
        
        const reportHash = hashReport(reportData);
        
        console.log("Mock blockchain submission:", {
            reportId,
            reportHash,
            transactionHash: mockTxHash,
            blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
        });
        
        return {
            success: true,
            transactionHash: mockTxHash,
            blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
        };
    }
    
    try {
        const contract = await getContractWithSigner();
        const reportHash = hashReport(reportData);
        
        // Submit transaction with explicit options to avoid ENS resolution
        const tx = await contract.submitReport(reportId, reportHash, {
            // Explicitly set to prevent ENS lookups
            from: await contract.runner?.getAddress(),
        });
        
        // Wait for confirmation
        const receipt = await tx.wait();
        
        return {
            success: true,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
        };
    } catch (error: any) {
        console.error("Blockchain submission error:", error);
        
        // Provide more helpful error messages
        if (error.code === "UNSUPPORTED_OPERATION") {
            throw new Error("Network does not support this operation. Please ensure you're connected to the correct network.");
        }
        
        throw new Error(error.message || "Failed to submit to blockchain");
    }
}

/**
 * Verify report exists on blockchain
 */
export async function verifyReportOnBlockchain(reportId: string) {
    try {
        const contract = getContract();
        const exists = await contract.reportExists(reportId);
        
        if (exists) {
            const [reportHash, timestamp, intakeOfficer, blockNumber] = await contract.getReport(reportId);
            return {
                exists: true,
                reportHash,
                timestamp: Number(timestamp),
                intakeOfficer,
                blockNumber: Number(blockNumber),
            };
        }
        
        return { exists: false };
    } catch (error) {
        console.error("Blockchain verification error:", error);
        return { exists: false };
    }
}

// Add type declaration for window.ethereum
declare global {
    interface Window {
        ethereum?: any;
    }
}
