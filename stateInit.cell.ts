import { Address, beginCell } from "@ton/core";

const DEPLOYER_ADDRESS = "0QCHzWPDDalIpYbXf1X7qeuf3N5ydC-0uLMO1tQ3WsY3_l3J";

const cell = beginCell()
    .storeUint(0, 32) // contract code version
    .storeUint(0, 32) // contract revision
    .storeRef(
        beginCell()
            .storeAddress(Address.parse(DEPLOYER_ADDRESS))
            .storeUint(0, 128)
            .storeUint(0, 32)
            .storeDict(null)
            .endCell()
    )
    .endCell();

export default cell;