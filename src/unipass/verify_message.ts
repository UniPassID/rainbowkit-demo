import {
  ethers,
  providers,
  Contract,
  TypedDataDomain,
  TypedDataField,
} from "ethers";
import { message } from "antd";
import { SiweMessage } from "siwe";
import { hashMessage } from "ethers/lib/utils";

export const EIP1271_SELECTOR = "0x1626ba7e";

export const verifySiweMessage = async (
  _message: string,
  _signature: string,
  _provider: providers.Web3Provider
) => {
  const _siweMessage = new SiweMessage(_message);
  try {
    await _siweMessage.validate(_signature, _provider);
    message.success("verify success");
  } catch (e: any) {
    message.error("verify failed");
  }
};

export const isValidSignature = async (
  _message: string,
  _signature: string,
  _account: string,
  _provider: providers.Web3Provider
) => {
  const contract = new Contract(
    _account,
    [
      {
        inputs: [
          {
            internalType: "bytes32",
            name: "_hash",
            type: "bytes32",
          },
          {
            internalType: "bytes",
            name: "_signature",
            type: "bytes",
          },
        ],
        name: "isValidSignature",
        outputs: [
          {
            internalType: "bytes4",
            name: "magicValue",
            type: "bytes4",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    _provider
  );

  const code = await contract.isValidSignature(
    hashMessage(_message),
    _signature
  );

  if (code === EIP1271_SELECTOR) {
    message.success("verify success");
  } else {
    message.error("verify failed");
  }
};

export const isValidTypedSignature = async (
  _data: any,
  _account: string,
  _signature: string,
  _provider: providers.Web3Provider
) => {
  const contract = new Contract(
    _account!,
    [
      {
        inputs: [
          {
            internalType: "bytes32",
            name: "_hash",
            type: "bytes32",
          },
          {
            internalType: "bytes",
            name: "_signature",
            type: "bytes",
          },
        ],
        name: "isValidSignature",
        outputs: [
          {
            internalType: "bytes4",
            name: "magicValue",
            type: "bytes4",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    _provider
  );
  const messageHash = encodeTypedDataDigest(_data);
  const code = await contract.isValidSignature(messageHash, _signature);

  if (code === EIP1271_SELECTOR) {
    message.success("verify success");
  } else {
    message.error("verify failed");
  }
};

interface TypedData {
  domain: TypedDataDomain;
  types: Record<string, Array<TypedDataField>>;
  value: Record<string, any>;
  primaryType?: string;
}

const encodeTypedDataHash = (typedData: TypedData): string => {
  const types = { ...typedData.types };

  // remove EIP712Domain key from types as ethers will auto-gen it in
  // the hash encoder below
  delete types["EIP712Domain"];

  return ethers.utils._TypedDataEncoder.hash(
    typedData.domain,
    types,
    typedData.value
  );
};

const encodeTypedDataDigest = (typedData: TypedData): Uint8Array => {
  return ethers.utils.arrayify(encodeTypedDataHash(typedData));
};
