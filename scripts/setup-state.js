
import { Keypair, TransactionBuilder, Account, BASE_FEE, Networks, Contract, rpc, nativeToScVal, Address } from "@stellar/stellar-sdk";

const SECRET = "SAFHN4QNOZKDEPJVA2QTUKEZSYKSDLAH6QMT3TIIC52S7FGSKNZMQTTH";
const contractId = "CA5O24QV7UXTE4OFHULDAF5QWQOW6MJMN6NSMSMYUFCVLFBEUNMFESMT";
const sourceKeypair = Keypair.fromSecret(SECRET);
const server = new rpc.Server("https://soroban-testnet.stellar.org");

async function submit(tx) {
    tx.sign(sourceKeypair);
    const response = await server.sendTransaction(tx);
    if (response.status !== "PENDING") {
        throw new Error(`Transaction failed: ${JSON.stringify(response)}`);
    }
    console.log(`Submitted. Hash: ${response.hash}. Waiting for result...`);
    let result = await server.getTransaction(response.hash);
    while (result.status === "NOT_FOUND" || result.status === "FAILED") {
        await new Promise(r => setTimeout(r, 1000));
        result = await server.getTransaction(response.hash);
        if (result.status === "SUCCESS") break;
    }
    console.log("Success!");
    return result;
}

async function run() {
    console.log("Setting up on-chain state for Phase 4 (with G... address token bypass)...");
    const accountResponse = await server.getAccount(sourceKeypair.publicKey());
    const account = new Account(sourceKeypair.publicKey(), accountResponse.sequenceNumber());
    const networkPassphrase = Networks.TESTNET;

    const contract = new Contract(contractId);

    const addr = (s) => nativeToScVal(s, { type: "address" }); // Simplified to see if it works with strings directly

    // 1. Initialize
    console.log("\n1. Initializing contract...");
    try {
        const initOp = contract.call(
            "initialize",
            addr(sourceKeypair.publicKey()),
            addr("GDJF3OW2CVALMUG4EACMJEQLHHP23N6FYXQVCWVAHNUHEHO2CZMNKRUN"),
            addr("GCVARRTZXCICMT2KDXVYDVE3Q3GNPDKWHJQDJIFYEGHOWA3PSPQ4263I"),
            addr("GBLTSK6RUMU2OMETRIST6D3PJDHWJE2SROH3SQKQ2GTBFT6AMZA3CG5I"),
            addr("GDNBJ2L4ADLHT2QPSVGUE44VOVDP6Y4NR6RNSFXOP4WHAKII4D36LPZ7") // Using G... address instead of C...
        );

        const initTx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
            .addOperation(initOp)
            .setTimeout(30)
            .build();

        const initSim = await server.simulateTransaction(initTx);
        if (rpc.Api.isSimulationSuccess(initSim)) {
            console.log("Initialization simulation success. Submitting...");
            await submit(rpc.assembleTransaction(initTx, initSim).build());
        } else {
            console.log("Initialization simulation failed (likely already initialized):", initSim.error);
        }
    } catch (e) {
        console.log("Initialization Error:", e.message);
    }

    // 2. Add Milestone 0
    console.log("\n2. Adding Milestone 0...");
    const acc2 = await server.getAccount(sourceKeypair.publicKey());
    const account2 = new Account(sourceKeypair.publicKey(), acc2.sequenceNumber());
    const addOp = contract.call("add_milestone", nativeToScVal(1000000000n, { type: "i128" }));

    const addTx = new TransactionBuilder(account2, { fee: BASE_FEE, networkPassphrase })
        .addOperation(addOp)
        .setTimeout(30)
        .build();

    const addSim = await server.simulateTransaction(addTx);
    if (rpc.Api.isSimulationSuccess(addSim)) {
        console.log("Add milestone simulation success. Submitting...");
        await submit(rpc.assembleTransaction(addTx, addSim).build());
    } else {
        console.log("Add milestone simulation failed:", addSim.error);
    }

    console.log("\nOn-chain state ready for Phase 4 handshake simulation.");
}

run().catch(console.error);
