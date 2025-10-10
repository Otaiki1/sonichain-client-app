# SoniChain Contract Integration Guide

This guide shows you how to integrate your Stacks smart contract with the SoniChain app.

## 📁 Files Created

```
lib/
├── contract-config.ts    # Contract address, network settings
├── contract-utils.ts     # Contract function wrappers
└── stx-utils.ts         # STX balance, transactions, utilities

hooks/
└── useContract.ts       # React hook for contract interactions

contexts/
└── WalletContext.tsx    # Wallet state management (already created)
```

## 🚀 Quick Start

### 1. Update Contract Configuration

Edit `lib/contract-config.ts`:

```typescript
export const CONTRACT_CONFIG = {
  CONTRACT_ADDRESS: 'YOUR_DEPLOYED_CONTRACT_ADDRESS', // e.g., ST1PQHQ...
  CONTRACT_NAME: 'your-contract-name', // e.g., 'sonichain-v1'
  NETWORK: STACKS_TESTNET, // or STACKS_MAINNET
};
```

### 2. Define Your Contract Functions

Edit `lib/contract-utils.ts` and replace the template functions with your actual contract functions:

```typescript
// Example: Your actual contract function
export async function createStory(
  title: string,
  category: string,
  maxBlocks: number,
  bountyAmount: number
) {
  const functionArgs = [
    stringAsciiCV(title),
    stringAsciiCV(category),
    uintCV(maxBlocks),
    uintCV(bountyAmount),
  ];

  return prepareContractCall('create-story', functionArgs);
}
```

### 3. Use Contract in Your Components

Import and use the `useContract` hook:

```typescript
import { useContract } from '@/hooks/useContract';

export default function YourScreen() {
  const {
    isConnected,
    address,
    isProcessing,
    callContract,
    createStoryOnChain,
    sendSTX,
  } = useContract();

  const handleCreateStory = async () => {
    if (!isConnected) {
      Alert.alert('Connect Wallet', 'Please connect your wallet first');
      return;
    }

    // Call your contract function
    const txId = await createStoryOnChain(
      'My Story',
      'Mystery',
      10,
      5 // 5 STX bounty
    );

    if (txId) {
      console.log('Story created! Transaction:', txId);
      // Update UI, navigate, etc.
    }
  };

  return (
    <View>
      <Button
        title="Create Story"
        onPress={handleCreateStory}
        disabled={!isConnected || isProcessing}
        loading={isProcessing}
      />
    </View>
  );
}
```

## 📚 Available Functions

### From `useContract()` hook:

#### State

- `isConnected: boolean` - Wallet connection status
- `address: string | null` - User's Stacks address
- `wallet: Wallet | null` - Full wallet object
- `isProcessing: boolean` - Transaction in progress

#### Generic Functions

- `callContract(functionName, args, onSuccess)` - Call any contract function
- `readContract(functionName, args)` - Read-only contract call
- `sendSTX(recipient, amount, memo?)` - Send STX tokens

#### Template Functions (Update these!)

- `createStoryOnChain(...)` - Create story
- `submitVoiceBlockOnChain(...)` - Submit voice block
- `voteOnChain(...)` - Vote on submission
- `finalizeStoryOnChain(...)` - Finalize story
- `fetchStory(storyId)` - Get story data
- `fetchAllStories()` - Get all stories
- `mintStoryNFTOnChain(...)` - Mint NFT

### From `stx-utils.ts`:

- `getStxBalance(address)` - Get wallet balance
- `getTransactionStatus(txId)` - Check tx status
- `stxToMicroStx(stx)` - Convert STX to microSTX
- `microStxToStx(microStx)` - Convert microSTX to STX
- `formatStxAmount(microStx)` - Format for display
- `getAccountTransactions(address)` - Get tx history
- `getAccountNonce(address)` - Get account nonce

## 🎯 Common Use Cases

### Example 1: Create Story with Bounty

```typescript
const { createStoryOnChain, sendSTX } = useContract();

const handleCreate = async () => {
  // Create story with 5 STX bounty
  const txId = await createStoryOnChain(
    'The Mystery Begins',
    'Mystery',
    10,
    stxToMicroStx(5) // Convert 5 STX to microSTX
  );
};
```

### Example 2: Vote and Reward

```typescript
const { voteOnChain, user, updateUser } = useContract();

const handleVote = async () => {
  const txId = await voteOnChain(storyId, submissionId);

  if (txId) {
    // Update local state
    updateUser({ totalVotes: user.totalVotes + 1 });
  }
};
```

### Example 3: Check Balance Before Action

```typescript
import { getStxBalance, stxToMicroStx } from '@/lib/stx-utils';

const checkAndCreate = async () => {
  const balance = await getStxBalance(address);
  const requiredAmount = stxToMicroStx(5);

  if (balance < requiredAmount) {
    Alert.alert('Insufficient Balance', 'You need at least 5 STX');
    return;
  }

  await createStoryOnChain(...);
};
```

### Example 4: Read Contract Data

```typescript
const { fetchStory } = useContract();

useEffect(() => {
  async function loadStory() {
    const storyData = await fetchStory(1);
    console.log('Story from blockchain:', storyData);
  }
  loadStory();
}, []);
```

## 🔧 Customization Steps

### Step 1: Deploy Your Contract

Deploy your Clarity smart contract to Stacks testnet or mainnet.

### Step 2: Update Configuration

Update `lib/contract-config.ts` with your contract details.

### Step 3: Implement Contract Functions

In `lib/contract-utils.ts`, replace template functions with your actual contract functions matching your Clarity code.

### Step 4: Update Hook

In `hooks/useContract.ts`, update the template functions with your actual implementation.

### Step 5: Integrate in UI

Use `useContract()` in your screens where blockchain interaction is needed.

## 🎨 Integration Points in SoniChain

| Feature                  | Screen           | Function to Use             |
| ------------------------ | ---------------- | --------------------------- |
| Create Story with Bounty | Home (index.tsx) | `createStoryOnChain()`      |
| Submit Voice Block       | Record screen    | `submitVoiceBlockOnChain()` |
| Vote on Block            | Voting screen    | `voteOnChain()`             |
| Finalize & Distribute    | Activity tab     | `finalizeStoryOnChain()`    |
| Mint NFT                 | Activity tab     | `mintStoryNFTOnChain()`     |
| Check Balance            | Profile          | `getStxBalance()`           |

## ⚠️ Important Notes

1. **Network**: Currently set to TESTNET. Switch to MAINNET for production.
2. **Fees**: Default fee is 300 microSTX. Adjust in `contract-config.ts`.
3. **Error Handling**: All functions include error handling and user alerts.
4. **Loading States**: `isProcessing` indicates when a transaction is pending.
5. **Private Keys**: Never log or expose private keys in production.

## 🧪 Testing

```typescript
// In any component
const { isConnected, address, callContract } = useContract();

console.log('Wallet connected:', isConnected);
console.log('Address:', address);

// Test a simple contract call
await callContract('test-function', []);
```

## 🔐 Security

- ✅ Private keys never leave the device
- ✅ Seed phrases stored in AsyncStorage (use expo-secure-store in production)
- ✅ All transactions require user wallet
- ✅ Post-condition mode set to 'allow' (adjust for production)

## 📝 Next Steps

1. Deploy your Clarity smart contract
2. Update `CONTRACT_ADDRESS` and `CONTRACT_NAME`
3. Implement your contract functions in `contract-utils.ts`
4. Test on testnet
5. Integrate into UI components
6. Deploy to production with mainnet config

---

**Need Help?** Check the template functions in `hooks/useContract.ts` for examples!
