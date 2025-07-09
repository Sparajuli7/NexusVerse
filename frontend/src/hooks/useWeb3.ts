import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { web3API } from '@/services/api';

export interface WalletInfo {
  address: string;
  balance: string;
  chainId: number;
  network: string;
}

export interface TokenInfo {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
}

export const useWeb3 = () => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum;
  };

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(address);

      const walletInfo: WalletInfo = {
        address,
        balance: ethers.utils.formatEther(balance),
        chainId: network.chainId,
        network: network.name,
      };

      setWallet(walletInfo);
      setProvider(provider);

      // Notify backend about wallet connection
      await web3API.connectWallet({
        address,
        chainId: network.chainId,
        network: network.name,
      });

      // Load token balances
      await loadTokenBalances(address);

    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      await web3API.disconnectWallet();
    } catch (err) {
      console.error('Failed to disconnect wallet from backend:', err);
    }

    setWallet(null);
    setTokens([]);
    setProvider(null);
    setError(null);
  }, []);

  // Load token balances
  const loadTokenBalances = useCallback(async (address: string) => {
    if (!provider) return;

    try {
      // Common token addresses (you can extend this list)
      const tokenAddresses = [
        // Add your token contract addresses here
      ];

      const tokenPromises = tokenAddresses.map(async (tokenAddress) => {
        try {
          const response = await web3API.getTokenBalance(address, tokenAddress);
          return response.data;
        } catch (err) {
          console.error(`Failed to load token balance for ${tokenAddress}:`, err);
          return null;
        }
      });

      const tokenResults = await Promise.all(tokenPromises);
      const validTokens = tokenResults.filter(token => token !== null);
      setTokens(validTokens);
    } catch (err) {
      console.error('Failed to load token balances:', err);
    }
  }, [provider]);

  // Transfer tokens
  const transferTokens = useCallback(async (
    toAddress: string,
    amount: string,
    tokenAddress?: string
  ) => {
    if (!wallet || !provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const signer = provider.getSigner();
      
      if (tokenAddress) {
        // ERC-20 token transfer
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ['function transfer(address to, uint256 amount)'],
          signer
        );
        
        const tx = await tokenContract.transfer(toAddress, amount);
        await tx.wait();
      } else {
        // Native token (ETH) transfer
        const tx = await signer.sendTransaction({
          to: toAddress,
          value: ethers.utils.parseEther(amount),
        });
        await tx.wait();
      }

      // Update balances
      await loadTokenBalances(wallet.address);
      
      return { success: true, hash: tx.hash };
    } catch (err: any) {
      throw new Error(err.message || 'Transfer failed');
    }
  }, [wallet, provider, loadTokenBalances]);

  // Get transaction history
  const getTransactionHistory = useCallback(async (address: string) => {
    try {
      const response = await web3API.getTransactionHistory(address);
      return response.data;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to get transaction history');
    }
  }, []);

  // Verify identity on blockchain
  const verifyIdentity = useCallback(async (identityData: any) => {
    try {
      const response = await web3API.verifyIdentity(identityData);
      return response.data;
    } catch (err: any) {
      throw new Error(err.message || 'Identity verification failed');
    }
  }, []);

  // Mint NFT
  const mintNFT = useCallback(async (nftData: any) => {
    try {
      const response = await web3API.mintNFT(nftData);
      return response.data;
    } catch (err: any) {
      throw new Error(err.message || 'NFT minting failed');
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected wallet
        disconnectWallet();
      } else if (wallet && accounts[0] !== wallet.address) {
        // User switched accounts
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      // Reload wallet info when chain changes
      if (wallet) {
        connectWallet();
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [wallet, connectWallet, disconnectWallet]);

  return {
    wallet,
    tokens,
    isConnecting,
    error,
    isConnected: !!wallet,
    isMetaMaskInstalled,
    connectWallet,
    disconnectWallet,
    transferTokens,
    getTransactionHistory,
    verifyIdentity,
    mintNFT,
    loadTokenBalances,
  };
}; 