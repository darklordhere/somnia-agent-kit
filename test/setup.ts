import { SomniaAgent, type SomniaAgentConfig } from '../src/SomniaAgent.js';

export type SomniaAgentType = SomniaAgent;


export const createTestAgent = (config?: Partial<SomniaAgentConfig> & { personalityPrompt?: string }): SomniaAgent => {
  if (!config?.privateKey) {
    throw new Error('privateKey is required in config');
  }

  const defaultConfig: SomniaAgentConfig = {
    privateKey: config.privateKey,
    rpcUrl: config?.rpcUrl || 'https://dream-rpc.somnia.network',
    model: config?.model || 'gpt-4o-mini',
    openAiApiKey: config?.openAiApiKey,
    anthropicApiKey: config?.anthropicApiKey,
    personalityPrompt: config?.personalityPrompt,
  };

  return new SomniaAgent(defaultConfig);
};


