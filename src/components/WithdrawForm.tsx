//@ts-nocheck
import React, { useState, useEffect } from 'react';
import { FC } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, formatUnits, formatEther } from 'viem';
import { AoP1_VAULT_ADDRESS, AoP2_VAULT_ADDRESS } from '../config/contracts';
import { AoP1_VAULT_ABI, AoP2_VAULT_ABI } from '../config/abis';
import { USDT, MON } from '../config/tokens';
import { motion } from 'framer-motion';
import { ArrowPathIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon, CurrencyDollarIcon, ShieldCheckIcon, BoltIcon, ChartBarIcon, CubeTransparentIcon, ArrowTrendingUpIcon, ScaleIcon, WalletIcon, ArrowsRightLeftIcon, BanknotesIcon, ClockIcon } from '@heroicons/react/24/outline';

// Define animation variants for consistent animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

// Define styles to ensure consistency
const gradientTextStyle = "text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400";

type VaultType = 'AoP1' | 'AoP2';

const WithdrawForm: FC = () => {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [vaultType, setVaultType] = useState<VaultType>('AoP1');
  const [withdrawAsMon, setWithdrawAsMon] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Clear success and error messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const vaultAddress = vaultType === 'AoP1' ? AoP1_VAULT_ADDRESS : AoP2_VAULT_ADDRESS;
  const vaultAbi = vaultType === 'AoP1' ? AoP1_VAULT_ABI : AoP2_VAULT_ABI;

  const { data: shareBalance, isLoading: isBalanceLoading } = useReadContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: 'balanceOf',
    args: [address!],
    enabled: !!address && isMounted,
  });

  const { data: navPerShare, isLoading: isNavLoading } = useReadContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: 'navPerShare',
    enabled: isMounted,
  });

  // Get comprehensive user details from the vault
  const { data: userDetails, isLoading: isUserDetailsLoading } = useReadContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: 'getUserDetails',
    args: [address!],
    enabled: !!address && isMounted,
  });

  const { writeContract, data: withdrawHash } = useWriteContract();

  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } =
    useWaitForTransactionReceipt({
      hash: withdrawHash,
    });
    
  // Update status when withdrawal transaction is successful
  useEffect(() => {
    if (isWithdrawSuccess) {
      setSuccess('Withdrawal successful!');
      setAmount('');
      setIsWithdrawing(false);
    }
  }, [isWithdrawSuccess]);

  const handleWithdraw = async () => {
    if (!amount || !address || !userDetails) return;
    setError('');
    setSuccess('');
    setIsWithdrawing(true);
    
    try {
      const shareAmount = parseUnits(amount, withdrawAsMon ? 18 : 18); // Use 18 decimals for MON, 6 for USDT
      
      if (vaultType === 'AoP1') {
        await writeContract({
          address: AoP1_VAULT_ADDRESS,
          abi: AoP1_VAULT_ABI,
          functionName: 'withdraw',
          args: [shareAmount, withdrawAsMon, []], // Empty updates array for AoP1
        });
      } else {
        await writeContract({
          address: AoP2_VAULT_ADDRESS,
          abi: AoP2_VAULT_ABI,
          functionName: 'withdraw',
          args: [shareAmount],
        });
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      setError('Failed to process withdrawal. Please try again.');
      setIsWithdrawing(false);
    }
  };

  const isLoading = !isMounted || isBalanceLoading || isNavLoading || isUserDetailsLoading;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-black/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-8 shadow-xl">
          <div className="animate-pulse space-y-6">
            <div className="flex justify-between">
              <div className="h-8 bg-purple-500/20 rounded w-1/3"></div>
              <div className="h-8 bg-purple-500/20 rounded w-1/4"></div>
            </div>
            <div className="h-12 bg-purple-500/20 rounded"></div>
            <div className="h-12 bg-purple-500/20 rounded"></div>
            <div className="h-12 bg-purple-500/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const formattedBalance = userDetails ? formatUnits(userDetails[0], 18) : '0'; // shares from getUserDetails
  const valueInUSDT = userDetails ? formatUnits(userDetails[1], 18) : '0'; // USDT value with 18 decimals
  const percentageOfVault = userDetails ? Number(userDetails[2]) / 100 : 0; // Convert basis points to percentage
  const profitSinceDeposit = userDetails ? formatUnits(userDetails[3], 18) : '0'; // Profit in USDT with 18 decimals

  // Helper function to format currency values
  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '$0.00';
    
    // Check if the number is very small or very large
    if (num < 0.01 && num > 0) {
      return `$${num.toFixed(6)}`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-black/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header Section */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/10 to-purple-600/5 rounded-2xl blur-xl"></div>
            <motion.div variants={itemVariants} className="relative">
              <h1 className={gradientTextStyle}>
                Withdraw from Vault
              </h1>
              <p className="text-gray-400 text-sm sm:text-base mb-4">
                Withdraw your funds from <span className="text-white font-medium">AI Agent of Profits</span> vaults securely and easily
              </p>
              
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                <div className="flex items-center bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-purple-600/20">
                  <CheckCircleIcon className="w-4 h-4 mr-1.5 text-green-400" />
                  <span className="text-xs text-gray-300">Direct withdrawal</span>
                </div>
                <div className="flex items-center bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-purple-600/20">
                  <InformationCircleIcon className="w-4 h-4 mr-1.5 text-blue-400" />
                  <span className="text-xs text-gray-300">No withdrawal delays</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Vault Selection - Enhanced UI */}
          <motion.div variants={itemVariants} className="relative">
            <p className="text-sm text-gray-400 mb-2 flex items-center">
              <CubeTransparentIcon className="w-4 h-4 mr-1.5 text-purple-400" />
              <span>Select Vault</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* AoP1 Vault Card */}
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${
                  vaultType === 'AoP1' 
                    ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/20' 
                    : 'hover:shadow-md hover:shadow-purple-500/10'
                }`}
              >
                {/* Background gradient with animated movement */}
                <div className={`absolute inset-0 transition-opacity duration-300 ${
                  vaultType === 'AoP1' 
                    ? 'opacity-100' 
                    : 'opacity-0 group-hover:opacity-40'
                }`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-pink-600/20 to-purple-600/10 animate-pulse"></div>
                </div>
                
                <button 
                  onClick={() => setVaultType('AoP1')}
                  className="relative z-10 w-full h-full flex flex-col p-4 items-center text-center"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                    vaultType === 'AoP1' 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                      : 'bg-gray-800'
                  }`}>
                    <ShieldCheckIcon className={`w-6 h-6 ${
                      vaultType === 'AoP1' ? 'text-white' : 'text-gray-400'
                    }`} />
                  </div>
                  
                  <h3 className={`text-lg font-bold mb-1 ${
                    vaultType === 'AoP1' 
                      ? 'bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400' 
                      : 'text-gray-300'
                  }`}>
                    AoP1 Vault
                  </h3>
                  
                  <p className="text-xs text-gray-400 mb-3">Medium Risk Strategy</p>
                  
                  <div className="flex flex-wrap justify-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-300 border border-purple-800/50">Dual-asset</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-300 border border-blue-800/50">MON+USDT</span>
                  </div>
                  
                 
                </button>
              </motion.div>
              
              {/* AoP2 Vault Card */}
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${
                  vaultType === 'AoP2' 
                    ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/20' 
                    : 'hover:shadow-md hover:shadow-purple-500/10'
                }`}
              >
                {/* Background gradient with animated movement */}
                <div className={`absolute inset-0 transition-opacity duration-300 ${
                  vaultType === 'AoP2' 
                    ? 'opacity-100' 
                    : 'opacity-0 group-hover:opacity-40'
                }`}>
                  <div className="absolute inset-0 bg-gradient-to-bl from-purple-600/30 via-pink-600/20 to-purple-600/10 animate-pulse"></div>
                </div>
                
                <button 
                  onClick={() => setVaultType('AoP2')}
                  className="relative z-10 w-full h-full flex flex-col p-4 items-center text-center"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                    vaultType === 'AoP2' 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                      : 'bg-gray-800'
                  }`}>
                    <BoltIcon className={`w-6 h-6 ${
                      vaultType === 'AoP2' ? 'text-white' : 'text-gray-400'
                    }`} />
                  </div>
                  
                  <h3 className={`text-lg font-bold mb-1 ${
                    vaultType === 'AoP2' 
                      ? 'bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400' 
                      : 'text-gray-300'
                  }`}>
                    AoP2 Vault
                  </h3>
                  
                  <p className="text-xs text-gray-400 mb-3">High Risk Strategy</p>
                  
                  <div className="flex flex-wrap justify-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-pink-900/30 text-pink-300 border border-pink-800/50">Single-asset</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/30 text-green-300 border border-green-800/50">USDT only</span>
                  </div>
                  
                 
                </button>
              </motion.div>
            </div>
            
            {/* Selected Vault Indicator */}
            <div className="mt-3 flex justify-center">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center text-sm text-gray-400 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-purple-600/20"
              >
                <ChartBarIcon className="w-4 h-4 mr-1.5 text-purple-400" />
                <span>Selected: <span className="text-white font-medium">{vaultType}</span> {vaultType === 'AoP1' ? '(Medium Risk)' : '(High Risk)'}</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Vault Info - Enhanced UI */}
          <motion.div 
            variants={itemVariants} 
            className="relative space-y-3"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-gray-400 flex items-center">
                <WalletIcon className="w-4 h-4 mr-1.5 text-purple-400" />
                <span>Your Position</span>
              </p>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xs text-gray-500 flex items-center"
              >
                <ClockIcon className="w-3 h-3 mr-1" />
                <span>Last update: {new Date().toLocaleTimeString()}</span>
              </motion.div>
            </div>
            
            {/* Main Position Card - Simplified */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
              }}
              className="relative overflow-hidden p-0.5 rounded-2xl bg-gradient-to-r from-purple-500/30 via-pink-500/20 to-purple-500/30"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-30 animate-pulse"></div>
              
              <div className="relative bg-black/60 backdrop-filter backdrop-blur-md rounded-2xl p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Shares */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-gray-400 text-sm">
                      <span className="flex items-center">
                        <CubeTransparentIcon className="w-4 h-4 mr-1.5 text-purple-400" />
                        Your Shares
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-800/50">
                        {vaultType}
                      </span>
                    </div>
                    
                    <div className="flex items-end">
                      <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-300">
                        {parseFloat(formattedBalance) < 0.0001 && parseFloat(formattedBalance) > 0 
                          ? parseFloat(formattedBalance).toExponential(4) 
                          : parseFloat(formattedBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </span>
                      <span className="text-xs text-gray-500 ml-2 mb-1">shares</span>
                    </div>
                  </div>
                  
                  {/* Portfolio Value */}
                  <div className="space-y-1">
                    <div className="flex items-center text-gray-400 text-sm">
                      <BanknotesIcon className="w-4 h-4 mr-1.5 text-green-400" />
                      Portfolio Value
                    </div>
                    
                    <div className="flex items-end">
                      <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500">
                        {formatCurrency(valueInUSDT)}
                      </span>
                      <span className="text-xs text-gray-500 ml-2 mb-1">USDT</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Withdrawal Form - Enhanced UI */}
          <motion.div 
            variants={itemVariants} 
            className="space-y-5 mt-4"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-gray-400 flex items-center">
                <ArrowsRightLeftIcon className="w-4 h-4 mr-1.5 text-purple-400" />
                <span>Withdrawal Amount</span>
              </p>
            </div>
            
            {/* Amount Input */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
              }}
              className="relative"
            >
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <CubeTransparentIcon className="h-5 w-5 text-purple-400" />
              </div>
              
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full pl-12 pr-24 py-4 bg-black/30 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-xl font-medium transition-all duration-200 hover:border-purple-500/40"
              />
              
              <div className="absolute right-0 inset-y-0 flex items-center">
                <button 
                  type="button"
                  onClick={() => userDetails && setAmount(formattedBalance)}
                  className="h-full px-4 text-sm text-purple-300 hover:text-white transition-colors duration-200 flex items-center bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-r-xl border-l border-purple-500/30"
                >
                  <span>MAX</span>
                </button>
              </div>
              
              <div className="absolute right-20 inset-y-0 flex items-center">
                <span className="text-gray-400 text-sm">Shares</span>
              </div>
            </motion.div>
            
            {/* Expected Return */}
            {amount && parseFloat(amount) > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl p-3 border border-purple-500/20"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Estimated Return:</span>
                  <span className="text-sm font-medium text-white">
                    {formatCurrency(parseFloat(amount || '0') * parseFloat(userDetails?.navPerShare || '0') / 1e18)} USDT
                  </span>
                </div>
              </motion.div>
            )}
            
            {/* AoP1 Currency Selection */}
            {vaultType === 'AoP1' && (
              <motion.div 
                variants={itemVariants}
                className="bg-gradient-to-r from-purple-900/10 to-pink-900/10 rounded-xl border border-purple-500/20 p-0.5"
              >
                <div className="bg-black/70 backdrop-filter backdrop-blur-sm rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        withdrawAsMon 
                          ? 'bg-blue-900/40 border border-blue-700/50' 
                          : 'bg-green-900/40 border border-green-700/50'
                      }`}>
                        <CurrencyDollarIcon className="w-5 h-5 text-gray-300" />
                      </div>
                      
                      <div>
                        <div className="text-gray-300 font-medium">
                          Withdraw as {withdrawAsMon ? 'MON' : 'USDT'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {withdrawAsMon 
                            ? 'Native Monad token' 
                            : 'Stable USD'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="self-center sm:self-auto flex items-center justify-center mt-2 sm:mt-0">
                      <span className={`mr-3 text-sm ${!withdrawAsMon ? 'text-green-400 font-medium' : 'text-gray-400'}`}>USDT</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={withdrawAsMon}
                          onChange={() => setWithdrawAsMon(!withdrawAsMon)}
                        />
                        <div className={`w-14 h-7 bg-gray-800 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 ${
                          withdrawAsMon 
                            ? 'bg-gradient-to-r from-blue-600/50 to-purple-600/50 border border-blue-500/50' 
                            : 'bg-gradient-to-r from-green-600/50 to-teal-600/50 border border-green-500/50'
                        }`}></div>
                      </label>
                      <span className={`ml-3 text-sm ${withdrawAsMon ? 'text-blue-400 font-medium' : 'text-gray-400'}`}>MON</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Status Messages - Enhanced UI */}
          <motion.div className="space-y-3 my-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-700/10 animate-pulse"></div>
                <div className="relative backdrop-blur-sm flex items-start space-x-3 text-red-400 text-sm p-4 rounded-xl border border-red-500/20">
                  <div className="bg-red-900/30 rounded-full p-2 flex-shrink-0">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-medium pb-0.5">Transaction Error</p>
                    <p className="text-red-300/80">{error}</p>
                  </div>
                  <button 
                    onClick={() => setError('')}
                    className="text-red-400/70 hover:text-red-300 p-1 rounded-full transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 animate-pulse"></div>
                <div className="relative backdrop-blur-sm flex items-start space-x-3 text-green-400 text-sm p-4 rounded-xl border border-green-500/20">
                  <div className="bg-green-900/30 rounded-full p-2 flex-shrink-0">
                    <CheckCircleIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-medium pb-0.5">Success</p>
                    <p className="text-green-300/80">{success}</p>
                  </div>
                  <button 
                    onClick={() => setSuccess('')}
                    className="text-green-400/70 hover:text-green-300 p-1 rounded-full transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Withdraw Button - Enhanced UI */}
          <motion.div 
            variants={itemVariants}
            className="relative mt-6 overflow-hidden p-0.5 rounded-xl bg-gradient-to-r from-purple-500/70 via-pink-500/70 to-purple-500/70"
          >
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={!amount || isWithdrawConfirming || Number(amount) <= 0 || Number(amount) > Number(formattedBalance)}
              onClick={handleWithdraw}
              className={`relative w-full py-4 px-6 rounded-xl font-semibold text-white flex items-center justify-center space-x-3 transition-all duration-200 overflow-hidden ${
                !amount || Number(amount) <= 0 || Number(amount) > Number(formattedBalance)
                  ? 'bg-gray-800/90 cursor-not-allowed'
                  : 'bg-black/60 hover:bg-black/50 backdrop-blur-sm'
              }`}
            >
              {/* Animated background for enabled state */}
              {(!(!amount || Number(amount) <= 0 || Number(amount) > Number(formattedBalance))) && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-80"></div>
              )}
              
              <div className="relative z-10 flex items-center justify-center space-x-2">
                {isWithdrawConfirming || isWithdrawing ? (
                  <>
                    <div className="relative">
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-purple-500/20"
                      ></motion.div>
                    </div>
                    <span className="font-medium">Processing Withdrawal...</span>
                  </>
                ) : (
                  <>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      withdrawAsMon && vaultType === 'AoP1' 
                        ? 'bg-blue-700/80' 
                        : 'bg-green-700/80'
                    }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="font-medium">Withdraw {withdrawAsMon && vaultType === 'AoP1' ? 'as MON' : 'as USDT'}</span>
                  </>
                )}
              </div>
              
              {/* Amount indicator */}
              {amount && Number(amount) > 0 && Number(amount) <= Number(formattedBalance) && !isWithdrawConfirming && !isWithdrawing && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm py-1 px-3 rounded-full border border-purple-500/40 flex items-center">
                  <span className="text-xs font-medium text-purple-300">{amount} shares</span>
                </div>
              )}
            </motion.button>
            
            {/* Validation message */}
            {amount && Number(amount) > Number(formattedBalance) && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -bottom-6 left-0 right-0 text-center text-xs text-red-400"
              >
                Insufficient shares balance
              </motion.div>
            )}
          </motion.div>
          
          {/* Final note */}
          <motion.div 
            variants={itemVariants} 
            className="mt-8 text-center opacity-60 hover:opacity-100 transition-opacity duration-300"
          >
            <p className="text-xs text-gray-500">
              Withdrawing from {vaultType} {vaultType === 'AoP1' ? '(Medium Risk)' : '(High Risk)'} Vault on Monad Testnet
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default WithdrawForm;
