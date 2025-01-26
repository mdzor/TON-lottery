import { beginCell, toNano } from "@ton/core";


const cell = beginCell()
    .storeUint(1, 32) // op = 1 (deposit)
    .endCell();

export default cell; 