import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, beginCell, toNano } from '@ton/core';
import { LotteryContract } from '../main';
import '@ton-community/test-utils';

describe('LotteryContract', () => {
  let blockchain: Blockchain;
  let owner: SandboxContract<TreasuryContract>;
  let user1: SandboxContract<TreasuryContract>;
  let user2: SandboxContract<TreasuryContract>;
  let lotteryContract: SandboxContract<LotteryContract>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    owner = await blockchain.treasury('owner');
    user1 = await blockchain.treasury('user1');
    user2 = await blockchain.treasury('user2');

    // Create contract with owner.address instead of hardcoded one
    const initData = beginCell()
      .storeRef(
        beginCell()
          .storeAddress(owner.address)
          .storeUint(0, 128)
          .storeUint(0, 32)
          .storeDict(null)
          .endCell()
      )
      .endCell();

    // Use the data from main.ts but override data with our test data
    lotteryContract = blockchain.openContract(
      LotteryContract.createFromConfig({}, {
        code: LotteryContract.createFromConfig({}).init?.code,
        data: initData
      })
    );

    await lotteryContract.sendDeploy(owner.getSender(), toNano('0.05'));
  });

  it('should be able to read owner', async () => {
    const newOwner = await lotteryContract.getOwner();
    expect(newOwner.equals(owner.address)).toBe(true);
  });

   it('should allow users to deposit TON and update their chances', async () => {
   await user1.send({ to: lotteryContract.address, value: toNano('10'), body: beginCell().storeUint(1, 32).endCell() });
   await user2.send({ to: lotteryContract.address, value: toNano('1'), body: beginCell().storeUint(1, 32).endCell() });

   const user1Result = await blockchain.runGetMethod(
     lotteryContract.address,
     'get_user_chances',
     [{ type: 'slice', cell: beginCell().storeAddress(user1.address).endCell() }]
   );
   expect(user1Result.stackReader.readNumber()).toBe(10);

   const user2Result = await blockchain.runGetMethod(
     lotteryContract.address,
     'get_user_chances',
     [{ type: 'slice', cell: beginCell().storeAddress(user2.address).endCell() }]
   );
   expect(user2Result.stackReader.readNumber()).toBe(1);

   const totalDeposited = await blockchain.runGetMethod(
     lotteryContract.address,
     'get_total_deposited'
   );
   const totalTickets = await blockchain.runGetMethod(
     lotteryContract.address,
     'get_total_tickets'
   );
   
   expect(totalDeposited.stackReader.readBigNumber()).toBe(toNano('11'));
   expect(totalTickets.stackReader.readNumber()).toBe(11);
 });

 it('should throw an error if the winning ticket is outside the range', async () => {
   await user1.send({ 
     to: lotteryContract.address, 
     value: toNano('10'), 
     body: beginCell().storeUint(1, 32).endCell() 
   });

   const result = await owner.send({
     to: lotteryContract.address,
     value: toNano('0.05'),
     body: beginCell().storeUint(2, 32).storeUint(15, 32).endCell()
   });

   expect(result.transactions[2].exitCode).not.toBe(0);
 });

it('should correctly select the winner based on weighted chances', async () => {
   // Initial deposit from user1 (10 tickets)
   await user1.send({ 
     to: lotteryContract.address, 
     value: toNano('10'), 
     body: beginCell().storeUint(1, 32).endCell() 
   });
   console.log('User1 deposited 10 TON (10 tickets)');
   
   // Initial deposit from user2 (1 ticket)
   await user2.send({ 
     to: lotteryContract.address, 
     value: toNano('1'), 
     body: beginCell().storeUint(1, 32).endCell() 
   });
   console.log('User2 deposited 1 TON (1 ticket)');

   // Log initial state
   const totalTickets = await blockchain.runGetMethod(
     lotteryContract.address,
     'get_total_tickets'
   );
   console.log('Total tickets:', totalTickets.stackReader.readNumber());

   const user1Chances = await blockchain.runGetMethod(
     lotteryContract.address,
     'get_user_chances',
     [{ type: 'slice', cell: beginCell().storeAddress(user1.address).endCell() }]
   );
   console.log('User1 chances:', user1Chances.stackReader.readNumber());

   const initialBalance = await user1.getBalance();
   console.log('User1 initial balance:', initialBalance);

   // Pick ticket #5 (should be user1 who owns 0-9)
   const result = await owner.send({
     to: lotteryContract.address,
     value: toNano('0.05'),
     body: beginCell().storeUint(2, 32).storeUint(5, 32).endCell()
   });
   console.log('Distribution transaction:', result.transactions);

   const finalBalance = await user1.getBalance();
   console.log('User1 final balance:', finalBalance);

   expect(finalBalance + toNano('0.1')).toBeGreaterThan(initialBalance);

   // Verify contract reset
   const finalDeposited = await blockchain.runGetMethod(
     lotteryContract.address,
     'get_total_deposited'
   );
   const finalTickets = await blockchain.runGetMethod(
     lotteryContract.address,
     'get_total_tickets'
   );
   expect(finalDeposited.stackReader.readBigNumber()).toBe(BigInt(0));
   expect(finalTickets.stackReader.readNumber()).toBe(0);
});

it('should allow users to deposit TON', async () => {
   const depositResult = await user1.send({ 
       to: lotteryContract.address, 
       value: toNano('1'), 
       body: beginCell().storeUint(1, 32).endCell()
   });

   expect(depositResult.transactions.length).toBeGreaterThan(0);
});

it('should give 1 chance for 1.5 TON deposit', async () => {
   await user1.send({ 
       to: lotteryContract.address, 
       value: toNano('1.5'), 
       body: beginCell().storeUint(1, 32).endCell()
   });

   const chances = await blockchain.runGetMethod(
       lotteryContract.address,
       'get_user_chances',
       [{ type: 'slice', cell: beginCell().storeAddress(user1.address).endCell() }]
   );
   expect(chances.stackReader.readNumber()).toBe(1);
});

it('should not fail when owner deposits', async () => {
   await owner.send({ 
       to: lotteryContract.address, 
       value: toNano('1'), 
       body: beginCell().storeUint(1, 32).endCell()
   });

   // Verify owner's chances were recorded
   const ownerChances = await blockchain.runGetMethod(
       lotteryContract.address,
       'get_user_chances',
       [{ type: 'slice', cell: beginCell().storeAddress(owner.address).endCell() }]
   );
   expect(ownerChances.stackReader.readNumber()).toBe(1);
});

it('should reject ticket number greater than total tickets', async () => {
   await user1.send({ 
       to: lotteryContract.address, 
       value: toNano('2'), 
       body: beginCell().storeUint(1, 32).endCell()
   });

   const result = await owner.send({
       to: lotteryContract.address,
       value: toNano('0.05'),
       body: beginCell().storeUint(2, 32).storeUint(3, 32).endCell()
   });

   expect(result.transactions[2].exitCode).not.toBe(0);
});

 it('should allow the owner to transfer ownership', async () => {
   await owner.send({
     to: lotteryContract.address,
     value: toNano('0.05'),
     body: beginCell().storeUint(3, 32).storeAddress(user1.address).endCell()
   });

   const result = await blockchain.runGetMethod(
     lotteryContract.address,
     'get_owner'
   );
   expect(result.stackReader.readAddress().equals(user1.address)).toBe(true);
 });
});