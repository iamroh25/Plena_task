import { useMemo } from "react";
import { useAccount, useEnsName } from "wagmi";
import { useConnectModal, useAccountModal } from "@rainbow-me/rainbowkit";

function shorten(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { data: ens } = useEnsName({ address, chainId: 1, query: { enabled: !!address } });
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();

  const label = useMemo(() => ens ?? shorten(address), [ens, address]);

  if (!isConnected) {
    return (
      <button
        onClick={() => openConnectModal?.()}
        className="px-3 py-1 rounded bg-lime-400 text-black font-semibold hover:bg-lime-500"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <button
      onClick={() => openAccountModal?.()}
      className="px-3 py-1 rounded bg-[#1f2937] text-white hover:bg-[#374151] border border-[#2b2b2b] flex items-center gap-2"
      title={address}
    >
      <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
      {label}
    </button>
  );
}
