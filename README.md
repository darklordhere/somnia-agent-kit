# Somnia Agent Kit

An AI agent SDK for the Somnia blockchain that enables interaction with Somnia network through natural language prompts
## Features

- 🤖 **AI-Powered Blockchain Interactions**: Execute blockchain operations using natural language prompts
- 🔒 **Built-in Security**: AI firewall protection against malicious prompts and llm jailbreaks
- 💰 **SOMI Operations**: Transfer SOMI tokens and check balances
- 🪙 **ERC-20 Support**: Transfer, burn, and check balances of ERC-20 tokens
- 🌐 **Multiple AI Models**: Support for OpenAI and Anthropic models
- 🛡️ **Security-First**: Pattern matching and LLM-based sanitization to protect sensitive operations
- 🎭 **Customizable Personalities**: Define custom agent personalities through system prompts

## Installation

```bash
npm install somnia-agent-kit
```

## Quick Start

### Basic Setup

```typescript
import { SomniaAgent } from 'somnia-agent-kit';

const agent = new SomniaAgent({
  privateKey: 'your-private-key',
  rpcUrl: 'https://rpc.somnia.network', // Somnia mainnet or testnet RPC
  model: 'gpt-4', // or 'claude-3-sonnet'
  openAiApiKey: 'your-openai-api-key', // Required for OpenAI models
  anthropicApiKey: 'your-anthropic-api-key', // Required for Anthropic models
  personalityPrompt: 'You are a helpful assistant for Somnia blockchain operations...' // Optional: custom agent personality
});
```

### Natural Language Execution

```typescript
// Execute blockchain operations using natural language
const response = await agent.execute(
  "Transfer 0.1 SOMI to 0x742d35Cc6b8C9532E78c12A5C3295c2d6F1A8F3e"
);

console.log(response.output);
```

### Conversation Memory (Sessions)

The agent maintains per-session conversational memory using LangChain RunnableWithMessageHistory. Your prompt template already includes `{chat_history}`, so prior messages in a session are automatically provided to the model and updated after each turn.

Key points:
- Memory is keyed by `sessionId` you pass to `execute`.
- If you don't pass a `sessionId`, the agent uses a default per-instance session ID generated at construction.
- Memory is in-process (not persisted across restarts) and isolated per SomniaAgent instance use external DB for persistance.

Basic usage with the default session:

```ts
// Uses the agent's default session (auto-generated). Subsequent calls share memory.
await agent.execute('My name is xyz. Please remember it.');
const r = await agent.execute('What is my name?');
console.log(r.output); // Likely references "xyz"
```

Per-user sessions (recommended for multi-user apps):

```ts
const sessionId = `user:${userId}`;
await agent.execute('Store my preferred token as SOMI.', { sessionId });
const res = await agent.execute('What is my preferred token?', { sessionId });
console.log(res.output); // Should recall "SOMI"
```

Isolated sessions example:

```ts
await agent.execute('Remember: my color is blue.', { sessionId: 'A' });
const a = await agent.execute('What is my color?', { sessionId: 'A' }); // blue
const b = await agent.execute('What is my color?', { sessionId: 'B' }); // unknown
console.log(a.output, b.output);
```

Resetting memory:
- Start using a new `sessionId`, or
- Create a new SomniaAgent instance.

Persistence options:
- By default, memory uses an in-process Map and `InMemoryChatMessageHistory`.
- To persist across restarts or scale horizontally, replace it with a store like Redis by swapping the message history implementation.

## API Reference

### SomniaAgent Class

#### Constructor

```typescript
new SomniaAgent(config: SomniaAgentConfig)
```

**Parameters:**
- `config.privateKey` (string): Wallet private key for blockchain operations
- `config.rpcUrl` (string): Somnia network RPC URL
- `config.model` (string): AI model to use ('gpt-4', 'gpt-3.5-turbo', 'claude-3-sonnet', etc.)
- `config.openAiApiKey` (string, optional): OpenAI API key (required for OpenAI models)
- `config.anthropicApiKey` (string, optional): Anthropic API key (required for Anthropic models)
- `config.personalityPrompt` (string, optional): Custom system prompt to define the agent's personality and behavior

#### Methods

##### `execute(input: string, options?: { sessionId?: string })`
Execute blockchain operations using natural language commands.

**Parameters:**
- `input` (string): Natural language command
- `options.sessionId` (string, optional): Identifier for a conversation session. When provided, memory is scoped to this ID. When omitted, a default per-agent session is used.

**Returns:**
- An object containing `input`, `chat_history`, and `output`.

## Customizing Agent Personalities

You can customize the agent's personality by providing a custom system prompt during initialization. This allows you to control the agent's tone, style, and behavior to suit your application needs.

Note: The custom personality is merged with the base system prompt, not replaced. The base prompt defines required behaviors and response formats. Your custom prompt is appended as additional style and tone guidance.

```typescript
// Creating an agent with a friendly, enthusiastic personality
const friendlyAgent = new SomniaAgent({
  privateKey: process.env.PRIVATE_KEY!,
  rpcUrl: process.env.SOMNIA_RPC_URL!,
  model: 'gpt-4',
  openAiApiKey: process.env.OPENAI_API_KEY,
  personalityPrompt: `You are a friendly and enthusiastic AI assistant on the Somnia blockchain.
  You LOVE to use exclamation marks and speak with excitement!
  Always use emojis like 🚀, 💰, and 🎉 in your responses!
  
  When a transaction is successful, respond with:
  AMAZING NEWS! 🎉 Your transaction was successful! The hash is: 0x1234...
  
  When a transaction fails, respond with:
  Oh no! 😢 The transaction failed. Let me explain why...`
});

// Creating an agent with a formal, professional personality
const formalAgent = new SomniaAgent({
  privateKey: process.env.PRIVATE_KEY!,
  rpcUrl: process.env.SOMNIA_RPC_URL!,
  model: 'gpt-4',
  openAiApiKey: process.env.OPENAI_API_KEY,
  personalityPrompt: `You are a professional AI assistant specialized in Somnia blockchain operations.
  Always communicate in a formal, business-like manner using proper technical terms.
  
  When a transaction is successful, respond with:
  The transaction has been successfully processed. Transaction hash: 0x1234...
  
  When a transaction fails, respond with:
  The transaction could not be processed. The following error occurred: ...`
});
```

### Best Practices for Custom Personalities

1. **Maintain Core Functionality**: Ensure your custom prompt preserves the agent's ability to execute blockchain operations.
2. **Include Response Formats**: Specify how transaction results should be formatted.
3. **Balance Personality with Clarity**: Make sure the agent's responses remain clear and informative even with the added personality elements.
4. **Test Thoroughly**: Verify that custom personalities don't interfere with the agent's core functionality.


## Security Features

### AI Firewall

The SDK includes built-in security features to protect against malicious inputs and llm jailbreaks:

1. **Pattern Matching**: Detects and blocks prompts that might request private keys or sensitive information
2. **LLM Sanitization**: Uses AI models to analyze and sanitize prompts before execution
3. **Automatic Protection**: All natural language inputs are automatically processed through the firewall

### Best Practices

- Never include private keys in plain text in your code
- Use environment variables for sensitive configuration
- Test operations on testnet before mainnet deployment
- Validate all user inputs before processing

## Environment Setup

Create a `.env` file in your project root:

```env
PRIVATE_KEY=your-wallet-private-key
SOMNIA_RPC_URL=https://rpc.somina.network
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```



## Examples

### Example 1: Basic Token Operations

```typescript
import { SomniaAgent } from 'somnia-agent-kit';
import { config } from 'dotenv';

config(); // Load environment variables

const agent = new SomniaAgent({
  privateKey: process.env.PRIVATE_KEY!,
  rpcUrl: process.env.SOMNIA_RPC_URL!,
  model: 'gpt-4',
  openAiApiKey: process.env.OPENAI_API_KEY
});

async function main() {

  // Transfer tokens using natural language
  const result = await agent.execute(
    "Send 0.01 SOMI to address 0x742d35Cc6b8C9532E78c12A5C3295c2d6F1A8F3e"
  );
  console.log(result.output);
}

main().catch(console.error);
```






## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.
