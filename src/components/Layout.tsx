//@ts-nocheck
import React, { useState, useEffect, FC, ReactNode } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import logoImg from '../assets/images/aoplogo.png';

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      setIsScrolled(latest > 50);
    });
    
    // Clean up subscription when component unmounts
    return () => unsubscribe();
  }, [scrollY]);

  const isActive = (path: string) => router.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/deposit', label: 'Deposit' },
    { path: '/withdraw', label: 'Withdraw' },
    { path: '/agents', label: 'Agents' },
  ];

  const NavLink = ({ path, label }: { path: string; label: string }) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        router.push(path);
        setIsMobileMenuOpen(false);
      }}
      className={`inline-flex items-center px-5 py-2.5 text-sm font-medium cursor-pointer rounded-full transition-all duration-300 ${
        isActive(path)
          ? 'text-white bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/40 shadow-lg shadow-purple-500/10'
          : 'text-gray-300 hover:text-white hover:bg-purple-500/10 hover:shadow-lg hover:shadow-purple-500/5'
      }`}
    >
      {label}
    </motion.div>
  );

  const CustomConnectButton = () => {
    return (
      <div className="transform hover:scale-105 transition-transform">
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            authenticationStatus,
            mounted,
          }) => {
            const ready = mounted && authenticationStatus !== 'loading';
            const connected =
              ready &&
              account &&
              chain &&
              (!authenticationStatus || authenticationStatus === 'authenticated');

            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  style: {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        type="button"
                        className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-full text-white bg-gradient-to-r from-purple-700 to-purple-900 border border-purple-500/40 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300"
                      >
                        Connect Wallet
                      </button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        type="button"
                        className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-full text-white bg-gradient-to-r from-red-500 to-pink-600 border border-red-500/40 shadow-lg shadow-red-500/10 hover:shadow-red-500/20 transition-all duration-300"
                      >
                        Wrong Network
                      </button>
                    );
                  }

                  return (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={openChainModal}
                        type="button"
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full text-white bg-gradient-to-r from-purple-700/70 to-purple-900/70 border border-purple-500/30 shadow-lg shadow-purple-500/5 hover:shadow-purple-500/10 transition-all duration-300"
                      >
                        {chain.hasIcon && (
                          <div
                            style={{
                              background: chain.iconBackground,
                              width: 16,
                              height: 16,
                              borderRadius: 999,
                              overflow: 'hidden',
                              marginRight: 4,
                            }}
                          >
                            {chain.iconUrl && (
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                style={{ width: 16, height: 16 }}
                              />
                            )}
                          </div>
                        )}
                        {chain.name}
                      </button>

                      <button
                        onClick={openAccountModal}
                        type="button"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full text-white bg-gradient-to-r from-purple-700/80 to-purple-900/80 border border-purple-500/40 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300"
                      >
                        <div className="mr-2 h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                        {account.displayName}
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    );
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-black">
      {/* Responsive Box Grid Background */}
      <div
        className="absolute inset-0 z-0 bg-repeat"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='none' stroke='%23ffffff' stroke-opacity='0.05' stroke-width='1'/%3E%3C/svg%3E\")",
          backgroundSize: "40px 40px",
        }}
      ></div>

      <motion.nav 
        initial={{ y: -100 }}
        animate={{ 
          y: 0,
          backgroundColor: isScrolled ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.5)",
          borderColor: isScrolled ? "rgba(147, 51, 234, 0.3)" : "rgba(147, 51, 234, 0.2)",
          backdropFilter: "blur(16px)",
        }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-50 w-full border-b"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/')} 
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="relative w-12 h-12 flex items-center justify-center transform transition-all duration-300 overflow-hidden">
                <Image 
                  src={logoImg} 
                  alt="Agent of Profits Logo"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-display font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 drop-shadow-sm">
                Agent of Profits
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex sm:items-center sm:space-x-3">
              {navItems.map((item) => (
                <NavLink key={item.path} {...item} />
              ))}
              <div className="ml-4">
                <CustomConnectButton />
              </div>
            </div>

            {/* Mobile menu button */}
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="flex sm:hidden"
            >
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2.5 rounded-full text-gray-300 hover:text-white bg-purple-700/20 border border-purple-500/30 hover:bg-purple-600/30 focus:outline-none transition-all duration-300"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isMobileMenuOpen ? 'close' : 'open'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isMobileMenuOpen ? (
                      <XMarkIcon className="block h-6 w-6" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </button>
            </motion.div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="sm:hidden bg-black/90 backdrop-blur-xl border-t border-b border-purple-500/30 shadow-lg shadow-purple-900/10"
            >
              <div className="px-6 py-5 space-y-4">
                <div className="space-y-3 w-full">
                  <div className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">Navigation</div>
                  {navItems.map((item) => (
                    <div key={item.path} className="block w-full">
                      <NavLink key={item.path} {...item} />
                    </div>
                  ))}
                </div>
                
                <div className="pt-3 border-t border-purple-500/20">
                  <div className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">Account</div>
                  <CustomConnectButton />
                </div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-center pt-4 pb-2 space-x-4 text-purple-500/70"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center border border-purple-500/30 bg-purple-500/10 cursor-pointer hover:bg-purple-500/20 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm3.75 14.65c-2.35-1.45-3.15-1.55-3.55-1.55-.15 0-.25.05-.35.1-.2.1-.25.2-.25.3,0,.15.1.35.25.45.1.05.2.1.35.1.2 0 .7-.05 2.7 1.15.1.05.15.1.25.1.1 0 .2-.05.3-.15.1-.15.1-.35 0-.5-.05-.1-.15-.15-.25-.2h.05zm1.5-3.95c.55.3 1.2.45 1.95.45a5.02 5.02 0 0 0 3.15-1.1c.15-.15.2-.35.05-.55-.1-.15-.3-.2-.5-.05a3.84 3.84 0 0 1-2.7.85c-.5 0-1-.1-1.45-.35-.1-.05-.25-.05-.35 0s-.15.15-.15.25.05.15.1.25c.05.1.15.2.25.25h-.05z" />
                    </svg>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center border border-purple-500/30 bg-purple-500/10 cursor-pointer hover:bg-purple-500/20 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zM8.5 17.5h-3v-9h3v9zM7 7.5C6.2 7.5 5.5 6.8 5.5 6S6.2 4.5 7 4.5 8.5 5.2 8.5 6 7.8 7.5 7 7.5zm11 10h-3v-4.7c0-3.7-4-3.4-4 0v4.7h-3v-9h3v1.8c1.4-2.6 7-2.8 7 2.5v4.7z"/>
                    </svg>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center border border-purple-500/30 bg-purple-500/10 cursor-pointer hover:bg-purple-500/20 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98-3.56-.18-6.73-1.89-8.84-4.48-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                    </svg>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <main className="flex-grow relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-black border-t border-purple-500/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column - Logo and Description */}
            <div className="flex flex-col">
              <div className="flex items-center space-x-3 mb-4">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <Image 
                    src={logoImg} 
                    alt="Agent of Profits Logo"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-display font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 drop-shadow-sm">
                  Agent of Profits
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Cutting-edge Ai Agents that walk through the ecosystem to make profits.
              </p>
            </div>

            {/* Middle Column - Quick Links */}
            <div>
              <h3 className="text-white font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {[
                  { label: 'Dashboard', path: '/dashboard' },
                  { label: 'Deposit', path: '/deposit' },
                  { label: 'Withdraw', path: '/withdraw' },
                  { label: 'Documentation', path: '#' },
                ].map((link) => (
                  <li key={link.path}>
                    <motion.div
                      className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer"
                      whileHover={{ x: 5 }}
                      onClick={() => router.push(link.path)}
                    >
                      {link.label}
                    </motion.div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Column - Social and Contact */}
            <div>
              <h3 className="text-white font-bold mb-4">Connect With Us</h3>
              <div className="flex space-x-4 mb-4">
                {[
                  { icon: '🌐', label: 'Website' },
                  { icon: '𝕏', label: 'Twitter' },
                  { icon: '📱', label: 'Telegram' },
                  { icon: '🤖', label: 'Discord' },
                ].map((social) => (
                  <motion.div
                    key={social.label}
                    className="w-10 h-10 rounded-full bg-purple-900/30 border border-purple-500/30 flex items-center justify-center text-white cursor-pointer"
                    whileHover={{ y: -5, backgroundColor: 'rgba(126, 34, 206, 0.4)' }}
                    transition={{ duration: 0.2 }}
                  >
                    {social.icon}
                  </motion.div>
                ))}
              </div>
              <p className="text-gray-400 text-sm">
                Contact: support@agentofprofits.com
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-6 border-t border-purple-500/10 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              {new Date().getFullYear()} Agent of Profits. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <span className="text-gray-500 text-sm hover:text-gray-400 cursor-pointer transition-colors">Privacy Policy</span>
              <span className="text-gray-500 text-sm hover:text-gray-400 cursor-pointer transition-colors">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
