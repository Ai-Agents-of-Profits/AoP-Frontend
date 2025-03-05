//@ts-nocheck
import React, { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useAccount } from 'wagmi';
import Layout from '../components/Layout';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

// Import components dynamically to prevent hydration issues
const PortfolioCard = dynamic(() => import('../components/PortfolioCard'), {
  ssr: false,
  loading: () => (
    <div className="bg-black/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-8 shadow-xl">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-purple-500/20 rounded w-1/3"></div>
        <div className="space-y-3">
          <div className="h-4 bg-purple-500/20 rounded"></div>
          <div className="h-4 bg-purple-500/20 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  ),
});

// const TradeHistory = dynamic(() => import('../components/TradeHistory'), {
//   ssr: false,
//   loading: () => (
//     <div className="bg-black/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-8 shadow-xl">
//       <div className="animate-pulse space-y-6">
//         <div className="h-8 bg-purple-500/20 rounded w-1/3"></div>
//         <div className="space-y-4">
//           {[...Array(3)].map((_, i) => (
//             <div key={i} className="h-16 bg-purple-500/20 rounded"></div>
//           ))}
//         </div>
//       </div>
//     </div>
//   ),
// });

// Define styles separately to ensure consistency
const gradientTextStyle = "text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400";

const Dashboard: NextPage = () => {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!isConnected) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <h1 className={gradientTextStyle}>
              Connect Wallet
            </h1>
            <p className="text-gray-400 max-w-md">
              Connect your wallet to view your portfolio and trading history
            </p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Dashboard - Agent of Profits</title>
        <meta name="description" content="View your portfolio and trading history" />
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            
          </motion.div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <div className="flex justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-4xl"
              >
                <PortfolioCard />
              </motion.div>
            </div>
          </div>
          {/* <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8"
          >
            <TradeHistory />
          </motion.div> */}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
