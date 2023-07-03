import { etherToWei, weiToEther } from "@/unipass/format_bignumber";
import { SiweMessage } from "siwe";
import { Button, Divider, Input, message } from "antd";
import { utils } from "ethers";
import { useEffect, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSignTypedData,
  useBalance,
  useSignMessage,
  useSendTransaction,
  useChainId,
  usePublicClient,
  usePrepareSendTransaction,
} from "wagmi";
import { parseEther } from "viem";
import logo from "../assets/UniPass.svg";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const { TextArea } = Input;

const domain = {
  name: "Ether Mail",
  version: "1",
  chainId: 5,
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

const personalSignMessage = "Welcome to use Wagmi with unipass!";

function App() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const {
    data: signature1,
    signMessageAsync: signMessageAsync1,
    variables,
  } = useSignMessage();
  const { data: signature2, signMessageAsync: signMessageAsync2 } =
    useSignMessage();
  const { connect, connectors, pendingConnector, isLoading } = useConnect();

  const { config } = usePrepareSendTransaction({
    to: "0x2B6c74b4e8631854051B1A821029005476C3AF06",
    value: parseEther("0.01"),
    data: "0x",
  });
  const { sendTransactionAsync: _sendTransaction } = useSendTransaction(config);

  const { disconnect } = useDisconnect();

  const [balance, setBalance] = useState("0");

  const [nativeHash, setNativeHash] = useState("");
  const [sendNativeLoading, setSendNativeLoading] = useState(false);

  const {
    data: typedDataSig,
    reset: restTypedData,
    signTypedData,
  } = useSignTypedData({
    domain: { ...domain, chainId },
    types,
    primaryType: "Mail",
    message: value,
  });

  useEffect(() => {
    if (publicClient && address) {
      publicClient?.getBalance({ address }).then((res) => {
        setBalance(weiToEther(res ?? 0));
      });
    }
  }, [publicClient, address]);

  const signWithEthereum = async () => {
    if (address) {
      const siweMessage = createSiweMessage(
        address!,
        "This is a test statement."
      );
      const _signature = await signMessageAsync1({ message: siweMessage });
    }
  };

  const sendTransaction = async () => {
    if (address) {
      try {
        setSendNativeLoading(true);

        const txResp = await _sendTransaction?.();
        setNativeHash(txResp?.hash || "");
      } catch (e: any) {
        message.error(e?.message || "error");
      } finally {
        setSendNativeLoading(false);
      }
    }
  };

  const getConnectionButtons = () => {
    if (!isConnected) {
      return (
        <>
          {connectors.map((connector) => (
            <Button
              disabled={!connector.ready}
              key={connector.id}
              onClick={() => connect({ connector, chainId: 80001 })}
              type="primary"
              style={{ marginRight: "30px" }}
            >
              {connector.name}
              {!connector.ready && " (unsupported)"}
            </Button>
          ))}
        </>
      );
    }

    return (
      <Button
        onClick={() => {
          setBalance("0");
          setNativeHash("");
          restTypedData();
          disconnect();
          setSendNativeLoading(false);
        }}
        type="dashed"
      >
        Disconnect Wallet
      </Button>
    );
  };

  const createSiweMessage = (address: string, statement: string) => {
    const { host, origin } = window.location;
    const siweMessage = new SiweMessage({
      domain: host,
      address,
      statement,
      uri: origin,
      version: "1",
      chainId,
    });
    return siweMessage.prepareMessage();
  };

  const verifySiweMessage = async () => {
    if (publicClient && signature1 && address) {
      const isValid = await publicClient.verifyMessage({
        address: address,
        message: variables?.message || "",
        signature: signature1,
      });
      if (isValid) {
        message.success("verify success");
      } else {
        message.error("verify failed");
      }
    }
  };

  return (
    <div style={{ marginBottom: "50px" }}>
      <img src={logo} alt="" width={150} />
      <h1>RainbowKit + UniPass</h1>
      <ConnectButton />

      <Divider />
      <h3>Sign Message:</h3>
      <Button
        type="primary"
        disabled={!isConnected}
        onClick={() => signMessageAsync2({ message: personalSignMessage })}
        style={{ marginRight: "30px" }}
      >
        Sign Message
      </Button>
      <h4>signature:</h4>
      <TextArea rows={4} value={signature2} />

      <Divider />
      <h3>Sign With Ethereum:</h3>
      <Button
        type="primary"
        disabled={!isConnected}
        onClick={signWithEthereum}
        style={{ marginRight: "30px" }}
      >
        Sign With Ethereum
      </Button>
      <h4>siwe signature:</h4>
      <TextArea rows={4} value={signature1} />
      <Button
        type="primary"
        disabled={!signature1}
        onClick={verifySiweMessage}
        style={{ marginRight: "30px", marginTop: "20px" }}
      >
        Verify Signature
      </Button>

      <Divider />
      <Button
        type="primary"
        onClick={() => signTypedData()}
        disabled={!isConnected}
      >
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
