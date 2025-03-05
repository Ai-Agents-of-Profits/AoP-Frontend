import { http } from "viem";

export const monadTestnet = {
  id: 10143,
  name: "Monad Testnet",
  iconUrl: "https://miro.medium.com/v2/resize:fit:400/0*aRHYdVg5kllfc7Gn.jpg",
  nativeCurrency: { name: "Monad Testnet", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz/"] },
  },
  blockExplorers: {
    default: { name: "Monad Testnet", url: "https://testnet.monadexplorer.com/" },
  },
};

export const chainArray = [monadTestnet];

export const transportsObject = {
  [monadTestnet.id]: http(),
};
