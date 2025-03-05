//@ts-nocheck
import React, { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useAccount } from 'wagmi';
import Layout from '../components/Layout';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

// Import WithdrawForm dynamically to prevent hydration issues
const WithdrawForm = dynamic(() => import('../components/WithdrawForm'), {
  ssr: false,
  loading: () => (
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
  ),
});

// Define styles separately to ensure consistency
const gradientTextStyle = "text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400";

const Withdraw: NextPage = () => {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>Withdraw - Agent of Profits</title>
        <meta name="description" content="Withdraw your funds from Agent of Profits" />
      </Head>

      <main className="flex-1">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-4"
            >
              <h1 className={gradientTextStyle}>
                Connect Your Wallet
              </h1>
              <p className="text-gray-400">
                Please connect your wallet to access the withdrawal feature
              </p>
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <WithdrawForm />
          </motion.div>
        )}
      </main>
    </Layout>
  );
};

export default Withdraw;
