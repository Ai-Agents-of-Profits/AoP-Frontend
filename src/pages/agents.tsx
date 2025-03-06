import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { ArrowRightIcon, ArrowPathIcon, BanknotesIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/solid';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import monadSvg from '../assets/images/monadsvg.svg';
import curvanceLogo from '../assets/images/CVE.png';
import wormholeLogo from '../assets/images/w.png';
import layerZeroLogo from '../assets/images/LZ.jpeg';
import binanceLogo from '../assets/images/binance-logo.svg';
import nativeLogo from '../assets/images/aoplogo.png';

// Visual Flow Components
const FlowArrow = ({ direction = "horizontal" }) => (
  <div className={`flex justify-center items-center ${direction === "horizontal" ? "mx-2 my-0" : "my-2 mx-0 rotate-90 md:rotate-0 md:mx-2 md:my-0"}`}>
    <ArrowRightIcon className="h-6 w-6 text-indigo-500" />
  </div>
);

const FlowNode = ({ 
  title, 
  description, 
  icon: Icon, 
  color = "bg-indigo-600",
  borderColor = "border-indigo-700",
  textColor = "text-white"
}) => (
  <motion.div 
    className={`flex flex-col items-center p-4 rounded-lg ${color} ${borderColor} border shadow-lg w-full md:min-w-[160px] max-w-[280px]`}
    whileHover={{ scale: 1.05 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <Icon className={`h-8 w-8 mb-2 ${textColor}`} />
    <h3 className={`font-bold text-center ${textColor}`}>{title}</h3>
    <p className={`text-xs text-center ${textColor} opacity-80`}>{description}</p>
  </motion.div>
);

const ProtocolLogo = ({ name, imgSrc = null }) => (
  <div className="h-12 w-12 flex items-center justify-center">
    {imgSrc ? (
      <Image src={imgSrc} alt={name} width={40} height={40} className="object-contain" />
    ) : (
      <div className="bg-gray-800/50 h-full w-full rounded-full flex items-center justify-center text-white text-xs font-bold">
        {name.substring(0, 2).toUpperCase()}
      </div>
    )}
  </div>
);

export default function AgentsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <Layout>
      <Head>
        <title>AoP - Trading Agents</title>
        <meta name="description" content="Agent of Profits - AI-Powered Trading Agents" />
      </Head>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            <span className="block">AI Trading Agents</span>
            <span className="block text-indigo-500">Powering Your Profits</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Learn how our AI-powered trading agents work to generate profits across different risk profiles.
          </p>
        </motion.div>

        {/* High Risk Agent (AoP2) Flow */}
        <motion.div 
          className="mb-16 bg-gray-900/50 p-6 rounded-2xl backdrop-blur-sm border border-gray-800"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div 
            className="mb-8"
            variants={itemVariants}
          >
            <h2 className="text-3xl font-bold text-white mb-2 flex flex-wrap items-center gap-2">
              <CurrencyDollarIcon className="h-8 w-8 text-red-500" />
              <span>High Risk Agent</span>
              <span className="px-2 py-1 text-xs font-semibold rounded bg-red-900/70 text-red-200">AoP2 Vault</span>
            </h2>
            <p className="text-gray-300 mb-6">
              Our high risk agent manages USDT-only vaults by bridging to centralized exchanges for aggressive trading strategies.
            </p>
            <div className="flex items-center bg-purple-900/30 p-3 rounded-lg border border-purple-700/40 mb-6">
              <span className="mr-2 text-purple-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </span>
              <p className="text-sm text-purple-100">
                All trading decisions are intelligently executed by our advanced LLM AI systems, which analyze market conditions, identify optimal entry/exit points, and manage risk in real-time.
              </p>
            </div>
          </motion.div>

          {/* Mobile View Flow (Column) */}
          <motion.div 
            className="flex flex-col items-center justify-center gap-1 mb-8 md:hidden"
            variants={itemVariants}
          >
            <FlowNode 
              title="AoP2 Vault" 
              description="USDT-only vault on Monad"
              icon={BanknotesIcon}
              color="bg-red-900/80"
              borderColor="border-red-700" 
            />
            <FlowArrow direction="vertical" />
            <FlowNode 
              title="Bridge Protocol" 
              description="Wormhole/LayerZero"
              icon={ArrowsRightLeftIcon}
              color="bg-purple-900/80"
              borderColor="border-purple-700" 
            />
            <FlowArrow direction="vertical" />
            <FlowNode 
              title="CEX Exchange"
              description="Binance Trading"
              icon={ArrowPathIcon}
              color="bg-yellow-900/80"
              borderColor="border-yellow-700" 
            />
            <FlowArrow direction="vertical" />
            <FlowNode 
              title="Bridge Return"
              description="Transfer back to Monad"
              icon={ArrowsRightLeftIcon}
              color="bg-purple-900/80"
              borderColor="border-purple-700" 
            />
            <FlowArrow direction="vertical" />
            <FlowNode 
              title="Profit Distribution"
              description="To AoP2 vault users"
              icon={CurrencyDollarIcon}
              color="bg-green-900/80"
              borderColor="border-green-700" 
            />
          </motion.div>

          {/* Desktop View Flow (Row) */}
          <motion.div 
            className="hidden md:flex md:flex-row items-center justify-between gap-4 mb-8 overflow-x-auto py-4"
            variants={itemVariants}
          >
            <FlowNode 
              title="AoP2 Vault" 
              description="USDT-only vault on Monad"
              icon={BanknotesIcon}
              color="bg-red-900/80"
              borderColor="border-red-700" 
            />
            <FlowArrow direction="horizontal" />
            <FlowNode 
              title="Bridge Protocol" 
              description="Wormhole/LayerZero"
              icon={ArrowsRightLeftIcon}
              color="bg-purple-900/80"
              borderColor="border-purple-700" 
            />
            <FlowArrow direction="horizontal" />
            <FlowNode 
              title="CEX Exchange"
              description="Binance Trading"
              icon={ArrowPathIcon}
              color="bg-yellow-900/80"
              borderColor="border-yellow-700" 
            />
            <FlowArrow direction="horizontal" />
            <FlowNode 
              title="Bridge Return"
              description="Transfer back to Monad"
              icon={ArrowsRightLeftIcon}
              color="bg-purple-900/80"
              borderColor="border-purple-700" 
            />
            <FlowArrow direction="horizontal" />
            <FlowNode 
              title="Profit Distribution"
              description="To AoP2 vault users"
              icon={CurrencyDollarIcon}
              color="bg-green-900/80"
              borderColor="border-green-700" 
            />
          </motion.div>

          <motion.div 
            className="bg-gray-800/50 p-4 rounded-lg"
            variants={itemVariants}
          >
            <h3 className="text-xl font-bold text-white mb-2">Key Parameters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-700/40 rounded-lg">
                <p className="text-gray-300 text-sm font-medium">Risk Level</p>
                <p className="text-white font-bold">High</p>
              </div>
              <div className="p-3 bg-gray-700/40 rounded-lg">
                <p className="text-gray-300 text-sm font-medium">Expected Returns</p>
                <p className="text-white font-bold">20-35% APY</p>
              </div>
              <div className="p-3 bg-gray-700/40 rounded-lg">
                <p className="text-gray-300 text-sm font-medium">Trading Pairs</p>
                <p className="text-white font-bold">Major Crypto/USDT</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="mt-6"
            variants={itemVariants}
          >
            <h3 className="text-xl font-bold text-white mb-2">Trading Protocols</h3>
            <div className="flex flex-wrap gap-4 items-center justify-center sm:justify-start">
              <div className="flex flex-col items-center">
                <ProtocolLogo name="Binance" imgSrc={binanceLogo} />
                <span className="text-xs text-gray-300 mt-1">Binance</span>
              </div>
              <div className="flex flex-col items-center">
                <ProtocolLogo name="Wormhole" imgSrc={wormholeLogo} />
                <span className="text-xs text-gray-300 mt-1">Wormhole</span>
              </div>
              <div className="flex flex-col items-center">
                <ProtocolLogo name="LayerZero" imgSrc={layerZeroLogo} />
                <span className="text-xs text-gray-300 mt-1">LayerZero</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Medium Risk Agent (AoP1) Flow */}
        <motion.div 
          className="mb-12 bg-gray-900/50 p-6 rounded-2xl backdrop-blur-sm border border-gray-800"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div 
            className="mb-8"
            variants={itemVariants}
          >
            <h2 className="text-3xl font-bold text-white mb-2 flex flex-wrap items-center gap-2">
              <CurrencyDollarIcon className="h-8 w-8 text-blue-500" />
              <span>Medium Risk Agent</span>
              <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-900/70 text-blue-200">AoP1 Vault</span>
            </h2>
            <p className="text-gray-300 mb-6">
              Our medium risk agent manages dual-asset vaults (MON+USDT) by leveraging DeFi protocols for stable yields.
            </p>
            <div className="flex items-center bg-blue-900/30 p-3 rounded-lg border border-blue-700/40 mb-6">
              <span className="mr-2 text-blue-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </span>
              <p className="text-sm text-blue-100">
                Yield farming strategies are intelligently optimized by our AI system, which continuously monitors DeFi protocols for the best opportunities, allocates capital efficiently, and adjusts positions to maximize returns while maintaining the medium risk profile.
              </p>
            </div>
          </motion.div>

          {/* Mobile View Flow (Column) */}
          <motion.div 
            className="flex flex-col items-center justify-center gap-1 mb-8 md:hidden"
            variants={itemVariants}
          >
            <FlowNode 
              title="AoP1 Vault" 
              description="MON+USDT vault on Monad"
              icon={BanknotesIcon}
              color="bg-blue-900/80"
              borderColor="border-blue-700" 
            />
            <FlowArrow direction="vertical" />
            <FlowNode 
              title="DeFi Protocol"
              description="Curvance & others"
              icon={ArrowPathIcon}
              color="bg-teal-900/80"
              borderColor="border-teal-700" 
            />
            <FlowArrow direction="vertical" />
            <FlowNode 
              title="Yield Farming"
              description="Liquidity provision"
              icon={ArrowsRightLeftIcon}
              color="bg-emerald-900/80"
              borderColor="border-emerald-700" 
            />
            <FlowArrow direction="vertical" />
            <FlowNode 
              title="Profit Collection"
              description="Return to Monad"
              icon={CurrencyDollarIcon}
              color="bg-cyan-900/80"
              borderColor="border-cyan-700" 
            />
            <FlowArrow direction="vertical" />
            <FlowNode 
              title="Profit Distribution"
              description="To AoP1 vault users"
              icon={CurrencyDollarIcon}
              color="bg-green-900/80"
              borderColor="border-green-700" 
            />
          </motion.div>

          {/* Desktop View Flow (Row) */}
          <motion.div 
            className="hidden md:flex md:flex-row items-center justify-between gap-4 mb-8 overflow-x-auto py-4"
            variants={itemVariants}
          >
            <FlowNode 
              title="AoP1 Vault" 
              description="MON+USDT vault on Monad"
              icon={BanknotesIcon}
              color="bg-blue-900/80"
              borderColor="border-blue-700" 
            />
            <FlowArrow direction="horizontal" />
            <FlowNode 
              title="DeFi Protocol"
              description="Curvance & others"
              icon={ArrowPathIcon}
              color="bg-teal-900/80"
              borderColor="border-teal-700" 
            />
            <FlowArrow direction="horizontal" />
            <FlowNode 
              title="Yield Farming"
              description="Liquidity provision"
              icon={ArrowsRightLeftIcon}
              color="bg-emerald-900/80"
              borderColor="border-emerald-700" 
            />
            <FlowArrow direction="horizontal" />
            <FlowNode 
              title="Profit Collection"
              description="Return to Monad"
              icon={CurrencyDollarIcon}
              color="bg-cyan-900/80"
              borderColor="border-cyan-700" 
            />
            <FlowArrow direction="horizontal" />
            <FlowNode 
              title="Profit Distribution"
              description="To AoP1 vault users"
              icon={CurrencyDollarIcon}
              color="bg-green-900/80"
              borderColor="border-green-700" 
            />
          </motion.div>

          <motion.div 
            className="bg-gray-800/50 p-4 rounded-lg"
            variants={itemVariants}
          >
            <h3 className="text-xl font-bold text-white mb-2">Key Parameters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-700/40 rounded-lg">
                <p className="text-gray-300 text-sm font-medium">Risk Level</p>
                <p className="text-white font-bold">Medium</p>
              </div>
              <div className="p-3 bg-gray-700/40 rounded-lg">
                <p className="text-gray-300 text-sm font-medium">Expected Returns</p>
                <p className="text-white font-bold">10-15% APY</p>
              </div>
              <div className="p-3 bg-gray-700/40 rounded-lg">
                <p className="text-gray-300 text-sm font-medium">Asset Types</p>
                <p className="text-white font-bold">MON, USDT</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="mt-6"
            variants={itemVariants}
          >
            <h3 className="text-xl font-bold text-white mb-2">Interacting Protocols</h3>
            <div className="flex flex-wrap gap-4 items-center justify-center sm:justify-start">
              <div className="flex flex-col items-center">
                <ProtocolLogo name="Curvance" imgSrc={curvanceLogo} />
                <span className="text-xs text-gray-300 mt-1">Curvance</span>
              </div>
              <div className="flex flex-col items-center">
                <ProtocolLogo name="Monad" imgSrc={monadSvg} />
                <span className="text-xs text-gray-300 mt-1">Monad</span>
              </div>
              <div className="flex flex-col items-center">
                <ProtocolLogo name="Native" imgSrc={nativeLogo} />
                <span className="text-xs text-gray-300 mt-1">Native DeFi</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

      
      </div>
    </Layout>
  );
}
