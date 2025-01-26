# TON Lottery Smart Contract

A decentralized lottery system on TON blockchain where users can participate by depositing TON coins.

## Features
- Users deposit TON (1 TON = 1 ticket)  
- Automatic chance calculation based on deposit amount
- Owner-controlled prize distribution
- Random winner selection based on weighted chances
- Full prize pool distribution to winner
- Ownership transfer capability

## Contract Methods

### Internal Messages
- `op=1`: Deposit TON (min 1 TON)
- `op=2`: Distribute prize (owner only)
- `op=3`: Transfer ownership (owner only)

### Get Methods
- `get_owner()`: Current owner address
- `get_total_deposited()`: Total TON in pool
- `get_total_tickets()`: Total tickets issued
- `get_user_chances(address)`: User's ticket count

## Development

\```bash
# Run tests
npm test

# Build contract
npm run build
\```

## Usage Example

\```typescript
// Deposit 1 TON
await contract.send({ 
   value: toNano('1'), 
   body: beginCell().storeUint(1, 32).endCell() 
});

// Distribute prize (owner only)
await contract.send({
   value: toNano('0.05'),
   body: beginCell()
       .storeUint(2, 32)
       .storeUint(ticketNumber, 32)
       .endCell()
});
\```
