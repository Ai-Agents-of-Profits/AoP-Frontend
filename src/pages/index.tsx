//@ts-nocheck
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightIcon, ChartBarIcon, ShieldCheckIcon, CurrencyDollarIcon, ChartPieIcon, UsersIcon, ArrowTrendingUpIcon, ClockIcon, UserGroupIcon, BanknotesIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther, formatUnits } from 'viem';
import { MON, USDT } from '../config/tokens';
import { FACTORY_VAULT_ADDRESS, AoP1_VAULT_ADDRESS, AoP2_VAULT_ADDRESS } from '../config/contracts';
import { TRADING_VAULT_ABI, FACTORY_VAULT_ABI } from '../config/abis';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import { formatNumber, formatCurrency } from '../utils/formatting';
import Image from 'next/image';
import monadSvg from '../assets/images/monadsvg.svg';
// Comment out the imports temporarily to fix build errors
// import CandlestickRain from '../components/CandlestickRain';
// import GridPattern from '../components/GridPattern';

// Adding the background gradient CSS
const bgGradientStyle = `
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  .bg-gradient-radial {
    background: radial-gradient(circle at center, var(--tw-gradient-from) 0%, var(--tw-gradient-to) 100%);
  }
`;

export default function Home() {
  const router = useRouter();
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  

  const { data: aop1VaultStats, isLoading: isAop1StatsLoading } = useReadContract({
    address: FACTORY_VAULT_ADDRESS,
    abi: FACTORY_VAULT_ABI,
    functionName: 'getVaultStatistics',
    args: [AoP1_VAULT_ADDRESS],
    enabled: mounted,
  });

  const { data: aop2VaultStats, isLoading: isAop2StatsLoading } = useReadContract({
    address: FACTORY_VAULT_ADDRESS,
    abi: FACTORY_VAULT_ABI,
    functionName: 'getVaultStatistics',
    args: [AoP2_VAULT_ADDRESS],
    enabled: mounted,
  });

  const aop1Stats = aop1VaultStats ? {
    totalAssets: aop1VaultStats[0] ? formatUnits(aop1VaultStats[0], 6) : '0', // in USDT
    totalShares: aop1VaultStats[2] ? formatUnits(aop1VaultStats[2], 18) : '0',
    monBalance: aop1VaultStats[3] ? formatUnits(aop1VaultStats[3], 18) : '0',
    usdtBalance: aop1VaultStats[4] ? formatUnits(aop1VaultStats[4], 6) : '0',
    userCount: aop1VaultStats[6] ? Number(aop1VaultStats[6]) : 0,
  } : null;

  const aop2Stats = aop2VaultStats ? {
    totalAssets: aop2VaultStats[0] ? formatUnits(aop2VaultStats[0], 6) : '0', // in USDT
    totalShares: aop2VaultStats[2] ? formatUnits(aop2VaultStats[2], 18) : '0',
    monBalance: aop2VaultStats[3] ? formatUnits(aop2VaultStats[3], 18) : '0',
    usdtBalance: aop2VaultStats[4] ? formatUnits(aop2VaultStats[4], 6) : '0',
    userCount: aop2VaultStats[6] ? Number(aop2VaultStats[6]) : 0,
  } : null;

  const platformStats = {
    totalAssets: parseFloat(aop1Stats?.totalAssets || '0') + parseFloat(aop2Stats?.totalAssets || '0'),
    totalUsers: (aop1Stats?.userCount || 0) + (aop2Stats?.userCount || 0),
  };

  const formatUSDT = (value: bigint | undefined) => {
    if (!value) return '$0.00';
    return '$' + Number(formatUnits(value, USDT.decimals)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatNav = (value: bigint | undefined) => {
    if (!value) return '1.000';
    return Number(formatUnits(value, 18)).toLocaleString(undefined, {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  };

  // Format utility for vault statistics
  const formatCryptoValue = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    
    if (num > 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num > 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    } else {
      return num.toFixed(2);
    }
  };

  const formatUsdValue = (value: string) => {
    return `$${formatCryptoValue(value)}`;
  };

  const metrics = [
    {
      title: 'Total Value Locked',
      value: `$${formatCryptoValue(platformStats.totalAssets.toString())}`,
      description: 'Current total value managed by the protocol',
      icon: CurrencyDollarIcon,
      color: 'from-green-600 to-emerald-600',
    },
    {
      title: 'Total Users',
      value: platformStats.totalUsers.toString(),
      description: 'Number of unique users in the protocol',
      icon: UserGroupIcon,
      color: 'from-fuchsia-600 to-pink-600',
    },
  ];

  // Additional vault-specific metrics
  const vaultMetrics = [
    // AoP1 Metrics (Medium Risk Vault)
    {
      title: 'AoP1: Medium Risk',
      value: aop1Stats ? formatUsdValue(aop1Stats.totalAssets) : '$0',
      description: 'Balanced risk-return profile',
      icon: ShieldCheckIcon,
      color: 'from-blue-600 to-indigo-600',
      details: [
        { label: 'USDT Balance', value: aop1Stats ? formatUsdValue(aop1Stats.usdtBalance) : '$0' },
        { label: 'MON Balance', value: aop1Stats ? `${formatCryptoValue(aop1Stats.monBalance)} MON` : '0 MON' },
        { label: 'Total Shares', value: aop1Stats ? formatCryptoValue(aop1Stats.totalShares) : '0' },
        { label: 'Users', value: aop1Stats ? aop1Stats.userCount.toString() : '0' },
      ]
    },
    // AoP2 Metrics (High Risk Vault)
    {
      title: 'AoP2: High Risk',
      value: aop2Stats ? formatUsdValue(aop2Stats.totalAssets) : '$0',
      description: 'Higher risk with potential for greater returns',
      icon: ChartBarIcon,
      color: 'from-purple-600 to-violet-600',
      details: [
        { label: 'USDT Balance', value: aop2Stats ? formatUsdValue(aop2Stats.usdtBalance) : '$0' },
        { label: 'MON Balance', value: aop2Stats ? `${formatCryptoValue(aop2Stats.monBalance)} MON` : '0 MON' },
        { label: 'Total Shares', value: aop2Stats ? formatCryptoValue(aop2Stats.totalShares) : '0' },
        { label: 'Users', value: aop2Stats ? aop2Stats.userCount.toString() : '0' },
      ]
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <Layout>
      <Head>
        <title>Agent of Profits - AI-Powered Web3 Trading</title>
        <meta name="description" content="Experience the future of Web3 automated trading with our AI-powered Agents. Maximize your returns while you sleep." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <style>{bgGradientStyle}</style>
      </Head>

      <div className="relative overflow-hidden">
        {/* Hero Section */}
        <div className="relative min-h-[100vh] w-full flex flex-col items-center justify-center overflow-hidden">
          {/* Background Layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/5 to-black" />
          
          {/* Animated Glow Orbs - Reduced for mobile */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(4)].map((_, i) => (
              <motion.div 
                key={`glow-orb-${i}`}
                className="absolute rounded-full blur-3xl opacity-20"
                initial={{ 
                  x: `${Math.random() * 100}vw`, 
                  y: `${Math.random() * 100}vh`,
                  scale: 0.5 + Math.random() * 1.5,
                  opacity: 0.1 + Math.random() * 0.15
                }}
                animate={{ 
                  x: [`${Math.random() * 100}vw`, `${Math.random() * 100}vw`, `${Math.random() * 100}vw`], 
                  y: [`${Math.random() * 100}vh`, `${Math.random() * 100}vh`, `${Math.random() * 100}vh`],
                  opacity: [0.1 + Math.random() * 0.15, 0.2 + Math.random() * 0.15, 0.1 + Math.random() * 0.15]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 15 + Math.random() * 20, 
                  ease: "easeInOut" 
                }}
                style={{
                  width: `${100 + i * 50}px`,
                  height: `${100 + i * 50}px`,
                  background: i % 2 === 0 
                    ? 'radial-gradient(circle, rgba(168, 85, 247, 0.6) 0%, rgba(168, 85, 247, 0) 70%)' 
                    : 'radial-gradient(circle, rgba(236, 72, 153, 0.6) 0%, rgba(236, 72, 153, 0) 70%)'
                }}
              />
            ))}
          </div>
          
          {/* Animated Grid Pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          
          {/* Candlestick Rain - Enhanced with motion */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => {
              const mobilePosition = i < 7 ? 
                `${i * 14}%` : 
                `${i * 7}%`;  
                
              return (
                <motion.div
                  key={`candlestick-column-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  transition={{ duration: 2, delay: i * 0.1 }}
                  className={`absolute candlestick-column ${i > 8 ? 'hidden md:block' : i > 6 ? 'hidden sm:block' : 'block'}`}
                  style={{
                    '--left-position': `${i * 7}%`,
                    left: mobilePosition,
                    top: '-100px',
                    height: '4000px',
                    animation: `candlestick-fall ${20 + i % 5 * 2.5}s linear infinite`,
                    animationDelay: `-${i % 7 * 1.5}s`,
                  }}
                >
                  {[...Array(20)].map((_, j) => (
                    <div
                      key={`candlestick-${i}-${j}`}
                      className={`candlestick-${1 + (j % 4)}`}
                      style={{
                        top: `${j * 200}px`,
                        opacity: 0.6 - (j * 0.01),
                      }}
                    />
                  ))}
                </motion.div>
              );
            })}
          </div>
          
          {/* 3D Crypto Symbols with enhanced animation - Reduced for mobile */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[
              { symbol: "₿", position: { top: "35%", left: "30%" }, animation: "animate-float-1", size: "text-4xl md:text-7xl" },
              { symbol: "Ξ", position: { top: "55%", left: "50%" }, animation: "animate-float-2", size: "text-4xl md:text-7xl" },
              { symbol: "◈", position: { top: "75%", left: "70%" }, animation: "animate-float-3", size: "text-4xl md:text-7xl" },
              { symbol: "∞", position: { top: "15%", left: "15%" }, animation: "animate-float-4", size: "text-3xl md:text-6xl", className: "hidden sm:block" },
              { symbol: "⬡", position: { top: "85%", left: "25%" }, animation: "animate-float-5", size: "text-3xl md:text-6xl", className: "hidden sm:block" },
              { type: "image", src: monadSvg, position: { top: "25%", left: "75%" }, animation: "animate-float-3", size: "w-10 h-10 md:w-16 md:h-16", className: "" },
            ].map((item, i) => (
              <motion.div
                key={`crypto-symbol-${i}`}
                className={`absolute ${item.size} font-bold ${item.animation} ${item.className || ''}`}
                style={{
                  top: item.position.top,
                  left: item.position.left,
                  textShadow: item.type !== "image" ? "0 0 15px rgba(168, 85, 247, 0.5)" : "none"
                }}
                initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
                animate={{ 
                  opacity: item.type === "image" ? [0.7, 1, 0.7] : [0.05, 0.2, 0.05],
                  scale: item.type === "image" ? [1, 1.1, 1] : [1, 1.2, 1],
                  rotate: item.type === "image" ? [-2, 2, -2] : [-5, 5, -5]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: item.type === "image" ? 8 : 12 + i, 
                  ease: "easeInOut" 
                }}
              >
                {item.type === "image" ? (
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-purple-600/30 blur-lg transform scale-125" />
                    <Image
                      src={item.src}
                      alt="Monad Logo"
                      width={64}
                      height={64}
                      className={`${item.size} object-contain relative z-10 filter drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]`}
                    />
                  </div>
                ) : (
                  item.symbol
                )}
              </motion.div>
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 container mx-auto px-4 sm:px-6 py-8 md:py-16 flex flex-col items-center justify-center">
            {/* Beta Badge with Pulse Effect */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative mb-6"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                className="absolute inset-0 rounded-full bg-purple-500/20 blur-md"
              />
              <div className="relative inline-flex items-center px-5 py-2.5 rounded-full border border-purple-500/50 bg-purple-500/10 backdrop-blur-sm text-purple-300 text-sm shadow-lg shadow-purple-500/10">
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 5 }}
                  className="mr-2 text-lg"
                >
                  ⚡
                </motion.span>
                Beta Access Available Soon
              </div>
            </motion.div>

            {/* Main Title with Enhanced Animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="mb-5 text-center px-2"
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold relative text-white leading-tight"
              >
                <motion.span 
                  className="inline-block text-gradient mb-1 sm:mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  Agent of Profits
                </motion.span>
                <br />
                <motion.span 
                  className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  AI-Powered Agents
                </motion.span>
                
                {/* Decorative Elements - Hidden on very small screens */}
                <motion.div 
                  className="absolute -top-6 -left-6 sm:-top-8 sm:-left-10 md:-left-16 text-purple-500/20 text-3xl sm:text-4xl md:text-5xl hidden sm:block"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1, rotate: [0, 10, 0] }}
                  transition={{ duration: 0.5, delay: 0.8, repeat: Infinity, repeatDelay: 5 }}
                >
                  {'{'}
                </motion.div>
                <motion.div 
                  className="absolute -bottom-6 -right-6 sm:-bottom-8 sm:-right-10 md:-right-16 text-purple-500/20 text-3xl sm:text-4xl md:text-5xl hidden sm:block"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1, rotate: [0, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.8, repeat: Infinity, repeatDelay: 5 }}
                >
                  {'}'}
                </motion.div>
              </motion.h1>
            </motion.div>

            {/* Animated Separator */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "60px", opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent mb-6"
            />

            {/* Subtitle with Text Reveal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mb-8 sm:mb-12 max-w-3xl mx-auto text-center px-2"
            >
              <p className="font-display text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 leading-relaxed">
                Experience the future of Web3 automated trading with our
                <motion.span
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                  className="inline-block ml-2 text-white"
                >
                  AI-powered Agents.
                </motion.span>
              </p>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="text-gradient font-semibold text-lg sm:text-xl md:text-2xl lg:text-3xl mt-3 sm:mt-4"
              >
                Maximize your returns while you sleep.
              </motion.p>
            </motion.div>

            {/* CTA Buttons with Enhanced Effects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full px-6 sm:px-0 sm:max-w-md mx-auto"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(168, 85, 247, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/deposit')}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 relative overflow-hidden group flex items-center justify-center"
              >
                <motion.span 
                  className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-white/20 to-purple-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "loop", repeatDelay: 1 }}
                />
                <span>Deposit Now</span>
                <BanknotesIcon className="ml-2 h-5 w-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(168, 85, 247, 0.15)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/agents')}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl border border-purple-500/30 text-purple-300 hover:text-purple-200 backdrop-blur-sm transition-all duration-300 relative overflow-hidden text-base sm:text-lg flex items-center justify-center"
              >
                <span>Learn More</span>
                <motion.div
                  className="ml-2"
                  animate={{ y: [0, -3, 0], x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                >
                  <ArrowUpRightIcon className="h-5 w-5" />
                </motion.div>
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Metrics Section */}
        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1 }
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="w-full py-24 relative bg-black overflow-hidden"
        >
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 via-black to-black" />
          <div className="absolute inset-0 crypto-grid opacity-30 bg-blend-overlay scale-[2] md:scale-100" />
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3a1463_1px,transparent_1px)] bg-[length:24px_24px]" />
          
          {/* Candlestick Rain Background - Metrics Section */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={`metrics-candlestick-column-${i}`}
                className={`absolute candlestick-column ${i > 5 ? 'hidden md:block' : i > 6 ? 'hidden sm:block' : 'block'}`}
                style={{
                  '--left-position': `${i * 13}%`,
                  left: `${i * 13}%`,
                  top: '-100px',
                  height: '2000px',
                  opacity: 0.25,
                  animation: `candlestick-fall ${25 + i % 4 * 2.5}s linear infinite`,
                  animationDelay: `-${i % 5 * 1.2}s`,
                }}
              >
                {[...Array(10)].map((_, j) => (
                  <div
                    key={`metrics-candlestick-${i}-${j}`}
                    className={`candlestick-${1 + ((i+j) % 4)}`}
                    style={{
                      top: `${j * 200}px`,
                      opacity: 0.5 - (j * 0.01),
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="relative py-8">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
              
              {/* <CandlestickRain count={20} /> */}
              {/* <GridPattern /> */}
            </div>
            
            {/* Platform Metrics Section */}
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-center font-display text-gradient">
              Platform Metrics
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto mb-3 rounded-full"></div>
            <p className="text-slate-300 text-center mb-10 max-w-2xl mx-auto text-lg sm:px-6">
              Real-time statistics about the Agent of Profits ecosystem
            </p>
            
            {/* Platform Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4 sm:px-8 relative z-10 max-w-2xl mx-auto">
              {metrics.map((metric, index) => (
                <motion.div
                  key={metric.title}
                  variants={{
                    hidden: { opacity: 0, y: 30, scale: 0.95 },
                    visible: { opacity: 1, y: 0, scale: 1 }
                  }}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: 0.2 * index }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="relative group"
                >
                  {/* Card Inner Glow */}
                  <div 
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                    style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`, '--tw-gradient-from': metric.color.split(' ')[0].replace('from-', ''), '--tw-gradient-to': metric.color.split(' ')[1].replace('to-', '') }}
                  />
                  
                  {/* Card Content */}
                  <div className="relative rounded-2xl backdrop-blur-sm p-8 h-full border-2 border-grey group-hover:border-purple-500/30 transition-all duration-300 bg-black overflow-hidden">
                    {/* Metric Icon */}
                    <div className="flex items-center justify-between mb-6">
                      <div className={`p-3.5 rounded-xl bg-gradient-to-r ${metric.color}`}>
                        <metric.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="opacity-30 group-hover:opacity-60 transition-opacity">
                        <svg className="w-24 h-24 absolute top-2 right-2 text-white/5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M0 50C0 22.3858 22.3858 0 50 0C77.6142 0 100 22.3858 100 50C100 77.6142 77.6142 100 50 100C22.3858 100 0 77.6142 0 50Z" fill="currentColor"/>
                        </svg>
                      </div>
                    </div>
                    
                    {/* Metric Value */}
                    <div className="relative">
                      <motion.p 
                        className="text-4xl md:text-5xl font-bold text-gradient mb-2"
                        initial={{ opacity: 0.8 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                      >
                        {metric.value}
                      </motion.p>
                      <h3 className="text-xl font-bold text-white mb-1">{metric.title}</h3>
                      <p className="text-slate-400 text-sm">{metric.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Divider */}
            <div className="relative py-10 my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700/30"></div>
              </div>
              <div className="relative flex justify-center">
                <div className="px-4 bg-black">
                  <motion.div 
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center"
                  >
                    <ChartBarIcon className="w-5 h-5 text-white" />
                  </motion.div>
                </div>
              </div>
            </div>
            
            {/* Vault Metrics Section */}
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-center font-display text-gradient">
              Vault Statistics
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto mb-3 rounded-full"></div>
            <p className="text-slate-300 text-center mb-10 max-w-2xl mx-auto text-lg sm:px-6">
              Detailed statistics about our dual-vault system with different risk strategies
            </p>
            
            {/* Vault Statistics Grid - Improved mobile responsiveness */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 sm:px-8 lg:px-12 relative z-10 max-w-7xl mx-auto">
              {vaultMetrics.map((vault, index) => (
                <motion.div
                  key={vault.title}
                  variants={{
                    hidden: { opacity: 0, y: 30, scale: 0.95 },
                    visible: { opacity: 1, y: 0, scale: 1 }
                  }}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: 0.2 * index }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="relative group"
                >
                  {/* Card Inner Glow */}
                  <div 
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                    style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`, '--tw-gradient-from': vault.color.split(' ')[0].replace('from-', ''), '--tw-gradient-to': vault.color.split(' ')[1].replace('to-', '') }}
                  />
                  
                  {/* Card Content */}
                  <div className="relative rounded-2xl backdrop-blur-sm p-8 h-full border-2 border-grey group-hover:border-purple-500/30 transition-all duration-300 bg-black overflow-hidden">
                    {/* Vault Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className={`p-3.5 rounded-xl bg-gradient-to-r ${vault.color}`}>
                        <vault.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="opacity-30 group-hover:opacity-60 transition-opacity">
                        <svg className="w-24 h-24 absolute top-2 right-2 text-white/5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M0 50C0 22.3858 22.3858 0 50 0C77.6142 0 100 22.3858 100 50C100 77.6142 77.6142 100 50 100C22.3858 100 0 77.6142 0 50Z" fill="currentColor"/>
                        </svg>
                      </div>
                    </div>
                    
                    {/* Main Metric */}
                    <div className="relative mb-6">
                      <motion.p 
                        className="text-4xl md:text-5xl font-bold text-gradient mb-2"
                        initial={{ opacity: 0.8 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                      >
                        {vault.value}
                      </motion.p>
                      <h3 className="text-xl font-bold text-white mb-1">{vault.title}</h3>
                      <p className="text-slate-400 text-sm">{vault.description}</p>
                    </div>
                    
                    {/* Detailed Stats with Hover Effects */}
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                      {vault.details.map((detail, i) => (
                        <motion.div 
                          key={`${vault.title}-detail-${i}`} 
                          className="bg-black rounded-xl p-4 border-2 border-grey hover:border-purple-500/30 transition-all duration-300"
                          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                        >
                          <p className="text-sm text-slate-400 mb-1">{detail.label}</p>
                          <p className="text-xl font-semibold text-white">{detail.value}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="w-full py-24 bg-black relative"
        >
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/10 to-black" />
          <div className="absolute inset-0 circuit-pattern opacity-20" />
          <div className="absolute inset-0 neural-glow opacity-30" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 font-display text-gradient">
                Protocol Features
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Our platform combines cutting-edge technology with proven trading strategies
                to deliver exceptional results.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Smart Trading Algorithm',
                  description: 'Our AI-powered system analyzes market trends and executes optimal trades.',
                  icon: ChartBarIcon,
                  color: 'from-purple-600 to-blue-600',
                },
                {
                  title: 'Secure Asset Management',
                  description: 'Your assets are protected by industry-leading security measures.',
                  icon: ShieldCheckIcon,
                  color: 'from-violet-600 to-purple-600',
                },
                {
                  title: 'Profitable Returns',
                  description: 'Maximize your earnings with our proven trading strategies.',
                  icon: CurrencyDollarIcon,
                  color: 'from-fuchsia-600 to-pink-600',
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { delay: index * 0.2, duration: 0.5 }
                    }
                  }}
                  className="relative group"
                >
                  <div 
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                    style={{ backgroundImage: `linear-gradient(to right, var(--${feature.color}))` }}
                  />
                  <div className="relative p-8 rounded-2xl bg-purple-950/10 backdrop-blur-sm border border-purple-500/20 hover:border-purple-500/40 transition-colors h-full">
                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${feature.color} mb-5`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 font-display text-gray-200">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="w-full py-24 bg-black relative"
        >
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/10 to-black" />
          <div className="absolute inset-0 crypto-grid opacity-20" />
          
          {/* Candlestick Rain Background - CTA Section */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(4)].map((_, i) => (
              <div
                key={`cta-candlestick-column-${i}`}
                className="absolute candlestick-column"
                style={{
                  left: `${20 + (i * (i === 0 ? 15 : i === 1 ? 25 : i === 2 ? 30 : 20))}%`,
                  top: '-100px',
                  height: '1500px',
                  opacity: 0.2,
                  animation: `candlestick-fall ${22 + i % 3 * 3}s linear infinite`,
                  animationDelay: `-${i % 4 * 2}s`,
                }}
              >
                {[...Array(8)].map((_, j) => (
                  <div
                    key={`cta-candlestick-${i}-${j}`}
                    className={`candlestick-${1 + ((i+j) % 4)}`}
                    style={{
                      top: `${j * 200}px`,
                      opacity: 0.4 - (j * 0.01),
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div variants={itemVariants} className="max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 font-display text-gradient">
                Ready to Start?
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Join thousands of traders who are already benefiting from our AI-powered
                trading platform.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/dashboard')}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
              >
                Start Trading Now
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
