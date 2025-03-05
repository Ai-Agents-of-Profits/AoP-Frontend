import { Address } from 'viem';
import { FACTORY_VAULT_ABI as FactoryVaultAbi } from './abis';

export const AoP1_VAULT_ADDRESS = '0xFfB3E80b53305201EbfF9cE62655c0169421679a' as Address;
export const AoP2_VAULT_ADDRESS = '0xB3a54e623401c473D108048e3B20CB4C9d91Db5d' as Address;

export const FACTORY_VAULT_ADDRESS = '0xC9f627023863CB19c0fca6F5cB9C9B79699Eec45' as Address;

// Re-export the ABI to ensure it's properly formatted
export const FACTORY_VAULT_ABI = FactoryVaultAbi;