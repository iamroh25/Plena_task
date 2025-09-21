import Dashboard from "./Dashboard";
import Watchlist from "./Watchlist";
import WalletConnect from "./WalletConnect";

const Portfolio = () => {
  return (
    <div className="min-h-screen bg-[#27272A] text-white overflow-x-hidden">
      <div className="w-full max-w-[1440px] mx-auto">
        <header className="h-[56px] px-3 flex items-center justify-between gap-[6px]">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-lime-400 rounded-sm" />
            Token Portfolio
          </h1>
          <WalletConnect />
        </header>

        <main className="w-full min-h-[808px] mt-[28px] px-[28px] flex flex-col gap-12">
          <Dashboard />
          <div className="overflow-x-auto">
            <Watchlist />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Portfolio;
