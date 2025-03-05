//@ts-nocheck
import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'ethers';
import { FACTORY_VAULT_ADDRESS, AoP1_VAULT_ADDRESS, AoP2_VAULT_ADDRESS } from '../config/contracts';
import { FACTORY_VAULT_ABI } from '../config/abis';
import { USDT, MON } from '../config/tokens';
import { motion } from 'framer-motion';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ArrowPathIcon, CalendarIcon, WalletIcon, ScaleIcon } from '@heroicons/react/24/outline';

// Helper function to format currency values
const formatCurrency = (value, decimals = 2) => {
  if (!value) return '0.00';
  
  // Ensure value is treated as a number
  const num = parseFloat(value);
  
  // Handle potential NaN
  if (isNaN(num)) return '0.00';
  
  // Cap extremely large values to prevent display issues
  const cappedValue = num > 1e12 ? 1e12 : num;
  
  // Format with commas for thousands
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(cappedValue);
};

// Helper function to calculate and format time elapsed since a date
const getTimeElapsed = (date: Date): string => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    const remainingMonths = Math.floor((diffDays % 365) / 30);
    if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
    return `${years} ${years === 1 ? 'year' : 'years'}, ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'} ago`;
  }
};

const PortfolioCard = () => {
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');
  const [selectedVaultType, setSelectedVaultType] = useState('AoP1'); // Default to AoP1
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const vaultAddress = selectedVaultType === 'AoP1' ? AoP1_VAULT_ADDRESS : AoP2_VAULT_ADDRESS;

  // Log state for debugging
  console.log('Component Mount Status:', mounted);
  console.log('Current addresses:', { 
    factoryVault: FACTORY_VAULT_ADDRESS, 
    vaultAddress, 
    userAddress: address
  });
  
  // Get user details from the factory contract
  const { data: userDetails, isLoading: isDetailsLoading, refetch: refetchDetails, error: userDetailsError } = useReadContract({
    address: FACTORY_VAULT_ADDRESS,
    abi: FACTORY_VAULT_ABI,
    functionName: 'getUserDetails',
    args: [vaultAddress, address],
    enabled: !!address && mounted,
  });

  // Get vault statistics from the factory contract
  const { data: vaultStats, isLoading: isStatsLoading, refetch: refetchStats, error: vaultStatsError } = useReadContract({
    address: FACTORY_VAULT_ADDRESS,
    abi: FACTORY_VAULT_ABI,
    functionName: 'getVaultStatistics',
    args: [vaultAddress],
    enabled: mounted,
  });

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchDetails();
      await refetchStats();
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000); // Minimum 1 second for visual feedback
    }
  };

  // Log data and errors for debugging
  useEffect(() => {
    if (mounted) {
      if (address) {
        console.log('Raw User Details:', userDetails);
        console.log('User Details Error:', userDetailsError);
      }
      console.log('Raw Vault Stats:', vaultStats);
      console.log('Vault Stats Error:', vaultStatsError);
    }
  }, [mounted, address, userDetails, vaultStats, userDetailsError, vaultStatsError]);

  const isLoading = !mounted || isDetailsLoading || isStatsLoading;

  if (isLoading) {
    return (
      <div className="bg-black/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-8 shadow-xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-purple-500/20 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-purple-500/20 rounded"></div>
            <div className="h-4 bg-purple-500/20 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black/50 backdrop-blur-xl rounded-3xl border border-red-500/20 p-8 shadow-xl">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  // Parse user details if available
  const processedUserDetails = userDetails ? {
    shares: userDetails[0] ? formatUnits(userDetails[0], 18) : '0',
    valueInUSDT: userDetails[1] ? formatUnits(userDetails[1], 18) : '0',
    percentageOfVault: userDetails[2] ? Number(userDetails[2]) / 100 : 0, // Convert to percentage from basis points
    profitSinceDeposit: userDetails[3] ? formatUnits(userDetails[3], 18) : '0',
    initialDepositDate: userDetails[4] ? new Date(Number(userDetails[4]) * 1000) : null,
    monDeposited: userDetails[5] ? formatUnits(userDetails[5], 18) : '0',
    usdtDeposited: userDetails[6] ? formatUnits(userDetails[6], 6) : '0',
  } : null;

  // Parse vault statistics if available
  const processedVaultStats = vaultStats ? {
    totalAssets: vaultStats[0] ? formatUnits(vaultStats[0], 6) : '0', // in USDT
    sharePrice: vaultStats[1] ? formatUnits(vaultStats[1], 18) : '0',
    totalShares: vaultStats[2] ? formatUnits(vaultStats[2], 18) : '0',
    monBalance: vaultStats[3] ? formatUnits(vaultStats[3], 18) : '0',
    usdtBalance: vaultStats[4] ? formatUnits(vaultStats[4], 6) : '0',
    lastUpdateTime: vaultStats[5] ? new Date(Number(vaultStats[5]) * 1000) : null,
    userCount: vaultStats[6] ? Number(vaultStats[6]) : 0,
  } : null;

  // Calculate profit/loss percentage
  const calculateProfitPercentage = () => {
    if (!processedUserDetails) return 0;
    
    const depositedValue = parseFloat(processedUserDetails.usdtDeposited);
    const profitValue = parseFloat(processedUserDetails.profitSinceDeposit);
    
    if (depositedValue === 0) return 0;
    
    // Calculate percentage correctly
    return (profitValue / depositedValue) * 100;
  };
  
  const profitLossPercentage = calculateProfitPercentage();
  const hasInvestment = processedUserDetails && (Number(processedUserDetails.shares) > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-black/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-8 shadow-xl hover:shadow-2xl transition-all duration-300"
    >
      <div className="space-y-6">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="relative">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-white">
                  Portfolio <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400">Dashboard</span>
                </h2>
                <div className="absolute -bottom-2 left-0 w-1/2 h-1 bg-gradient-to-r from-purple-500 to-transparent rounded-full"></div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                <div className="mt-3 flex items-center space-x-2">
                  <p className="text-gray-400">Your investment summary</p>
                  <div className="flex items-center bg-green-900/30 px-2 py-0.5 rounded-full border border-green-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></div>
                    <p className="text-xs font-medium text-green-400">Live</p>
                  </div>
                </div>
              </motion.div>
            </div>
            
            <div className="flex items-center space-x-3">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center"
              >
                <div className="hidden md:block text-right mr-3">
                  <p className="text-gray-300 text-sm font-medium">Last refresh</p>
                  <p className="text-gray-500 text-xs">
                    {processedVaultStats?.lastUpdateTime ? 
                      new Date(processedVaultStats.lastUpdateTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      }) : 'Never'}
                  </p>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(168, 85, 247, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`p-3 rounded-xl ${isRefreshing ? 'bg-purple-900/50' : 'bg-gradient-to-br from-purple-900/80 to-indigo-900/80'} backdrop-blur-sm border border-purple-700/30 shadow-lg transition-all duration-300`}
                >
                  <ArrowPathIcon className={`w-5 h-5 text-purple-300 ${isRefreshing ? 'animate-spin' : ''}`} />
                </motion.button>
              </motion.div>
              
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <button 
                  className="p-3 rounded-xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/30 shadow-lg hover:bg-gray-800 transition-all duration-300"
                  onClick={() => window.open('https://testnet.monadexplorer.com/', '_blank')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400">
                    <path fillRule="evenodd" d="M15.75 2.25H21a.75.75 0 01.75.75v5.25a.75.75 0 01-1.5 0V4.81L8.03 17.03a.75.75 0 01-1.06-1.06L19.19 3.75h-3.44a.75.75 0 010-1.5zm-10.5 4.5a1.5 1.5 0 00-1.5 1.5v10.5a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5V10.5a.75.75 0 011.5 0v8.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V8.25a3 3 0 013-3h8.25a.75.75 0 010 1.5H5.25z" clipRule="evenodd" />
                  </svg>
                </button>
              </motion.div>
            </div>
          </div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full h-px bg-gradient-to-r from-purple-500/50 via-indigo-500/50 to-transparent mt-6"
          ></motion.div>
        </div>

        {/* Vault Selector - Enhanced Design */}
        <div className="mb-6">
          <div className="bg-black/30 backdrop-blur-md rounded-xl p-1.5 inline-flex shadow-lg shadow-purple-900/10">
            <button
              onClick={() => setSelectedVaultType('AoP1')}
              className={`relative px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                selectedVaultType === 'AoP1'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {selectedVaultType === 'AoP1' && (
                <motion.div
                  layoutId="vaultSelectorBg"
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-400 rounded-lg shadow-xl"
                  initial={false}
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Medium Risk
              </span>
            </button>
            <button
              onClick={() => setSelectedVaultType('AoP2')}
              className={`relative px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                selectedVaultType === 'AoP2'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {selectedVaultType === 'AoP2' && (
                <motion.div
                  layoutId="vaultSelectorBg"
                  className="absolute inset-0 bg-gradient-to-r from-pink-600 to-pink-400 rounded-lg shadow-xl"
                  initial={false}
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 9L13.9558 13.5662C13.5299 14.2051 12.5728 14.1455 12.2294 13.4587L11.7706 12.5413C11.4272 11.8545 10.4701 11.7949 10.0442 12.4338L7 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                High Risk
              </span>
            </button>
          </div>
        </div>

        {!hasInvestment ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="py-12 text-center flex flex-col items-center"
          >
            <div className="bg-black/30 backdrop-blur-md rounded-full p-4 mb-4">
              <svg className="w-12 h-12 text-purple-400/50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 8V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-200 mb-2">No Investment Yet</h3>
            <p className="text-gray-400 max-w-sm">You don't have any investments in this vault yet.</p>
            <p className="text-gray-500 mt-2">Make a deposit to start earning.</p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* User Investment Summary - Enhanced Design */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Investment Value Card */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-black/30 to-purple-900/10 backdrop-blur-md rounded-2xl p-5 border border-purple-500/10 shadow-lg shadow-purple-900/5"
              >
                <div className="flex flex-col h-full">
                  <div className="mb-1 flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500/10 rounded-lg">
                      <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-400">Investment Value</p>
                  </div>
                  <h3 className="text-2xl font-bold mt-auto">
                    <span className="text-sm text-gray-500 mr-1">$</span>
                    {formatCurrency(processedUserDetails?.valueInUSDT)}
                  </h3>
                </div>
              </motion.div>

              {/* Shares Card */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-black/30 to-purple-900/10 backdrop-blur-md rounded-2xl p-5 border border-purple-500/10 shadow-lg shadow-purple-900/5"
              >
                <div className="flex flex-col h-full">
                  <div className="mb-1 flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500/10 rounded-lg">
                      <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-400">Your Shares</p>
                  </div>
                  <h3 className="text-2xl font-bold mt-auto">
                    {formatCurrency(processedUserDetails?.shares, 6)}
                  </h3>
                </div>
              </motion.div>

              {/* Profit/Loss Card */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-black/30 to-purple-900/10 backdrop-blur-md rounded-2xl p-5 border border-purple-500/10 shadow-lg shadow-purple-900/5"
              >
                <div className="flex flex-col h-full">
                  <div className="mb-1 flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${profitLossPercentage >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      {profitLossPercentage >= 0 ? (
                        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-400">Profit/Loss</p>
                  </div>
                  <div className="flex flex-col mt-auto">
                    <h3 className={`text-2xl font-bold ${profitLossPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(profitLossPercentage, 2)}%
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      ${formatCurrency(processedUserDetails?.profitSinceDeposit)} USDT
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Portfolio Share Card */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-black/30 to-purple-900/10 backdrop-blur-md rounded-2xl p-5 border border-purple-500/10 shadow-lg shadow-purple-900/5"
              >
                <div className="flex flex-col h-full">
                  <div className="mb-1 flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500/10 rounded-lg">
                      <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-400">Portfolio Share</p>
                  </div>
                  <div className="flex flex-col mt-auto">
                    <h3 className="text-2xl font-bold">
                      {formatCurrency(processedUserDetails?.percentageOfVault, 2)}%
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">of total vault</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Detailed Investment Information */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 pt-6 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-indigo-900/10 rounded-xl" style={{ top: '1.5rem' }}></div>
          
          <div className="flex items-center mb-6">
            <div className="h-px flex-grow bg-gradient-to-r from-purple-500/40 to-transparent"></div>
            <h3 className="text-xl font-semibold px-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300">
              Investment Details
            </h3>
            <div className="h-px flex-grow bg-gradient-to-r from-transparent to-indigo-500/40"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative">
            {/* Initial Deposit Card */}
            <motion.div 
              whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(31, 12, 61, 0.2)" }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-purple-500/20 p-4 rounded-xl backdrop-blur-sm"
            >
              <div className="flex items-start space-x-4">
                <div className="bg-purple-900/40 p-3 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-1">Initial Deposit</p>
                  <p className="text-lg font-medium text-gray-200">
                    {processedUserDetails?.initialDepositDate?.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) || 'Not available'}
                  </p>
                  {processedUserDetails?.initialDepositDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      {getTimeElapsed(processedUserDetails.initialDepositDate)}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Total Deposited Card */}
            <motion.div 
              whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(31, 12, 61, 0.2)" }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-purple-500/20 p-4 rounded-xl backdrop-blur-sm"
            >
              <div className="flex items-start space-x-4">
                <div className="bg-indigo-900/40 p-3 rounded-lg">
                  <WalletIcon className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-1">Total Deposited</p>
                  <div>
                    <p className="text-lg font-medium text-gray-200 flex items-center">
                      <span className="text-green-400 mr-1.5">$</span>
                      {formatCurrency(processedUserDetails?.usdtDeposited)}
                      <span className="text-sm text-gray-400 ml-1">USDT</span>
                    </p>
                    {selectedVaultType === 'AoP1' && Number(processedUserDetails?.monDeposited) > 0 && (
                      <p className="text-base text-gray-300 mt-1 flex items-center">
                        <span className="w-3 h-3 rounded-full bg-purple-500 mr-1.5"></span>
                        {formatCurrency(processedUserDetails?.monDeposited, 4)}
                        <span className="text-sm text-gray-400 ml-1">MON</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Vault Statistics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 pt-6 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/10 to-purple-900/10 rounded-xl" style={{ top: '1.5rem' }}></div>
          
          <div className="flex items-center mb-6">
            <div className="h-px flex-grow bg-gradient-to-r from-indigo-500/40 to-transparent"></div>
            <h3 className="text-xl font-semibold px-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
              Vault Statistics
            </h3>
            <div className="h-px flex-grow bg-gradient-to-r from-transparent to-purple-500/40"></div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 relative">
            {/* Share Price Card */}
            <motion.div 
              whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(31, 12, 61, 0.2)" }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-indigo-500/20 p-4 rounded-xl backdrop-blur-sm"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">Share Price</p>
                  <div className="w-8 h-8 rounded-full bg-indigo-900/40 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-auto">
                  <p className="text-xl font-medium text-gray-200 flex items-end">
                    <span className="text-green-400 mr-1">$</span>
                    {formatCurrency(processedVaultStats?.sharePrice, 6)}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Total Value Card */}
            <motion.div 
              whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(31, 12, 61, 0.2)" }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-indigo-500/20 p-4 rounded-xl backdrop-blur-sm"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">Total Value</p>
                  <div className="w-8 h-8 rounded-full bg-purple-900/40 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-auto">
                  <p className="text-xl font-medium text-gray-200 flex items-end">
                    <span className="text-green-400 mr-1">$</span>
                    {formatCurrency(processedVaultStats?.totalAssets)}
                    <span className="text-xs text-gray-400 ml-1.5">USDT</span>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Users Card */}
            <motion.div 
              whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(31, 12, 61, 0.2)" }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-indigo-500/20 p-4 rounded-xl backdrop-blur-sm"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">Active Users</p>
                  <div className="w-8 h-8 rounded-full bg-blue-900/40 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="flex items-end">
                    <p className="text-xl font-medium text-gray-200">
                      {processedVaultStats?.userCount || 0}
                    </p>
                    <p className="text-xs text-gray-400 ml-1.5 mb-0.5">investor{(processedVaultStats?.userCount !== 1) ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Total Shares Card */}
            <motion.div 
              whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(31, 12, 61, 0.2)" }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-indigo-500/20 p-4 rounded-xl backdrop-blur-sm"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">Total Shares</p>
                  <div className="w-8 h-8 rounded-full bg-teal-900/40 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </div>
                <div className="mt-auto">
                  <p className="text-xl font-medium text-gray-200">
                    {formatCurrency(processedVaultStats?.totalShares, 4)}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* USDT Balance Card */}
            <motion.div 
              whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(31, 12, 61, 0.2)" }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-indigo-500/20 p-4 rounded-xl backdrop-blur-sm"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">USDT Balance</p>
                  <div className="w-8 h-8 rounded-full bg-green-900/40 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="flex items-end">
                    <p className="text-xl font-medium text-gray-200">
                      {formatCurrency(processedVaultStats?.usdtBalance)}
                    </p>
                    <p className="text-xs text-gray-400 ml-1.5 mb-0.5">USDT</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* MON Balance Card - Only for AoP1 */}
            {selectedVaultType === 'AoP1' && (
              <motion.div 
                whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(31, 12, 61, 0.2)" }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-indigo-500/20 p-4 rounded-xl backdrop-blur-sm"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400">MON Balance</p>
                    <div className="w-8 h-8 rounded-full bg-purple-900/40 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 11V9a2 2 0 00-2-2m2 4v4a2 2 0 104 0v-1m-4-3H9m2 0h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <div className="flex items-end">
                      <p className="text-xl font-medium text-gray-200">
                        {formatCurrency(processedVaultStats?.monBalance, 4)}
                      </p>
                      <p className="text-xs text-gray-400 ml-1.5 mb-0.5">MON</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-6 flex items-center justify-between"
          >
            <div className="flex items-center space-x-2 bg-gray-800/40 rounded-full px-3 py-1.5 border border-gray-700/50">
              <div className="relative w-2 h-2">
                <div className="absolute w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="absolute w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <p className="text-xs text-gray-400 font-medium">
                Last Updated: {processedVaultStats?.lastUpdateTime ? 
                  new Date(processedVaultStats.lastUpdateTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  }) : 'N/A'}
              </p>
            </div>
            <div className="text-xs text-gray-500">
              {processedVaultStats?.lastUpdateTime?.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }) || ''}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PortfolioCard;
