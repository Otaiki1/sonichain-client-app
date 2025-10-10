# 🔗 SoniChain Blockchain Integration Setup

## ✅ What's Been Implemented

Your SoniChain app now has a **complete Stacks blockchain integration layer** ready for your smart contract implementation.

### 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         UI Components                   │
│  (Activity, Home, Profile, etc.)        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      useContract() Hook                 │
│  Contract calls, transaction signing    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Contract Utils Layer               │
│  Function wrappers, Clarity helpers     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      WalletContext Provider             │
│  Wallet state, mnemonic, private keys   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Stacks SDK (@stacks/*)             │
│  Transactions, broadcasting, network    │
└─────────────────────────────────────────┘
```

## 📦 What's Ready

### ✅ Wallet Management

- **WalletProvider**: App-wide wallet context
- **Seed phrase generation**: 24-word mnemonic
- **Wallet restoration**: Login with existing seed phrase
- **Secure storage**: AsyncStorage (upgrade to expo-secure-store for production)
- **Auto-load**: Wallet restores on app startup

### ✅ Onboarding Flow

- Two paths: Create New Account OR Login
- Real Stacks wallet generation
- Mnemonic validation
- Loading states with progress messages
- Address preview before completion

### ✅ Contract Integration Base

- `useContract()` hook for all screens
- Generic `callContract()` for any function
- Read-only calls for fetching data
- STX transfer functionality
- Template functions for common operations

### ✅ Utilities

- Balance checking
- Transaction status tracking
- STX ↔ microSTX conversion
- Account transaction history
- Nonce management

## 🎯 What You Need to Do

### Step 1: Deploy Your Smart Contract

Write and deploy your Clarity smart contract with functions like:

```clarity
;; Example functions you might have
(define-public (create-story (title (string-ascii 100))
                            (category (string-ascii 50))
                            (max-blocks uint)
                            (bounty uint))
  ;; Your implementation
)

(define-public (submit-voice-block (story-id uint)
                                   (audio-uri (string-ascii 200))
                                   (duration uint))
  ;; Your implementation
)

(define-public (vote (story-id uint) (submission-id uint))
  ;; Your implementation
)

(define-public (finalize-story (story-id uint))
  ;; Your implementation
)

(define-read-only (get-story (story-id uint))
  ;; Your implementation
)
```

### Step 2: Update Configuration

**File: `lib/contract-config.ts`**

```typescript
export const CONTRACT_CONFIG = {
  CONTRACT_ADDRESS: 'ST1234...YOUR_ADDRESS', // ← Your deployed contract
  CONTRACT_NAME: 'sonichain-story', // ← Your contract name
  NETWORK: STACKS_TESTNET, // ← Testnet or Mainnet
};
```

### Step 3: Implement Contract Functions

**File: `lib/contract-utils.ts`**

Replace the template functions with your actual implementations:

```typescript
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

// Repeat for all your contract functions...
```

### Step 4: Update useContract Hook

**File: `hooks/useContract.ts`**

Update the template functions to match your contract signatures.

### Step 5: Integrate in UI

#### Example: Activity Screen (Finalize Story)

```typescript
// In app/(tabs)/activity.tsx
import { useContract } from '@/hooks/useContract';

const { finalizeStoryOnChain, isProcessing } = useContract();

const handleFinalize = async (storyId: string) => {
  const txId = await finalizeStoryOnChain(parseInt(storyId));

  if (txId) {
    // Update local state
    updateStoryChain(storyId, { status: 'finalized' });
  }
};
```

#### Example: Home Screen (Create Story)

```typescript
// In app/(tabs)/index.tsx
import { useContract } from '@/hooks/useContract';
import { stxToMicroStx } from '@/lib/stx-utils';

const { createStoryOnChain } = useContract();

const handleSubmitNewStory = async () => {
  // Call blockchain
  const txId = await createStoryOnChain(
    newStoryTitle,
    selectedCategory,
    parseInt(maxBlocks),
    bountyStx ? stxToMicroStx(parseFloat(bountyStx)) : 0
  );

  if (txId) {
    // Add to local state with blockchain ID
    addStoryChain({ id: txId, ...storyData });
  }
};
```

## 🔐 Wallet Features Available

### In Profile Screen

- ✅ View wallet address
- ✅ Check STX balance (real-time)
- ✅ Export seed phrase (secure modal)
- ✅ Export private key
- ✅ Copy to clipboard

### Throughout App

Access wallet anywhere with `useWallet()`:

```typescript
const { address, wallet, mnemonic, getPrivateKey } = useWallet();
```

Access contract functions anywhere with `useContract()`:

```typescript
const { isConnected, callContract, readContract, sendSTX } = useContract();
```

## 🧪 Testing Your Integration

### 1. Test Wallet Creation

- Reset data in profile
- Go through onboarding
- Click "Create New Account"
- Verify wallet generates successfully

### 2. Test Wallet Restoration

- Export your seed phrase
- Reset data
- Click "Login with Seed Phrase"
- Paste seed phrase
- Verify same address loads

### 3. Test Contract Calls

```typescript
// Add to any screen temporarily
const { readContract } = useContract();

useEffect(() => {
  readContract('test-function').then((result) => {
    console.log('Contract response:', result);
  });
}, []);
```

### 4. Monitor Transactions

- Check terminal logs for transaction IDs
- Use Stacks Explorer: `https://explorer.hiro.so/txid/YOUR_TX_ID?chain=testnet`

## 📚 Additional Resources

- [Stacks.js Documentation](https://docs.stacks.co/stacks.js/)
- [Clarity Language Reference](https://docs.stacks.co/clarity/)
- [Testnet Faucet](https://explorer.hiro.so/sandbox/faucet?chain=testnet) - Get test STX
- [Contract Explorer](https://explorer.hiro.so/?chain=testnet)

## ⚠️ Production Checklist

Before going to mainnet:

- [ ] Switch `NETWORK` to `STACKS_MAINNET`
- [ ] Use `expo-secure-store` instead of AsyncStorage for seed phrases
- [ ] Implement proper error logging
- [ ] Add transaction confirmation UI
- [ ] Set appropriate post-conditions
- [ ] Test all contract functions thoroughly
- [ ] Audit smart contract security
- [ ] Set up backend database for user mappings (username → address)

## 🎉 You're Ready!

Everything is set up and ready to go. Just:

1. Deploy your contract
2. Update the config
3. Implement your functions
4. Start building!

Check `lib/EXAMPLE_USAGE.tsx` for concrete code examples! 🚀
