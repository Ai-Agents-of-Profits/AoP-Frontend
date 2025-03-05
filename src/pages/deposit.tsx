//@ts-nocheck
import React, { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useAccount } from 'wagmi';
import Layout from '../components/Layout';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const DepositForm = dynamic(() => import('../components/DepositForm'), {
  ssr: false
});

const gradientTextStyle =
  "text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400";

const Deposit: NextPage = () => {
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
        <title>Deposit - Agent of Profits</title>
        <meta name="description" content="Deposit your USDT to start earning yields" />
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
              <h1 className={gradientTextStyle}>Connect Your Wallet</h1>
              <p className="text-gray-400">
                Please connect your wallet to access the deposit feature
              </p>
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DepositForm />
          </motion.div>
        )}
      </main>
    </Layout>
  );
};

export default Deposit;
