
import { rpc, xdr } from "@stellar/stellar-sdk";

const xdrString = "AAAAAgAAAACqCMZ5uJAmT0od64HUm4bM141WOmA0oLghjusDb5PhzQAAQMUAEaAkAAAAAQAAAAEAAAAAAAAAAAAAAABpm0JdAAAAAAAAAAEAAAAAAAAAGAAAAAAAAAABOu1yFf0vMnHFPRYwF7C0HW8xLG+bJkmYoUVVlCSjWFIAAAAPYXBwcm92ZV9hdWRpdG9yAAAAAAEAAAADAAAAAAAAAAEAAAAAAAAAAAAAAAE67XIV/S8yccU9FjAXsLQdbzEsb5smSZihRVWUJKNYUgAAAA9hcHByb3ZlX2F1ZGl0b3IAAAAAAQAAAAMAAAAAAAAAAAAAAAEAAAAAAAAAAgAAAAYAAAABOu1yFf0vMnHFPRYwF7C0HW8xLG+bJkmYoUVVlCSjWFIAAAAUAAAAAQAAAAfZisuH+t26/ruZF3Sjk+AP43nRCih7eIbJAnijd5TR0gAAAAEAAAAGAAAAATrtchX9LzJxxT0WMBewtB1vMSxvmyZJmKFFVZQko1hSAAAAEAAAAAEAAAACAAAADwAAAAlNaWxlc3RvbmUAAAAAAAADAAAAAAAAAAEADVszAAAAAAAAATAAAAAAAABAYQAAAAA=";

async function run() {
    console.log("Analyzing XDR for Soroban Footprints...");

    // In Soroban, the footprints are in the TransactionData extension
    const envelope = xdr.TransactionEnvelope.fromXDR(xdrString, "base64");
    const tx = envelope.v1().tx();

    console.log("Transaction Type: v1");
    console.log("Fee:", tx.fee().toString());

    const ext = tx.ext();
    if (ext.arm() === "sorobanData") {
        const data = ext.sorobanData();
        const resources = data.resources();
        const footprint = resources.footprint();

        console.log("\n[+] SOROBAN FOOTPRINT DETECTED");
        console.log("Read Only Keys Count:", footprint.readOnly().length);
        console.log("Read Write Keys Count:", footprint.readWrite().length);

        console.log("\n[+] RESOURCE LIMITS");
        console.log("Instructions:", resources.instructions().toString());
        console.log("Read Bytes:", resources.readBytes().toString());
        console.log("Write Bytes:", resources.writeBytes().toString());
    } else {
        console.log("No Soroban data found in XDR extension.");
    }
}

run().catch(console.error);
