//@ts-nocheck
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultWallets, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { createConfig, WagmiProvider } from 'wagmi';
// import { bsc } from 'wagmi/chains';
import type { AppProps } from 'next/app';
import { Space_Grotesk, Outfit } from 'next/font/google';
import '../styles/globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { monadTestnet, transportsObject } from '../config/chains';

// Space Grotesk - a geometric, technical display font that conveys innovation and precision
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
});

// Outfit - a modern, versatile sans-serif for excellent readability and premium feel
const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
  weight: ['400', '500', '600', '700'],
});

const { wallets } = getDefaultWallets();

// Custom RainbowKit theme
const customDarkTheme = darkTheme({
  accentColor: '#8B5CF6', // purple-600
  accentColorForeground: 'white',
  borderRadius: 'large',
  fontStack: 'system',
  overlayBlur: 'small',
  colors: {
    modalBackground: '#121212',
    modalBorder: 'rgba(139, 92, 246, 0.3)', // purple-600 with opacity
    profileActionButtonBorder: 'rgba(139, 92, 246, 0.3)',
    profileActionButtonBorderMobile: 'rgba(139, 92, 246, 0.3)',
    modalText: '#ffffff',
    modalTextSecondary: '#9ca3af', // gray-400
    modalTextTertiary: '#6b7280', // gray-500
    actionButtonBorder: 'rgba(139, 92, 246, 0.3)',
    actionButtonBorderMobile: 'rgba(139, 92, 246, 0.3)',
    menuItemBackground: 'rgba(31, 41, 55, 0.5)', // gray-800 with opacity
    connectButtonBackground: '#1f2937', // gray-800
    connectButtonBackgroundError: '#7f1d1d', // red-900
    connectButtonInnerBackground: 'linear-gradient(to right, #8B5CF6, #D946EF)',
    connectButtonText: '#ffffff',
    connectButtonTextError: '#ffffff',
  },
});

const config = createConfig({
  chains: [monadTestnet],
  syncConnectedChain: true,
  transports: transportsObject,
});

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={[monadTestnet]} wallets={wallets} theme={customDarkTheme} modalSize="compact">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className={`${spaceGrotesk.variable} ${outfit.variable} font-sans min-h-screen bg-black dark:bg-black text-gray-200 dark:text-gray-200 transition-colors duration-200`}>
              <Component {...pageProps} />
            </div>
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
