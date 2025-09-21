import { type PropsWithChildren, useMemo } from "react";
import { WagmiProvider } from "wagmi";
import { mainnet, base, polygon, arbitrum, optimism } from "wagmi/chains";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string;

const wagmiConfig = getDefaultConfig({
  appName: "Token Portfolio",
  projectId,
  chains: [mainnet, base, polygon, arbitrum, optimism],
  ssr: false,
});

export default function AppWeb3Provider({ children }: PropsWithChildren) {
  const queryClient = useMemo(() => new QueryClient(), []);
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ accentColor: "#a3e635" })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
