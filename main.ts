import { Contract, ContractProvider, Sender, Address, Cell, contractAddress, beginCell } from '@ton/core';
import { toNano } from "@ton/core";

export class LotteryContract implements Contract {
  static createFromConfig(config: {}, configData?: {
    code: Cell;
    data: Cell;
  }): LotteryContract {
    let code: Cell;
    let data: Cell;

    if (configData) {
      code = configData.code;
      data = configData.data;
    } else {
      code = Cell.fromBase64('te6ccgECDgEAAmEAART/APSkE/S88sgLAQIBIAIDAgFIBAUAMPIw+ABtcCDI+CjPFst/yx/0AMnIzMntVALw0CDHAJJfA+AB0NMDAXGwkl8D4PpAMAHTH+1EbpX4KHAgbY4f7UTQINdKwgCc1DDQ+kDTf9Mf9AQw4PpA03/TH/QEMOIlwAHjAjckwALjAgTAA44dUETHBfLixvpAMAPIUATPFhLLf8sf9ADJyMzJ7VTgXwaED/LwBgcCASAICQCmNDSCEDuaygBTYLny0sQl+QFTBIMH9A5voXABlDDTHzCRMeJTgqkEoMjLH1AHzxbJ0EBkgwf0FlEloFBUqQQSoAHIUATPFhLLf8sf9ADJyMzJ7VQA5DRRQccF8uLGAdMfMFIDvvLSx3AgbSaDB/SGb6WQjiEB0x9QVaBTBrwkwACwmWwicQP6QDBDA5E04ieDB/R8b6XoWzIzNAHy4shwgBjIywVQBM8WWPoCEstqyXD7AHAgbchQBM8WEst/yx/0AMnIzMntVAIBIAoLAgFiDA0AX7uaXtRG6V+ChwIG2OH+1E0CDXSsIAnNQw0PpA03/TH/QEMOD6QNN/0x/0BDDiXwOABjuWle1EbpX4KHAgbY4f7UTQINdKwgCc1DDQ+kDTf9Mf9AQw4PpA03/TH/QEMOIQI18DgAYbNuO1EbpX4KHAgbY4f7UTQINdKwgCc1DDQ+kDTf9Mf9AQw4PpA03/TH/QEMOITXwOAAgbGN+1EbpX4KHAgbY4f7UTQINdKwgCc1DDQ+kDTf9Mf9AQw4PpA03/TH/QEMOJsMQH5AQGDB/QOb6GT0x8w4DBwg');
      data = beginCell()
        .storeRef(
          beginCell()
            .storeAddress(Address.parse('0QBouTHnaMvNZpo4IdlobeiZ31hGSQ8ZJuiK6cCM6W93XEoy'))
            .storeUint(0, 128)
            .storeUint(0, 32)
            .storeDict(null)
            .endCell()
        )
        .endCell();
    }

    const workchain = 0;
    const address = contractAddress(workchain, { code, data });
    return new LotteryContract(address, { code, data });
  }

  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: 1,
      body: beginCell().endCell(),
    });
  }

  async sendDeposit(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: 1,
      body: beginCell()
        .storeUint(1, 32)
        .endCell(),
    });
  }

  async sendDistributePrize(provider: ContractProvider, via: Sender, winnerTicket: number) {
    await provider.internal(via, {
      value: toNano('0.05'),
      sendMode: 1,
      body: beginCell()
        .storeUint(2, 32)
        .storeUint(winnerTicket, 32)
        .endCell(),
    });
  }

  async sendTransferOwnership(provider: ContractProvider, via: Sender, newOwner: Address) {
    await provider.internal(via, {
      value: toNano('0.05'),
      sendMode: 1,
      body: beginCell()
        .storeUint(3, 32)
        .storeAddress(newOwner)
        .endCell(),
    });
  }

async get_owner(provider: ContractProvider): Promise<Address> {
  const result = await provider.get('get_owner', []);
  return result.stack.readAddress();
}

async get_total_deposited(provider: ContractProvider): Promise<bigint> {
  const result = await provider.get('get_total_deposited', []);
  return result.stack.readBigNumber();
}

async get_total_tickets(provider: ContractProvider): Promise<number> {
  const result = await provider.get('get_total_tickets', []);
  return result.stack.readNumber();
}

async get_user_chances(provider: ContractProvider, address: Address): Promise<number> {
  const result = await provider.get('get_user_chances', [
    { type: 'slice', cell: beginCell().storeAddress(address).endCell() },
  ]);
  return result.stack.readNumber();
}

  async getOwner(provider: ContractProvider): Promise<Address> {
    const result = await provider.get('get_owner', []);
    return result.stack.readAddress();
  }

  async getTotalDeposited(provider: ContractProvider): Promise<bigint> {
    const result = await provider.get('get_total_deposited', []);
    return result.stack.readBigNumber();
  }

  async getTotalTickets(provider: ContractProvider): Promise<number> {
    const result = await provider.get('get_total_tickets', []);
    return result.stack.readNumber();
  }

  async getUserChances(provider: ContractProvider, address: Address): Promise<number> {
    const result = await provider.get('get_user_chances', [
      { type: 'slice', cell: beginCell().storeAddress(address).endCell() },
    ]);
    return result.stack.readNumber();
  }
}