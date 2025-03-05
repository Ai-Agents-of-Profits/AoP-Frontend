import { Address } from 'viem';

export interface Token {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl: string;
}

export const USDT: Token = {
  address: '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D',
  symbol: 'USDT',
  name: 'Tether USD',
  decimals: 6,
  logoUrl: '/images/tokens/usdt.png',
};

export const MON: Token = {
  address: '0xBbD3321f377742c4b9825f1a9ac67e9EB999F651',
  symbol: 'MON',
  name: 'Monad',
  decimals: 18,
  logoUrl: '/mon-logo.png',
};

export const SUPPORTED_TOKENS = [USDT, MON];

export const TOKEN_MAP: { [address: string]: Token } = SUPPORTED_TOKENS.reduce(
  (acc, token) => ({
    ...acc,
    [token.address.toLowerCase()]: token,
  }),
  {}
);
