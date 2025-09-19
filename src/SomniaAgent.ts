import { transferSOMI } from './tools/somnia/SOMIOperations.js';
import { transferErc20, burnErc20 } from './tools/somnia/erc20Operations.js';
import { getSOMIBalance } from './tools/somnia/getSOMIBalance.js';
import { getErc20Balance } from './tools/somnia/getErc20Balance.js';
import { deployContract } from './tools/somnia/deployContract.js';
import { initializeClient, setCurrentPrivateKey } from './core/client.js';
import { createAgent } from './agent.js';
import { applyFirewall } from './aifirewall/index.js';
import type { Runnable } from '@langchain/core/runnables';
import type { BaseChatMessageHistory } from '@langchain/core/chat_history';
import type { modelMapping } from './utils/models.js';

export interface SomniaAgentConfig {
  privateKey: string;
  rpcUrl: string;
  model: keyof typeof modelMapping;
  openAiApiKey?: string;
  anthropicApiKey?: string;
  personalityPrompt?: string;
  memory?: {
    getMessageHistory?: (sessionId: string) => BaseChatMessageHistory;
  };
}

export interface TransferSOMIParams {
  toAddress: string;
  amount: string;
}

export interface TransferErc20Params {
  tokenAddress: string;
  toAddress: string;
  amount: string | number;
}

export interface BurnErc20Params {
  tokenAddress: string;
  amount: string | number;
}

export interface GetErc20BalanceParams {
  tokenAddress: string;
  walletAddress?: string;
}

export interface DeployContractParams {
  abi: any[];
  bytecode: string;
  args?: any[];
}

export class SomniaAgent {
  private privateKey: string;
  private rpcUrl: string;
  private agentExecutor: Runnable;
  private model: keyof typeof modelMapping;
  private openAiApiKey?: string;
  private anthropicApiKey?: string;
  private defaultSessionId: string;
  private getMessageHistory?: (sessionId: string) => BaseChatMessageHistory;

  constructor(config: SomniaAgentConfig) {
    this.privateKey = config.privateKey;
    this.rpcUrl = config.rpcUrl;
    this.model = config.model;
    this.openAiApiKey = config.openAiApiKey;
    this.anthropicApiKey = config.anthropicApiKey;
    this.getMessageHistory = config.memory?.getMessageHistory;
    this.defaultSessionId = `somnia-agent-${Math.random().toString(36).slice(2)}-${Date.now()}`;

    if (!this.privateKey) {
      throw new Error('Private key is required.');
    }

    if (!this.rpcUrl) {
      throw new Error('RPC URL is required.');
    }

    // Initialize the client with this agent's configuration
    initializeClient(this.privateKey, this.rpcUrl);

    this.agentExecutor = createAgent(
      this,
      this.model,
      this.openAiApiKey,
      this.anthropicApiKey,
      { 
        getMessageHistory: this.getMessageHistory,
        personalityPrompt: config.personalityPrompt
      },
    );
  }

  getCredentials() {
    return {
      privateKey: this.privateKey,
      openAiApiKey: this.openAiApiKey || '',
      anthropicApiKey: this.anthropicApiKey || '',
    };
  }

  async execute(input: string, options?: { sessionId?: string }) {
    const sanitizedInput = await applyFirewall(input, {
      model: this.model,
      openAiApiKey: this.openAiApiKey,
      anthropicApiKey: this.anthropicApiKey,
    });

    const response = await this.agentExecutor.invoke(
      { input: sanitizedInput },
      { configurable: { sessionId: options?.sessionId ?? this.defaultSessionId } },
    );

    setCurrentPrivateKey(this.privateKey);

    return response;
  }

  async transferSOMI(params: TransferSOMIParams) {
    setCurrentPrivateKey(this.privateKey);
    return await transferSOMI(params);
  }

  async transferErc20(params: TransferErc20Params) {
    setCurrentPrivateKey(this.privateKey);
    return await transferErc20(params);
  }

  async burnErc20(params: BurnErc20Params) {
    setCurrentPrivateKey(this.privateKey);
    return await burnErc20(params);
  }

  async getSOMIBalance(params?: { walletAddress?: string }) {
    setCurrentPrivateKey(this.privateKey);
    return await getSOMIBalance(params || {});
  }

  async getErc20Balance(params: GetErc20BalanceParams) {
    setCurrentPrivateKey(this.privateKey);
    return await getErc20Balance(params);
  }

  async deployContract(params: DeployContractParams) {
    setCurrentPrivateKey(this.privateKey);
    return await deployContract(params);
  }
}


