//@ts-nocheck
import React, { useMemo, Fragment, FC, useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useBalance } from 'wagmi';
import { parseUnits } from 'viem';
import { formatUnits } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import { AoP1_VAULT_ADDRESS, AoP2_VAULT_ADDRESS } from '../config/contracts';
import { AoP1_VAULT_ABI, AoP2_VAULT_ABI } from '../config/abis';
import { USDT, MON, Token } from '../config/tokens';
import { erc20Abi } from 'viem';
import { ArrowRightIcon, ArrowPathIcon, ShieldCheckIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon, CurrencyDollarIcon   } from '@heroicons/react/24/outline';
import { Listbox, Transition } from '@headlessui/react';

// Risk level definitions with associated styling and deposit functions
const RISK_LEVELS = {
  MED: {
    name: 'Med Risk Agent',
    description: 'Balanced risk-reward strategy for moderate returns',
    address: AoP1_VAULT_ADDRESS,
    abi: AoP1_VAULT_ABI,
    color: 'from-blue-500 to-teal-500',
    hoverColor: 'hover:shadow-blue-500/25',
    type: 'AoP1',
    depositFunction: 'depositUSDT'
  },
  HIGH: {
    name: 'High Risk Agent',
    description: 'Aggressive strategy for potentially higher returns',
    address: AoP2_VAULT_ADDRESS,
    abi: AoP2_VAULT_ABI,
    color: 'from-purple-600 to-pink-600',
    hoverColor: 'hover:shadow-purple-500/25',
    type: 'AoP2',
    depositFunction: 'deposit'
  }
};

const DepositForm: FC = () => {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<'MED' | 'HIGH'>('MED');
  const [transactionHash, setTransactionHash] = useState<string>('');

  // Token configs (if not imported from config)
  const originalMON = MON;
  const updatedMON = {
    ...originalMON,
    logoUrl: 'https://miro.medium.com/v2/resize:fit:400/0*aRHYdVg5kllfc7Gn.jpg',
  };

  const tokenConfigs = {
    USDT: USDT,
    MON: updatedMON,
  };

  // Get available token options based on selected risk level
  const availableTokens = useMemo(() => {
    return selectedRisk === 'HIGH' 
      ? [tokenConfigs.USDT] // High risk only supports USDT
      : [tokenConfigs.USDT, tokenConfigs.MON]; // Medium risk supports both
  }, [selectedRisk, tokenConfigs]);

  // Default token based on risk level
  const defaultToken = tokenConfigs.USDT;

  // Selected token state (with type checking)
  const [selectedToken, setSelectedToken] = useState<Token>(defaultToken);

  // Update token state when risk level changes to ensure HIGH risk level only allows USDT
  useEffect(() => {
    if (selectedRisk === 'HIGH') {
      setSelectedToken(tokenConfigs.USDT);
    }
  }, [selectedRisk, tokenConfigs]);

  const selectedVault = RISK_LEVELS[selectedRisk];

  // Read contract states: allowance, balance, and NAV
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: selectedToken.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address!, selectedVault.address as `0x${string}`],
    enabled: !!address && selectedToken.symbol === 'USDT',
    watch: false,
  });

  const { data: erc20Balance, refetch: refetchErc20Balance } = useReadContract({
    address: selectedToken.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address!],
    enabled: !!address && selectedToken.symbol === 'USDT',
    watch: false,
  });
  
  // Get native token balance
  const { data: nativeBalance, refetch: refetchNativeBalance } = useBalance({
    address,
    enabled: !!address && selectedToken.symbol === 'MON',
    watch: true,
  });

  useEffect(() => {
    if (selectedToken.symbol === 'MON') {
      console.log('Native MON Balance:', nativeBalance);
    }
  }, [nativeBalance, selectedToken]);

  const { data: navPerShare } = useReadContract({
    address: selectedVault.address,
    abi: selectedVault.abi,
    functionName: 'navPerShare',
    enabled: !!address,
    watch: false,
  });

  // Get share price from contract
  const { data: sharePrice } = useReadContract({
    address: selectedVault?.address as `0x${string}`,
    abi: selectedVault?.abi,
    functionName: 'getSharePrice',
    enabled: !!selectedVault?.address,
  });

  // Calculate estimated shares
  const estimatedShares = useMemo(() => {
    if (!amount || !sharePrice || Number(amount) === 0) return null;
    
    try {
      // Convert amount to wei/smallest unit based on token decimals
      const amountInSmallestUnit = parseUnits(amount, selectedToken.decimals);
      
      // Convert to BigInt for calculation
      const amountBigInt = BigInt(amountInSmallestUnit);
      const sharePriceBigInt = BigInt(sharePrice);
      
      // Calculate shares = amount * 1e18 / sharePrice
      // For USDT (6 decimals), we need to scale by an additional 10^12 to match the 18 decimals standard
      const decimalsAdjustment = selectedToken.symbol === 'USDT' ? BigInt(10) ** BigInt(12) : BigInt(1);
      const scaleFactor = BigInt(10) ** BigInt(18);
      const scaledAmount = amountBigInt * scaleFactor * decimalsAdjustment;
      const sharesInWei = scaledAmount / sharePriceBigInt;
      
      // Format to a reasonable number of decimals for display
      return formatUnits(sharesInWei.toString(), 18);
    } catch (error) {
      console.error('Error calculating estimated shares:', error);
      return null;
    }
  }, [amount, sharePrice, selectedToken.decimals, selectedToken.symbol]);

  // Deposit mechanism with waitForTransaction to properly handle tx lifecycle
  const { writeContract: writeDeposit, isPending: isDepositConfirming, data: depositData } = useWriteContract();
  const { isLoading: isWaitingForDeposit, isSuccess: depositSuccess } = useWaitForTransactionReceipt({
    hash: depositData as `0x${string}`,
    enabled: !!depositData,
  });

  // Approval mechanism with transaction receipt tracking
  const { writeContract: writeApprove, isPending: isApproveConfirming, data: approveData } = useWriteContract();
  const { isLoading: isWaitingForApprove, isSuccess: approveSuccess } = useWaitForTransactionReceipt({
    hash: approveData as `0x${string}`,
    enabled: !!approveData,
  });

  // Use effect to set transaction hash when available
  useEffect(() => {
    if (depositData) {
      const hash = depositData as `0x${string}`;
      console.log('📝 Transaction hash received:', hash);
      setTransactionHash(hash);
    }
  }, [depositData]);

  // Handle successful deposit completion
  useEffect(() => {
    if (depositSuccess && transactionHash) {
      console.log('✅ Deposit transaction confirmed!');
      setSuccess(`Successfully deposited ${amount} ${selectedToken.symbol} to ${selectedVault.name}!`);
      setAmount('');
      setIsDepositing(false);
      refreshBalances();
    } else if (depositData && isWaitingForDeposit) {
      console.log('⏳ Waiting for deposit transaction confirmation...');
      // Show a pending message while waiting
      setSuccess(`Transaction submitted and waiting for confirmation...`);
    }
  }, [depositSuccess, depositData, isWaitingForDeposit, transactionHash, amount, selectedToken, selectedVault]);

  // Handle successful approval completion
  useEffect(() => {
    if (approveSuccess) {
      console.log('✅ Approval transaction confirmed!');
      refetchAllowance();
      setIsApproving(false);
    }
  }, [approveSuccess, refetchAllowance]);

  const parsedAmount = useMemo(() => {
    if (!amount) return undefined;
    try {
      return parseUnits(amount as `${number}`, selectedToken.decimals);
    } catch {
      return undefined;
    }
  }, [amount, selectedToken]);

  const balance = useMemo(() => {
    if (selectedToken.symbol === 'MON') {
      return nativeBalance?.value;
    }
    return erc20Balance;
  }, [selectedToken, erc20Balance, nativeBalance]);

  const insufficientBalance = useMemo(() => {
    if (!amount || !balance) return false;
    try {
      return parsedAmount > balance;
    } catch {
      return false;
    }
  }, [amount, balance, parsedAmount]);

  // Format balance for display with appropriate decimals
  const formattedBalance = useMemo(() => {
    if (!balance) return '0.00';
    try {
      const fullBalance = formatUnits(balance, selectedToken.decimals);
      // Format based on token type
      if (selectedToken.symbol === 'USDT') {
        // USDT: Always show exactly 2 decimals
        return Number(fullBalance).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      } else if (selectedToken.symbol === 'MON') {
        // MON: Always show exactly 4 decimals
        return Number(fullBalance).toLocaleString('en-US', {
          minimumFractionDigits: 4,
          maximumFractionDigits: 4
        });
      }
      return fullBalance;
    } catch (error) {
      console.error('Error formatting balance:', error);
      return '0.00';
    }
  }, [balance, selectedToken]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setAmount('');
      return;
    }
    
    // Only allow the appropriate number of decimals
    const decimals = selectedToken.symbol === 'USDT' ? 2 : 4;
    const regex = new RegExp(`^\\d*\\.?\\d{0,${decimals}}$`);
    
    if (regex.test(value)) {
      setAmount(value);
    }
  };

  const currentNav = useMemo(() => {
    if (!navPerShare) return '1.00';
    try {
      return formatUnits(navPerShare, 18);
    } catch {
      return '1.00';
    }
  }, [navPerShare]);

  useEffect(() => {
    setError('');
  }, [amount, selectedRisk]);

  useEffect(() => {
    if (selectedToken.symbol === 'USDT') {
      refetchAllowance();
      refetchErc20Balance();
    } else if (selectedToken.symbol === 'MON') {
      refetchNativeBalance();
    }
    
    if (isDepositConfirming) setAmount('');
  }, [isApproveConfirming, isDepositConfirming, refetchAllowance, refetchErc20Balance, refetchNativeBalance, selectedToken]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
        setTransactionHash('');
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const needsApproval = useMemo(() => {
    if (selectedToken.symbol === 'MON') return false; // MON never needs approval
    if (!amount || Number(amount) <= 0) return false; // No amount entered yet
    
    // For USDT, check if we have sufficient allowance
    if (allowance !== undefined) {
      try {
        const amountToCheck = parseUnits(amount, selectedToken.decimals);
        return amountToCheck > BigInt(allowance.toString());
      } catch (error) {
        console.error('Error checking allowance:', error);
        return true; // Default to needing approval on error
      }
    }
    
    return true; // Default to needing approval if allowance is undefined
  }, [amount, allowance, selectedToken]);

  useEffect(() => {
    console.log('needsApproval changed:', needsApproval, 'Current allowance:', allowance?.toString());
  }, [needsApproval, allowance]);

  const handleApprove = async () => {
    if (!parseUnits(amount, selectedToken.decimals)) return;
    setIsApproving(true);
    setError('');
    try {
      await writeApprove({
        address: selectedToken.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [selectedVault.address as `0x${string}`, parseUnits(amount, selectedToken.decimals)],
      });
      
      console.log('Approval transaction submitted and waiting for confirmation...');
      
      // The transaction completion is now handled by the useWaitForTransactionReceipt hook and its associated useEffect
      
    } catch (error) {
      console.error('Approval error:', error);
      setError(`Failed to approve: ${error.message || 'Unknown error'}`);
      setIsApproving(false);
    }
  };

  const [allowanceRefreshed, setAllowanceRefreshed] = useState(0);

  const handleDeposit = async () => {
    if (!selectedToken || !amount || insufficientBalance) return;
    
    try {
      setIsDepositing(true);
      setError('');
      setSuccess(''); // Clear any previous success messages
      
      // Log for debugging
      console.log('Starting deposit with:', {
        vault: selectedVault.name,
        vaultType: selectedVault.type,
        vaultAddress: selectedVault.address,
        token: selectedToken.symbol,
        amount
      });
      
      const parsedAmount = parseUnits(amount, selectedToken.decimals);
      
      // Use writeContract hook to make the deposit transaction
      if (selectedToken.symbol === 'MON') {
        // MON is native token and only supported in AoP1
        if (selectedVault.type === 'AoP1') {
          console.log('Depositing MON to AoP1 via depositMON()');
          await writeDeposit({
            address: selectedVault.address as `0x${string}`,
            abi: selectedVault.abi,
            functionName: 'depositMON',
            value: parsedAmount,
          });
        } else {
          // AoP2 doesn't support MON deposits
          setError('This vault does not support MON deposits');
          setIsDepositing(false);
          return;
        }
      } else if (selectedToken.symbol === 'USDT') {
        // USDT deposit - use the appropriate function based on vault type
        const functionName = selectedVault.type === 'AoP1' ? 'depositUSDT' : 'deposit';
        
        console.log(`Depositing USDT using function: ${functionName}() to vault: ${selectedVault.type}`);
        
        try {
          await writeDeposit({
            address: selectedVault.address as `0x${string}`,
            abi: selectedVault.abi,
            functionName: functionName,
            args: [parsedAmount],
          });
          
          console.log('Deposit transaction initiated, waiting for confirmation...');
          
        } catch (writeError) {
          console.error('Write contract error:', writeError);
          throw new Error(`Failed to execute ${functionName}: ${writeError.message}`);
        }
      }
      
      // Do not set isDepositing to false here - it's now handled by the useEffect watching depositSuccess
      
    } catch (err) {
      console.error('Deposit error:', err);
      setError(`Failed to deposit: ${err.message || 'Unknown error'}`);
      setIsDepositing(false);
    }
  };

  // Function to refresh balances in one place
  const refreshBalances = async () => {
    console.log('🔄 Refreshing balances...');
    if (selectedToken.symbol === 'USDT') {
      await refetchErc20Balance();
      await refetchAllowance();
    } else if (selectedToken.symbol === 'MON') {
      await refetchNativeBalance();
    }
    console.log('✅ Balances refreshed');
  };

  // Generate the button text based on current state
  const getActionButtonText = () => {
    if (needsApproval) {
      if (isApproving || isApproveConfirming || isWaitingForApprove) {
        return 'Approving...';
      }
      return 'Approve';
    } else {
      if (isDepositing || isDepositConfirming || isWaitingForDeposit) {
        return 'Depositing...';
      }
      return 'Deposit';
    }
  };

  // Determine if the button should be disabled
  const isButtonDisabled = useMemo(() => {
    // Always disable if there's no amount or insufficient balance
    if (!amount || insufficientBalance) return true;
    
    // Disable during any transaction processing
    if (isApproving || isApproveConfirming || isWaitingForApprove) return true;
    if (isDepositing || isDepositConfirming || isWaitingForDeposit) return true;
    
    return false;
  }, [
    amount, 
    insufficientBalance, 
    isApproving, 
    isApproveConfirming, 
    isWaitingForApprove,
    isDepositing, 
    isDepositConfirming,
    isWaitingForDeposit
  ]);

  // Get the spinner component for loading states
  const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  // Show transaction receipt information
  const TransactionReceipt = () => {
    if (!transactionHash) return null;
    
    const explorerUrl = `https://testnet.monadexplorer.com/tx/${transactionHash}`;
    
    return (
      <div className="mt-2 text-xs">
        <a 
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-purple-300 underline flex items-center"
        >
          View on Explorer
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 ml-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mb-8 relative"
      >
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-10 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-10 w-56 h-56 bg-fuchsia-600/10 rounded-full blur-3xl"></div>
          <div className="absolute top-10 left-10 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl"></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 py-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="inline-flex mb-4 px-3 py-1.5 bg-gradient-to-r from-purple-900/30 to-fuchsia-900/30 rounded-full border border-purple-500/30"
          >
            <div className="flex items-center space-x-2 px-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span className="text-xs font-medium text-purple-300 tracking-wide">Agent of Profits v1.2</span>
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-500 to-indigo-400">
              Deposit to Vault
            </span>
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="max-w-md mx-auto"
          >
            <p className="text-gray-400 text-sm sm:text-base mb-4">
              Start earning with <span className="text-white font-medium">AI Agent of Profits</span> and put your assets to work. lay back and watch your profit grow.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <div className="flex items-center bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-purple-600/20">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5 text-indigo-400">
                  <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-300">Auto-compounding</span>
              </div>
              <div className="flex items-center bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-purple-600/20">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5 text-pink-400">
                  <path fillRule="evenodd" d="M10.339 2.237a.532.532 0 00-.678 0 11.947 11.947 0 01-7.078 2.75.5.5 0 00-.479.425A12.11 12.11 0 002 7c0 5.163 3.26 9.564 7.834 11.257a.48.48 0 00.332 0C14.74 16.564 18 12.163 18 7.001c0-.54-.035-1.07-.104-1.59a.5.5 0 00-.48-.425 11.947 11.947 0 01-7.077-2.75zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-300">Secure vaults</span>
              </div>
              {/* <div className="flex items-center bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-purple-600/20">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5 text-green-400">
                  <path fillRule="evenodd" d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm13-1a1 1 0 11-2 0 1 1 0 012 0zM1.75 14.5a.75.75 0 000 1.5c4.417 0 8.693.603 12.749 1.73 1.111.309 2.251-.512 2.251-1.696v-.784a.75.75 0 00-1.5 0v.784a.272.272 0 01-.35.25A49.043 49.043 0 001.75 14.5z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-300">Optimized yields</span>
              </div> */}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Risk Level Selection */}
      <div className="mb-8">
        <h2 className="text-base sm:text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300 mb-3">Select Investment Strategy</h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {(['MED', 'HIGH'] as const).map((risk) => (
            <motion.div 
              key={risk}
              onClick={() => setSelectedRisk(risk)}
              whileHover={{ scale: selectedRisk === risk ? 1.02 : 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 17
              }}
              className={`
                relative flex-1 rounded-xl cursor-pointer overflow-hidden
                ${selectedRisk === risk 
                  ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-900/30' 
                  : 'ring-1 ring-purple-600/30 hover:ring-purple-600/50'
                }
              `}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 opacity-30 ${
                risk === 'MED' ? 'bg-gradient-to-br from-blue-800 via-indigo-900 to-purple-900' :
                'bg-gradient-to-br from-pink-800 via-purple-900 to-indigo-900'
              }`}></div>
              
              {/* Selection Indicator */}
              {selectedRisk === risk && (
                <>
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-600 to-fuchsia-500"></div>
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-purple-600 to-fuchsia-500"></div>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-fuchsia-500 to-purple-600"></div>
                  <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-fuchsia-500 to-purple-600"></div>
                </>
              )}
              
              <div className="relative p-4 sm:p-5 backdrop-blur-lg">
                <div className="flex items-start mb-3">
                  {/* Risk Icon */}
                  <div className={`
                    mr-3 w-10 h-10 rounded-lg flex items-center justify-center 
                    ${risk === 'MED' 
                      ? 'bg-blue-900/40 text-blue-300' 
                      : 'bg-pink-900/40 text-pink-300'
                    }
                  `}>
                    {risk === 'MED' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-base sm:text-lg font-semibold ${
                        selectedRisk === risk 
                          ? risk === 'MED' ? 'text-blue-300' : 'text-pink-300' 
                          : 'text-white'
                      }`}>
                        {RISK_LEVELS[risk].name}
                      </h3>
                      
                      <div className={`
                        px-2.5 py-1 rounded-full text-xs font-bold flex items-center
                        ${selectedRisk === risk 
                          ? risk === 'MED'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50' 
                            : 'bg-pink-500/20 text-pink-300 border border-pink-500/50'
                          : 'bg-gray-900/80 text-gray-400 border border-gray-700'
                        }
                      `}>
                        {selectedRisk === risk ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 mr-1">
                            <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.75.75 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 mr-1">
                            <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.5 7.89l.813-2.846A.75.75 0 019 4.5z" clipRule="evenodd" />
                          </svg>
                        )}
                        {risk}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-300 mt-1.5 mb-3">{RISK_LEVELS[risk].description}</p>
                    
                    {/* Risk Indicators */}
                    <div className="flex items-center gap-1 mt-3">
                      <div className="text-xs text-gray-500 mr-2">Risk Level:</div>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div 
                          key={level} 
                          className={`h-1.5 w-5 rounded-full ${
                            risk === 'MED' 
                              ? level <= 3 
                                ? level <= 2 ? 'bg-green-500' : 'bg-blue-500'
                                : 'bg-gray-700'
                              : level <= 4
                                ? level <= 2 ? 'bg-blue-500' : level === 3 ? 'bg-purple-500' : 'bg-pink-500'
                                : 'bg-gray-700'
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Selected Indicator */}
                <div className="flex items-center mt-4">
                  <div className={`
                    w-full h-10 rounded-lg flex items-center justify-center border border-gray-700/50
                    ${selectedRisk === risk 
                      ? risk === 'MED'
                        ? 'bg-blue-900/30 text-blue-300' 
                        : 'bg-pink-900/30 text-pink-300'
                      : 'bg-gray-900/50 text-gray-500'
                    }
                  `}>
                    {selectedRisk === risk ? (
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
                          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Selected</span>
                      </div>
                    ) : (
                      <span>Click to Select</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Token Selection with Amount Input Combined */}
      <div className="mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-black to-gray-900 backdrop-blur-lg rounded-xl border border-purple-600/30 shadow-2xl overflow-hidden"
        >
          {/* Header bar with improved styling */}
          <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 px-5 py-3 border-b border-purple-600/40 flex justify-between items-center">
            <p className="text-xs font-medium uppercase tracking-wider text-purple-300">YOU PAY</p>
            <div className="flex items-center">
              <span className="text-xs text-gray-400 mr-1.5">BALANCE:</span>
              <span className="text-xs font-medium text-white">{formattedBalance}</span>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(139, 92, 246, 0.15)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAmount(formattedBalance)}
                className="ml-2 px-2 py-0.5 rounded-md text-xs font-medium bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-600/30 hover:border-purple-500/50 transition-all duration-200"
              >
                MAX
              </motion.button>
            </div>
          </div>
          
          {/* Amount Input & Token Selector Combined with improved layout */}
          <div className="p-4 sm:p-5">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-600/20 p-3 sm:p-4 mb-4 shadow-inner">
              {/* Amount Input */}
              <div className="flex items-center justify-between mb-3">
                <input
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="w-full bg-transparent border-none text-2xl sm:text-3xl md:text-4xl font-bold text-white focus:outline-none focus:ring-0 pr-4"
                  step={selectedToken.symbol === 'USDT' ? '0.01' : '0.0001'}
                />
                
                {/* Token Selector (Inline) with improved styling */}
                <Listbox value={selectedToken} onChange={setSelectedToken}>
                  {({ open }) => (
                    <div className="relative">
                      <Listbox.Button 
                        className={`flex items-center rounded-full py-2 pl-2 pr-4 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/40 transition-all duration-300 ${
                          selectedRisk === 'HIGH' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:from-purple-800/30 hover:to-indigo-800/30 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-900/20'
                        }`}
                        disabled={selectedRisk === 'HIGH'}
                      >
                        <div className="w-7 h-7 rounded-full border border-purple-500/30 shadow-md overflow-hidden">
                          <img 
                            src={selectedToken.logoUrl} 
                            alt={selectedToken.symbol} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="text-white text-sm font-medium">
                          ${selectedToken.symbol}
                        </span>
                        <motion.svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 20 20" 
                          fill="currentColor" 
                          animate={{ rotate: open ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="w-4 h-4 ml-2 text-purple-400"
                        >
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 011.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </motion.svg>
                      </Listbox.Button>

                      <Transition
                        show={open}
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-2"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-2"
                      >
                        <Listbox.Options className="absolute z-20 right-0 mt-2 w-48 bg-gradient-to-br from-gray-900 to-black border border-purple-600/40 rounded-xl shadow-xl shadow-purple-900/30 overflow-hidden py-2">
                          {availableTokens.map((token) => (
                            <Listbox.Option
                              key={token.symbol}
                              value={token}
                              className={({ active }) =>
                                `cursor-pointer select-none relative p-2.5 ${
                                  active ? 'bg-gradient-to-r from-purple-900/40 to-indigo-900/40' : ''
                                }`
                              }
                            >
                              {({ selected, active }) => (
                                <motion.div 
                                  className="flex items-center justify-between"
                                  whileHover={{ x: active ? 3 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-full border border-purple-500/30 shadow-md overflow-hidden">
                                      <img 
                                        src={token.logoUrl} 
                                        alt={token.symbol} 
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                    <div className="ml-3">
                                      <p className="text-sm font-medium text-white">${token.symbol}</p>
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        {token.name}
                                      </p>
                                    </div>
                                  </div>
                                  {selected && (
                                    <div className="flex items-center justify-center h-5 w-5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full shadow-lg">
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-white">
                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-9 13.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  )}
                </Listbox>
              </div>
              
              {/* USD Equivalent with improved styling */}
              <div className="text-gray-400 text-sm font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5 text-purple-400">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.798 7.45c.512-.67 1.135-.95 1.702-.95s1.19.28 1.702.95a.75.75 0 001.192-.91C12.637 5.55 11.596 5 10.5 5s-2.137.55-2.894 1.54A.75.75 0 008.798 7.45zM5.752 12.23a.75.75 0 10-1.493.15c.288 2.87 2.11 4.62 4.741 4.62 2.63 0 4.453-1.75 4.74-4.62a.75.75 0 00-1.492-.15c-.197 1.96-1.454 3.27-3.248 3.27-1.794 0-3.052-1.31-3.248-3.27z" clipRule="evenodd" />
                </svg>
                <span>
                  ${Number(amount || '0') > 0 
                    ? (Number(amount) * (selectedToken.symbol === 'USDT' ? 1 : 1800)).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })
                    : '0.00'}
                </span>
              </div>
            </div>
            
            {/* Estimated Shares with improved styling */}
            <motion.div 
              className="bg-gradient-to-r from-purple-900/15 to-indigo-900/15 rounded-xl p-4 border border-purple-600/30 shadow-lg relative overflow-hidden"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-600/10 to-indigo-600/5 rounded-full blur-3xl transform translate-x-20 -translate-y-20 pointer-events-none"></div>
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2 text-purple-400">
                    <path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" />
                    <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 000 1.5h6a.75.75 0 000-1.5h-6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-purple-300">Estimated Shares:</span>
                </div>
                <span className="text-sm font-jetbrains font-bold text-white bg-black/30 px-3 py-1 rounded-lg border border-purple-600/20">
                  {estimatedShares !== null && Number(amount) > 0
                    ? Number(estimatedShares).toLocaleString('en-US', {
                        minimumFractionDigits: 6,
                        maximumFractionDigits: 8
                      })
                    : '0.00000000'}
                </span>
              </div>
              <div className="mt-3 text-xs text-gray-400 pl-7">
                <div className="flex items-center">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5"></span>
                  Based on current NAV and deposit amount
                </div>
                {Number(amount) > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center mt-1"
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5"></span>
                    Share price: {(Number(amount) / Number(estimatedShares || 1)).toFixed(4)} USD/share
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Bottom tooltip/hint section */}
          <div className="bg-gradient-to-r from-indigo-900/10 to-purple-900/10 px-5 py-3 border-t border-purple-600/30 flex items-center text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-2 text-indigo-400">
              <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.5 7.89l.813-2.846A.75.75 0 019 4.5z" clipRule="evenodd" />
            </svg>
            <span className="text-indigo-300">
              {selectedToken.symbol === 'USDT' ? 
                "USDT deposits are active for all risk levels" : 
                "MON deposits are only available for medium risk vaults"}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Spacer to replace the removed sections */}
      <div className="space-y-5">
        {/* Transaction Status Cards */}
        <div className="space-y-3">
          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="relative overflow-hidden bg-gradient-to-r from-red-950/30 to-red-900/20 rounded-xl border border-red-500/30 shadow-lg shadow-red-900/10"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,0,0,0.12),transparent_70%)]"></div>
                <div className="p-4 flex items-start space-x-3 relative z-10">
                  <div className="bg-red-500/20 p-2 rounded-full mt-0.5">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-red-300 mb-1">Transaction Failed</h4>
                    <p className="text-xs text-red-300/80">{error}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {/* Function to clear error */}}
                    className="mt-1 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </motion.button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600/50 to-red-400/50"></div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="relative overflow-hidden bg-gradient-to-r from-green-950/30 to-emerald-900/20 rounded-xl border border-green-500/30 shadow-lg shadow-green-900/10"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,255,128,0.12),transparent_65%)]"></div>
                <div className="p-4 flex items-start space-x-3 relative z-10">
                  <div className="bg-green-500/20 p-2 rounded-full mt-0.5 flex-shrink-0">
                    <CheckCircleIcon className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-green-300 mb-1">Transaction Complete</h4>
                    <p className="text-xs text-green-300/80 mb-2">{success}</p>
                    <TransactionReceipt />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600/50 to-emerald-400/50"></div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Approval Status */}
          <AnimatePresence>
            {needsApproval && !error && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="relative overflow-hidden bg-gradient-to-r from-purple-950/30 to-indigo-900/20 rounded-xl border border-purple-500/30 shadow-lg shadow-purple-900/10"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.12),transparent_70%)]"></div>
                <div className="p-4 flex items-start space-x-3 relative z-10">
                  <div className="bg-purple-500/20 p-2 rounded-full mt-0.5">
                    <ShieldCheckIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-purple-300 mb-1">Approval Required</h4>
                    <p className="text-xs text-purple-300/80">Please approve access to your {selectedToken.symbol} before depositing</p>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600/50 to-indigo-400/50"></div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transaction Status */}
          <AnimatePresence>
            {(isApproveConfirming || isDepositConfirming || isApproving || isDepositing) && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="relative overflow-hidden bg-gradient-to-r from-indigo-950/30 to-blue-900/20 rounded-xl border border-indigo-500/30 shadow-lg shadow-indigo-900/10"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.12),transparent_70%)]"></div>
                <div className="p-4 flex items-start space-x-3 relative z-10">
                  <div className="bg-indigo-500/20 p-2 rounded-full mt-0.5 flex-shrink-0">
                    <ArrowPathIcon className="w-5 h-5 text-indigo-400 animate-spin" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-indigo-300 mb-1">Transaction in Progress</h4>
                    <p className="text-xs text-indigo-300/80">
                      {isApproveConfirming ? 'Waiting for approval confirmation...' : 
                       isApproving ? 'Processing approval...' : 
                       isDepositConfirming ? 'Waiting for deposit confirmation...' : 
                       'Processing deposit...'}
                    </p>
                    
                    {/* Progress Indicator */}
                    <div className="mt-3 bg-indigo-900/30 h-1.5 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-blue-400"
                        initial={{ width: "5%" }}
                        animate={{ 
                          width: isApproveConfirming || isDepositConfirming ? "40%" : "80%" 
                        }}
                        transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
                      />
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600/50 to-blue-400/50"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          disabled={isButtonDisabled}
          onClick={needsApproval ? handleApprove : handleDeposit}
          className={`w-full py-3.5 px-4 rounded-xl font-medium text-white relative overflow-hidden group transition-all duration-300 ${
            isButtonDisabled
              ? 'bg-gray-700/50 border border-gray-600/30 cursor-not-allowed'
              : `bg-gradient-to-r from-purple-600 to-fuchsia-600 shadow-lg shadow-purple-900/20 hover:shadow-xl hover:shadow-purple-700/30 border border-purple-500/50`
          }`}
        >
          {/* Button Background Effects */}
          {!isButtonDisabled && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-white/10 to-purple-600/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,70,219,0.25),transparent_65%)]"></div>
              <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-purple-600 rounded-full opacity-20 blur-2xl"></div>
            </>
          )}
          
          {/* Button Content */}
          <div className="relative z-10 flex items-center justify-center space-x-3">
            {(isApproving || isApproveConfirming || isWaitingForApprove || 
               isDepositing || isDepositConfirming || isWaitingForDeposit) ? (
              <>
                <LoadingSpinner />
                <span className="text-base">{getActionButtonText()}</span>
              </>
            ) : (
              <>
                <span className="bg-white/10 p-1.5 rounded-lg">
                  {needsApproval ? (
                    <ShieldCheckIcon className="w-5 h-5" />
                  ) : (
                    <ArrowRightIcon className="w-5 h-5" />
                  )}
                </span>
                <span className="text-base">{getActionButtonText()}</span>
              </>
            )}
          </div>
        </motion.button>

        {/* Help Text */}
        <div className="mt-6 bg-gradient-to-br from-gray-900/50 to-black/50 rounded-xl border border-gray-800/50 p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
            <InformationCircleIcon className="w-4 h-4 mr-2 text-indigo-400" />
            Transaction Information
          </h4>
          
          <div className="space-y-3">
            <motion.div 
              className="flex items-start space-x-3 group"
              whileHover={{ x: 2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-purple-900/20 p-1.5 rounded-lg mt-0.5">
                <ShieldCheckIcon className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs leading-relaxed text-gray-400 group-hover:text-gray-300 transition-colors">
                  <span className="text-purple-400 font-medium">Approval:</span> First time depositing? You'll need to approve the token first to ensure security.
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex items-start space-x-3 group"
              whileHover={{ x: 2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-indigo-900/20 p-1.5 rounded-lg mt-0.5">
                <ArrowRightIcon className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs leading-relaxed text-gray-400 group-hover:text-gray-300 transition-colors">
                  <span className="text-indigo-400 font-medium">Deposit:</span> Your deposit will be processed immediately after confirmation and shares will be minted.
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex items-start space-x-3 group"
              whileHover={{ x: 2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-pink-900/20 p-1.5 rounded-lg mt-0.5">
                <CurrencyDollarIcon className="w-4 h-4 text-pink-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs leading-relaxed text-gray-400 group-hover:text-gray-300 transition-colors">
                  <span className="text-pink-400 font-medium">Gas Fees:</span> Transaction requires Monad gas fees. Make sure you have sufficient MON for transaction costs.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositForm;
