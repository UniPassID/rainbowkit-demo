import { Outlet } from "umi";
import styles from "./index.less";
import "@rainbow-me/rainbowkit/styles.css";
import {
  connectorsForWallets,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import {
  optimismGoerli,
  arbitrumGoerli,
  goerli,
  polygonMumbai,
} from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { unipassWallet } from "@unipasswallet/rainbowkit-plugin";

export default function Layout() {
  const { chains, publicClient } = configureChains(
    [goerli, polygonMumbai, arbitrumGoerli, optimismGoerli],
    [publicProvider()]
  );

  const connectors = connectorsForWallets([
    {
      groupName: "Recommended",
      wallets: [
        injectedWallet({ chains, shimDisconnect: true }),
        unipassWallet({
          chains,
          options: {
            chainId: polygonMumbai.id,
            returnEmail: false,
            configurations: {
              onAuthChain: true,
            },
            appSettings: {
              appName: "wagmi demo",
            },
          },
        }),
      ],
    },
  ]);

  // Set up wagmi config
  const config = createConfig({
    autoConnect: true,
    connectors,
    publicClient,
  });

  return (
    <div className={styles.navs}>
      <WagmiConfig config={config}>
        <RainbowKitProvider chains={chains}>
          <Outlet />
        </RainbowKitProvider>
      </WagmiConfig>
    </div>
  );
}
