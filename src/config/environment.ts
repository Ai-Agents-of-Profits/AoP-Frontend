export const environment = {
  // Contract Addresses
  tradingVaultAddress: process.env.NEXT_PUBLIC_TRADING_VAULT_ADDRESS as `0x${string}`,
  
  // Web3 Configuration
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string,
  networkId: parseInt(process.env.NEXT_PUBLIC_NETWORK_ID || '10143', 10), // Default to Monad Testnet
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL as string || 'https://testnet-rpc.monad.xyz/',
  
  // API Configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL as string,
  websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL as string,
  
  // Feature Flags
  enableTestnet: process.env.NEXT_PUBLIC_ENABLE_TESTNET === 'true',
  enableMockData: process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'true',
  
  // Derived Values
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // Validation
  validate() {
    const requiredEnvVars = [
      'NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID'
    ];
    
    const missingVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar]
    );
    
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}`
      );
    }
  }
};
