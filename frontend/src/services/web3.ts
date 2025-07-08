import { ethers } from 'ethers';
import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';

// Supported chains
export const SUPPORTED_CHAINS = {
  POLYGON_MAINNET: 137,
  POLYGON_TESTNET: 80001,
  ETHEREUM_MAINNET: 1,
  ETHEREUM_TESTNET: 5,
};

// RPC URLs
export const RPC_URLS = {
  [SUPPORTED_CHAINS.POLYGON_MAINNET]: 'https://polygon-rpc.com',
  [SUPPORTED_CHAINS.POLYGON_TESTNET]: 'https://rpc-mumbai.maticvigil.com',
  [SUPPORTED_CHAINS.ETHEREUM_MAINNET]: 'https://mainnet.infura.io/v3/your-project-id',
  [SUPPORTED_CHAINS.ETHEREUM_TESTNET]: 'https://goerli.infura.io/v3/your-project-id',
};

// Connectors
export const injected = new InjectedConnector({
  supportedChainIds: Object.values(SUPPORTED_CHAINS),
});

export const walletconnect = new WalletConnectConnector({
  rpc: RPC_URLS,
  qrcode: true,
  pollingInterval: 15000,
});

// Get library function for Web3React
export function getLibrary(provider: any) {
  const library = new ethers.providers.Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
}

// Contract ABIs (simplified for now)
export const CONTRACT_ABIS = {
  NexusVerseToken: [
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
  ],
  NexusVerseIdentity: [
    'function verifyIdentity(address user, bytes32 identityHash) view returns (bool)',
    'function registerIdentity(bytes32 identityHash) returns (bool)',
    'function getIdentityHash(address user) view returns (bytes32)',
  ],
  NexusVerseDAO: [
    'function getVotes(address account) view returns (uint256)',
    'function castVote(uint256 proposalId, bool support) returns (bool)',
    'function createProposal(string description) returns (uint256)',
    'function getProposal(uint256 proposalId) view returns (tuple(uint256 id, address proposer, string description, uint256 forVotes, uint256 againstVotes, bool executed, bool canceled))',
  ],
};

// Contract addresses (will be updated after deployment)
export const CONTRACT_ADDRESSES = {
  [SUPPORTED_CHAINS.POLYGON_MAINNET]: {
    NexusVerseToken: '0x...', // To be deployed
    NexusVerseIdentity: '0x...', // To be deployed
    NexusVerseDAO: '0x...', // To be deployed
  },
  [SUPPORTED_CHAINS.POLYGON_TESTNET]: {
    NexusVerseToken: '0x...', // To be deployed
    NexusVerseIdentity: '0x...', // To be deployed
    NexusVerseDAO: '0x...', // To be deployed
  },
};

class Web3Service {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private contracts: { [key: string]: ethers.Contract } = {};

  // Initialize Web3 service
  async initialize(provider: any) {
    this.provider = new ethers.providers.Web3Provider(provider);
    this.signer = this.provider.getSigner();
    await this.initializeContracts();
  }

  // Initialize contracts
  private async initializeContracts() {
    if (!this.signer) return;

    const network = await this.provider!.getNetwork();
    const chainId = network.chainId;
    const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];

    if (!addresses) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    // Initialize contracts
    Object.entries(CONTRACT_ABIS).forEach(([name, abi]) => {
      const address = addresses[name as keyof typeof addresses];
      if (address) {
        this.contracts[name] = new ethers.Contract(address, abi, this.signer);
      }
    });
  }

  // Get connected account
  async getAccount(): Promise<string | null> {
    if (!this.provider) return null;
    const accounts = await this.provider.listAccounts();
    return accounts[0] || null;
  }

  // Get network
  async getNetwork() {
    if (!this.provider) return null;
    return await this.provider.getNetwork();
  }

  // Switch network
  async switchNetwork(chainId: number) {
    if (!this.provider) throw new Error('Provider not initialized');

    try {
      await this.provider.send('wallet_switchEthereumChain', [
        { chainId: `0x${chainId.toString(16)}` },
      ]);
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added, add it
        await this.addNetwork(chainId);
      } else {
        throw error;
      }
    }
  }

  // Add network
  async addNetwork(chainId: number) {
    if (!this.provider) throw new Error('Provider not initialized');

    const networkConfig = {
      [SUPPORTED_CHAINS.POLYGON_MAINNET]: {
        chainId: `0x${SUPPORTED_CHAINS.POLYGON_MAINNET.toString(16)}`,
        chainName: 'Polygon Mainnet',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
        rpcUrls: [RPC_URLS[SUPPORTED_CHAINS.POLYGON_MAINNET]],
        blockExplorerUrls: ['https://polygonscan.com'],
      },
      [SUPPORTED_CHAINS.POLYGON_TESTNET]: {
        chainId: `0x${SUPPORTED_CHAINS.POLYGON_TESTNET.toString(16)}`,
        chainName: 'Polygon Mumbai Testnet',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
        rpcUrls: [RPC_URLS[SUPPORTED_CHAINS.POLYGON_TESTNET]],
        blockExplorerUrls: ['https://mumbai.polygonscan.com'],
      },
    };

    const config = networkConfig[chainId];
    if (!config) throw new Error(`Unsupported chain ID: ${chainId}`);

    await this.provider.send('wallet_addEthereumChain', [config]);
  }

  // Sign message
  async signMessage(message: string): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized');
    return await this.signer.signMessage(message);
  }

  // Get token balance
  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
    const contract = new ethers.Contract(
      tokenAddress,
      CONTRACT_ABIS.NexusVerseToken,
      this.provider
    );
    const balance = await contract.balanceOf(userAddress);
    return ethers.utils.formatEther(balance);
  }

  // Transfer tokens
  async transferTokens(tokenAddress: string, to: string, amount: string): Promise<ethers.ContractTransaction> {
    if (!this.signer) throw new Error('Signer not initialized');
    
    const contract = new ethers.Contract(
      tokenAddress,
      CONTRACT_ABIS.NexusVerseToken,
      this.signer
    );
    
    const amountWei = ethers.utils.parseEther(amount);
    return await contract.transfer(to, amountWei);
  }

  // Verify identity
  async verifyIdentity(userAddress: string, identityHash: string): Promise<boolean> {
    if (!this.contracts.NexusVerseIdentity) throw new Error('Identity contract not initialized');
    return await this.contracts.NexusVerseIdentity.verifyIdentity(userAddress, identityHash);
  }

  // Register identity
  async registerIdentity(identityHash: string): Promise<ethers.ContractTransaction> {
    if (!this.contracts.NexusVerseIdentity) throw new Error('Identity contract not initialized');
    return await this.contracts.NexusVerseIdentity.registerIdentity(identityHash);
  }

  // Get voting power
  async getVotingPower(userAddress: string): Promise<string> {
    if (!this.contracts.NexusVerseDAO) throw new Error('DAO contract not initialized');
    const votes = await this.contracts.NexusVerseDAO.getVotes(userAddress);
    return ethers.utils.formatEther(votes);
  }

  // Cast vote
  async castVote(proposalId: number, support: boolean): Promise<ethers.ContractTransaction> {
    if (!this.contracts.NexusVerseDAO) throw new Error('DAO contract not initialized');
    return await this.contracts.NexusVerseDAO.castVote(proposalId, support);
  }

  // Create proposal
  async createProposal(description: string): Promise<ethers.ContractTransaction> {
    if (!this.contracts.NexusVerseDAO) throw new Error('DAO contract not initialized');
    return await this.contracts.NexusVerseDAO.createProposal(description);
  }

  // Get proposal
  async getProposal(proposalId: number) {
    if (!this.contracts.NexusVerseDAO) throw new Error('DAO contract not initialized');
    return await this.contracts.NexusVerseDAO.getProposal(proposalId);
  }

  // Get gas price
  async getGasPrice(): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized');
    const gasPrice = await this.provider.getGasPrice();
    return ethers.utils.formatUnits(gasPrice, 'gwei');
  }

  // Estimate gas
  async estimateGas(to: string, data: string): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized');
    const gasEstimate = await this.provider.estimateGas({ to, data });
    return gasEstimate.toString();
  }

  // Wait for transaction
  async waitForTransaction(hash: string): Promise<ethers.providers.TransactionReceipt> {
    if (!this.provider) throw new Error('Provider not initialized');
    return await this.provider.waitForTransaction(hash);
  }

  // Get transaction
  async getTransaction(hash: string): Promise<ethers.providers.TransactionResponse | null> {
    if (!this.provider) throw new Error('Provider not initialized');
    return await this.provider.getTransaction(hash);
  }

  // Get transaction receipt
  async getTransactionReceipt(hash: string): Promise<ethers.providers.TransactionReceipt | null> {
    if (!this.provider) throw new Error('Provider not initialized');
    return await this.provider.getTransactionReceipt(hash);
  }

  // Format address
  formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Validate address
  isValidAddress(address: string): boolean {
    return ethers.utils.isAddress(address);
  }

  // Get ENS name
  async getENSName(address: string): Promise<string | null> {
    if (!this.provider) return null;
    return await this.provider.lookupAddress(address);
  }

  // Get ENS address
  async getENSAddress(name: string): Promise<string | null> {
    if (!this.provider) return null;
    return await this.provider.resolveName(name);
  }
}

export const web3Service = new Web3Service(); 