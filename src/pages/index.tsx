import { etherToWei } from "./format_bignumber";
import { Button, Divider, Input, message } from "antd";
import { useState } from "react";
import { useAccount, useSigner, useSignTypedData } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import logo from "../assets/UniPass.svg";

const { TextArea } = Input;

const domain = {
  name: "Ether Mail",
  version: "1",
  chainId: 80001,
  verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
} as const;

const types = {
  Person: [
    { name: "name", type: "string" },
    { name: "wallet", type: "address" },
  ],
  Mail: [
    { name: "from", type: "Person" },
    { name: "to", type: "Person" },
    { name: "contents", type: "string" },
  ],
} as const;

const value = {
  from: {
    name: "Cow",
    wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
  },
  to: {
    name: "Bob",
    wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
  },
  contents: "Hello, Bob!",
} as const;

function App() {
  const { isConnected, address } = useAccount();
  const { data: signer } = useSigner();

  const [signature, setSignature] = useState("");
  const [nativeHash, setNativeHash] = useState("");
  const [sendNativeLoading, setSendNativeLoading] = useState(false);

  const {
    data: typedDataSig,
    reset: restTypedData,
    signTypedData,
  } = useSignTypedData({
    domain,
    types,
    value,
  });

  const signMessage = async () => {
    if (signer) {
      const signature = await signer.signMessage(
        "Welcome to use Wagmi with unipass!"
      );
      setSignature(signature);
    }
  };

  const sendTransaction = async () => {
    if (signer && address) {
      try {
        setSendNativeLoading(true);
        const txParams = {
          from: address,
          to: "0x2B6c74b4e8631854051B1A821029005476C3AF06",
          value: etherToWei("0.001"),
          data: "0x",
        };
        console.log(txParams);

        const txResp = await signer.sendTransaction(txParams);
        const res = await txResp.wait();
        console.log(res);
        setNativeHash(res.transactionHash);
      } catch (e: any) {
        message.error(e?.message || "error");
      } finally {
        setSendNativeLoading(false);
      }
    }
  };

  return (
    <div style={{ marginBottom: "50px", width: "750px" }}>
      <img src={logo} alt="" width={150} />
      <h1>RainbowKit + UniPass</h1>
      <ConnectButton />
      <Divider />
      <h3>Sign Message:</h3>
      <Button
        type="primary"
        disabled={!isConnected}
        onClick={signMessage}
        style={{ marginRight: "30px" }}
      >
        Sign Message
      </Button>
      <h4>signature:</h4>
      <TextArea rows={4} value={signature} />
      <Divider />
      <Button type="primary" onClick={signTypedData} disabled={!isConnected}>
        Sign Typed Data(EIP-712)
      </Button>
      <h4>Typed Data Signature:</h4>
      <TextArea rows={4} value={typedDataSig} />
      <Divider />
      <h3>Send Transaction:</h3>
      <Button
        onClick={sendTransaction}
        type="primary"
        disabled={!isConnected}
        loading={sendNativeLoading}
      >
        Send native Token
      </Button>
      <h4>native tx hash:</h4>
      <TextArea rows={1} value={nativeHash} />
      <Divider />
    </div>
  );
}

export default App;
