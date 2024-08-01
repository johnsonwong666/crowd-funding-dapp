import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  sepolia,
  hardhat,
  localhost,
} from "wagmi/chains";
import {
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
  injectedWallet,
  coinbaseWallet,
  imTokenWallet,
  okxWallet,
  coreWallet,
  argentWallet,
  trustWallet,
  uniswapWallet,
  phantomWallet,
} from "@rainbow-me/rainbowkit/wallets";

const config = getDefaultConfig({
  appName: "crowd-funding",
  projectId: "71e1f96fd8bd5320e42207df58aa8d0c",
  chains: [
    localhost,
    hardhat,
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
    sepolia,
  ],
  wallets: [
    {
      groupName: "Popular",
      wallets: [
        metaMaskWallet,
        rainbowWallet,
        walletConnectWallet,
        coinbaseWallet,
      ],
    },
    {
      groupName: "More",
      wallets: [
        okxWallet,
        trustWallet,
        argentWallet,
        uniswapWallet,
        coreWallet,
        imTokenWallet,
        phantomWallet,
        injectedWallet,
      ],
    },
  ],
});
export default config;
