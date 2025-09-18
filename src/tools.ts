import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// Import functions
import { transferSOMI } from './tools/somnia/SOMIOperations.js';
import { transferErc20, burnErc20 } from './tools/somnia/erc20Operations.js';
import { getSOMIBalance } from './tools/somnia/getSOMIBalance.js';
import { getErc20Balance } from './tools/somnia/getErc20Balance.js';
import { deployContract } from './tools/somnia/deployContract.js';
import { setCurrentPrivateKey } from './core/client.js';

// Types
type SomniaAgentInterface = {
  getCredentials: () => { privateKey: string };
};

/**
 * Wraps a function to inject the private key from the agent
 * @param fn - The function to wrap
 * @param agent - The SomniaAgent instance containing credentials
 */
const withPrivateKey = <T>(
  fn: (params: T) => Promise<any>,
  agent: SomniaAgentInterface,
) => {
  return (params: T) => {
    // Set the private key in the client before calling the function
    const credentials = agent.getCredentials();
    setCurrentPrivateKey(credentials.privateKey);
    return fn(params);
  };
};

// Schema definitions
const transferSOMISchema = z.object({
  toAddress: z.string().describe('The wallet address to transfer SOMI to'),
  amount: z.string().describe('The amount of SOMI to transfer'),
});

const transferErc20Schema = z.object({
  tokenAddress: z.string().describe('The ERC20 token contract address'),
  toAddress: z.string().describe('The wallet address to transfer tokens to'),
  amount: z.string().describe('The amount of tokens to transfer'),
});

const burnErc20Schema = z.object({
  tokenAddress: z.string().describe('The ERC20 token contract address'),
  amount: z.string().describe('The amount of tokens to burn'),
});

const getSOMIBalanceSchema = z.object({
  walletAddress: z.string().nullable().optional().describe('The wallet address to check SOMI balance (optional, uses agent wallet if not provided)'),
});

const getErc20BalanceSchema = z.object({
  tokenAddress: z.string().describe('The ERC20 token contract address'),
  walletAddress: z.string().nullable().optional().describe('The wallet address to check balance (optional, uses agent wallet if not provided)'),
});

const deployContractSchema = z.object({
  abi: z.array(z.record(z.any())).describe('The contract ABI as an array of objects'),
  bytecode: z.string().describe('The contract bytecode'),
  args: z.array(z.union([z.string(), z.number(), z.boolean()])).nullable().optional().describe('Constructor arguments (optional)'),
});

/**
 * Creates and returns all tools with injected agent credentials
 */
export const createTools = (agent: SomniaAgentInterface) => [
  tool(withPrivateKey(transferSOMI, agent), {
    name: 'transfer_somi',
    description: 'Transfer SOMI (native token) to another wallet',
    schema: transferSOMISchema,
  }),

  tool(withPrivateKey(transferErc20, agent), {
    name: 'transfer_erc20',
    description: 'Transfer ERC20 tokens to another wallet',
    schema: transferErc20Schema,
  }),

  tool(withPrivateKey(burnErc20, agent), {
    name: 'burn_erc20',
    description: 'Burn ERC20 tokens (send to burn address)',
    schema: burnErc20Schema,
  }),

  tool(withPrivateKey(getSOMIBalance, agent), {
    name: 'get_somi_balance',
    description: 'Get SOMI balance of a wallet',
    schema: getSOMIBalanceSchema,
  }),

  tool(withPrivateKey(getErc20Balance, agent), {
    name: 'get_erc20_balance',
    description: 'Get ERC20 token balance of a wallet',
    schema: getErc20BalanceSchema,
  }),

  tool(withPrivateKey(deployContract, agent), {
    name: 'deploy_contract',
    description: 'Deploy a smart contract to Somnia network',
    schema: deployContractSchema,
  }),
];
