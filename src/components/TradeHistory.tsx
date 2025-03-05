//@ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useWatchContractEvent, usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';
import { TRADING_VAULT_ABI, TRADING_VAULT_ADDRESS } from '../config/contracts';
import { USDT } from '../config/tokens';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon, FunnelIcon, CalendarIcon, XMarkIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const BLOCKS_PER_DAY = 28800n; // ~3s block time on BSC
const DAYS_TO_LOOK_BACK = 30n;

const FILTER_OPTIONS = {
  ALL: 'all',
  DEPOSITS: 'deposits',
  WITHDRAWALS: 'withdrawals',
};

const TIME_FILTERS = {
  ALL: 'all',
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
};

const TradeHistory = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [mounted, setMounted] = useState(false);
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState(FILTER_OPTIONS.ALL);
  const [timeFilter, setTimeFilter] = useState(TIME_FILTERS.ALL);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Watch for Deposit events
  useWatchContractEvent({
    address: TRADING_VAULT_ADDRESS,
    abi: TRADING_VAULT_ABI,
    eventName: 'Deposit',
    onLogs(logs) {
      console.log('New deposit logs:', logs);
      const processNewTrades = async () => {
        try {
          // Fetch block timestamps for new logs
          const blockTimestamps = await Promise.all(
            logs.map(async log => {
              const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
              return {
                blockNumber: log.blockNumber,
                timestamp: Number(block.timestamp) * 1000 // Convert to milliseconds
              };
            })
          );

          // Create timestamp map
          const timestampMap = Object.fromEntries(
            blockTimestamps.map(({ blockNumber, timestamp }) => [blockNumber.toString(), timestamp])
          );

          const newDepositTrades = logs
            .filter(log => log.args.user?.toLowerCase() === address?.toLowerCase())
            .map(log => ({
              type: 'deposit',
              token: log.args.token,
              amount: formatUnits(log.args.amount, USDT.decimals),
              shares: formatUnits(log.args.shares, 18),
              timestamp: timestampMap[log.blockNumber.toString()],
              hash: log.transactionHash,
            }));

          if (newDepositTrades.length > 0) {
            setTrades(prev => [...newDepositTrades, ...prev].sort((a, b) => b.timestamp - a.timestamp));
          }
        } catch (err) {
          console.error('Error processing new deposit logs:', err);
        }
      };

      processNewTrades();
    },
    onError(error) {
      console.error('Error watching deposits:', error);
      setError('Failed to watch deposit events');
    },
    poll: true,
    pollingInterval: 1000,
  });

  // Watch for Withdrawal events
  useWatchContractEvent({
    address: TRADING_VAULT_ADDRESS,
    abi: TRADING_VAULT_ABI,
    eventName: 'WithdrawalProcessed',
    onLogs(logs) {
      console.log('New withdrawal logs:', logs);
      const processNewTrades = async () => {
        try {
          // Fetch block timestamps for new logs
          const blockTimestamps = await Promise.all(
            logs.map(async log => {
              const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
              return {
                blockNumber: log.blockNumber,
                timestamp: Number(block.timestamp) * 1000 // Convert to milliseconds
              };
            })
          );

          // Create timestamp map
          const timestampMap = Object.fromEntries(
            blockTimestamps.map(({ blockNumber, timestamp }) => [blockNumber.toString(), timestamp])
          );

          const newWithdrawalTrades = logs
            .filter(log => log.args.user?.toLowerCase() === address?.toLowerCase())
            .map(log => ({
              type: 'withdrawal',
              token: log.args.token,
              amount: formatUnits(log.args.tokenAmount, USDT.decimals),
              shares: formatUnits(log.args.shareAmount, 18),
              timestamp: timestampMap[log.blockNumber.toString()],
              hash: log.transactionHash,
            }));

          if (newWithdrawalTrades.length > 0) {
            setTrades(prev => [...newWithdrawalTrades, ...prev].sort((a, b) => b.timestamp - a.timestamp));
          }
        } catch (err) {
          console.error('Error processing new withdrawal logs:', err);
        }
      };

      processNewTrades();
    },
    onError(error) {
      console.error('Error watching withdrawals:', error);
      setError('Failed to watch withdrawal events');
    },
    poll: true,
    pollingInterval: 1000,
  });

  // Initial fetch of historical events
  useEffect(() => {
    const fetchHistoricalTrades = async () => {
      if (!mounted || !address) return;

      try {
        setIsLoading(true);
        console.log('Fetching historical trades for address:', address);

        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock - BLOCKS_PER_DAY * DAYS_TO_LOOK_BACK;

        console.log('Fetching events from block', fromBlock.toString(), 'to', currentBlock.toString());

        // Fetch deposit logs
        const depositLogs = await publicClient.getLogs({
          address: TRADING_VAULT_ADDRESS,
          event: {
            type: 'event',
            name: 'Deposit',
            inputs: [
              { name: 'user', type: 'address', indexed: true },
              { name: 'token', type: 'address', indexed: true },
              { name: 'amount', type: 'uint256' },
              { name: 'shares', type: 'uint256' },
            ],
          },
          args: {
            user: address
          },
          fromBlock,
          toBlock: currentBlock
        });

        // Fetch withdrawal logs
        const withdrawalLogs = await publicClient.getLogs({
          address: TRADING_VAULT_ADDRESS,
          event: {
            type: 'event',
            name: 'WithdrawalProcessed',
            inputs: [
              { name: 'user', type: 'address', indexed: true },
              { name: 'token', type: 'address', indexed: true },
              { name: 'shareAmount', type: 'uint256' },
              { name: 'tokenAmount', type: 'uint256' },
            ],
          },
          args: {
            user: address
          },
          fromBlock,
          toBlock: currentBlock
        });

        // Fetch block timestamps for all logs
        const blockNumbers = [...depositLogs, ...withdrawalLogs].map(log => log.blockNumber);
        const uniqueBlockNumbers = [...new Set(blockNumbers)];
        
        const blockTimestamps = await Promise.all(
          uniqueBlockNumbers.map(async blockNumber => {
            const block = await publicClient.getBlock({ blockNumber });
            return {
              blockNumber,
              timestamp: Number(block.timestamp) * 1000 // Convert to milliseconds
            };
          })
        );

        // Create a map for quick timestamp lookup
        const timestampMap = Object.fromEntries(
          blockTimestamps.map(({ blockNumber, timestamp }) => [blockNumber.toString(), timestamp])
        );

        const historicalTrades = [
          ...depositLogs.map(log => ({
            type: 'deposit',
            token: log.args.token,
            amount: formatUnits(log.args.amount, USDT.decimals),
            shares: formatUnits(log.args.shares, 18),
            timestamp: timestampMap[log.blockNumber.toString()],
            hash: log.transactionHash,
          })),
          ...withdrawalLogs.map(log => ({
            type: 'withdrawal',
            token: log.args.token,
            amount: formatUnits(log.args.tokenAmount, USDT.decimals),
            shares: formatUnits(log.args.shareAmount, 18),
            timestamp: timestampMap[log.blockNumber.toString()],
            hash: log.transactionHash,
          })),
        ].sort((a, b) => b.timestamp - a.timestamp);

        setTrades(historicalTrades);
        setError('');
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching historical trades:', err);
        setError('Failed to load trade history');
        setIsLoading(false);
      }
    };

    fetchHistoricalTrades();
  }, [mounted, address, publicClient]);

  const filteredTrades = trades.filter(trade => {
    const matchesType = typeFilter === FILTER_OPTIONS.ALL || 
      (typeFilter === FILTER_OPTIONS.DEPOSITS && trade.type === 'deposit') ||
      (typeFilter === FILTER_OPTIONS.WITHDRAWALS && trade.type === 'withdrawal');

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneWeekMs = 7 * oneDayMs;
    const oneMonthMs = 30 * oneDayMs;

    const matchesTime = timeFilter === TIME_FILTERS.ALL ||
      (timeFilter === TIME_FILTERS.TODAY && (now - trade.timestamp) <= oneDayMs) ||
      (timeFilter === TIME_FILTERS.WEEK && (now - trade.timestamp) <= oneWeekMs) ||
      (timeFilter === TIME_FILTERS.MONTH && (now - trade.timestamp) <= oneMonthMs);

    const matchesSearch = !searchQuery || 
      trade.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.amount.toString().includes(searchQuery);

    return matchesType && matchesTime && matchesSearch;
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const depositVolume = filteredTrades
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const withdrawalVolume = filteredTrades
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalVolume = depositVolume + withdrawalVolume;
    const avgTradeSize = totalVolume / (filteredTrades.length || 1);

    return {
      totalVolume,
      depositVolume,
      withdrawalVolume,
      avgTradeSize,
      tradeCount: filteredTrades.length
    };
  }, [filteredTrades]);

  if (!mounted || isLoading) {
    return (
      <div className="bg-black/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-8 shadow-xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-purple-500/20 rounded w-1/3"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-purple-500/20 rounded"></div>
            ))}
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-black/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-8 shadow-xl hover:shadow-2xl transition-all duration-300"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400">
              Trade History
            </h2>
            <p className="text-gray-400 mt-2">Your deposits and withdrawals</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search trades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-purple-900/10 border border-purple-500/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-purple-900/5 rounded-2xl border border-purple-500/10">
          <div className="flex items-center space-x-3 p-3 bg-purple-900/10 rounded-xl">
            <ChartBarIcon className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-sm text-gray-400">Total Volume</p>
              <p className="text-lg font-bold">${stats.totalVolume.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-900/10 rounded-xl">
            <ArrowUpIcon className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-sm text-gray-400">Total Deposits</p>
              <p className="text-lg font-bold">${stats.depositVolume.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-red-900/10 rounded-xl">
            <ArrowDownIcon className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-sm text-gray-400">Total Withdrawals</p>
              <p className="text-lg font-bold">${stats.withdrawalVolume.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center space-x-2 bg-purple-900/10 rounded-xl p-2">
            <FunnelIcon className="w-4 h-4 text-purple-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-sm focus:outline-none"
            >
              <option value={FILTER_OPTIONS.ALL}>All Types</option>
              <option value={FILTER_OPTIONS.DEPOSITS}>Deposits Only</option>
              <option value={FILTER_OPTIONS.WITHDRAWALS}>Withdrawals Only</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-purple-900/10 rounded-xl p-2">
            <CalendarIcon className="w-4 h-4 text-purple-400" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-transparent text-sm focus:outline-none"
            >
              <option value={TIME_FILTERS.ALL}>All Time</option>
              <option value={TIME_FILTERS.TODAY}>Today</option>
              <option value={TIME_FILTERS.WEEK}>This Week</option>
              <option value={TIME_FILTERS.MONTH}>This Month</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-400">
            {stats.tradeCount} trade{stats.tradeCount !== 1 ? 's' : ''} • Avg. ${stats.avgTradeSize.toFixed(2)}
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {filteredTrades.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-8 text-gray-400"
            >
              No trades found
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredTrades.map((trade, index) => (
                <motion.div
                  key={`${trade.hash}-${index}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-purple-900/10 rounded-xl p-4 hover:bg-purple-900/20 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {trade.type === 'deposit' ? (
                        <div className="bg-green-400/10 p-2 rounded-lg">
                          <ArrowUpIcon className="w-5 h-5 text-green-400" />
                        </div>
                      ) : (
                        <div className="bg-red-400/10 p-2 rounded-lg">
                          <ArrowDownIcon className="w-5 h-5 text-red-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold capitalize flex items-center space-x-2">
                          <span>{trade.type}</span>
                          <span className="text-xs px-2 py-1 bg-purple-500/20 rounded-full">
                            {format(new Date(trade.timestamp), 'MMM d, yyyy HH:mm')}
                          </span>
                        </p>
                        <p className="text-sm text-gray-400">
                          {Number(trade.shares).toFixed(6)} shares
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        ${Number(trade.amount).toFixed(2)}
                      </p>
                      <a
                        href={`https://bscscan.com/tx/${trade.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        View on BSCScan
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export { TradeHistory };
export default TradeHistory;
