import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../axios/axios";

type CoinLite = {
  id: string;
  name: string;
  symbol: string;
  thumb?: string;
  large?: string;
  market_cap_rank?: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (ids: string[]) => void; 
};

const TokenAddModal = ({ open, onClose, onAdd }: Props) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState<CoinLite[]>([]);
  const [results, setResults] = useState<CoinLite[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIds(new Set());
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const res = await api.get("/search/trending");
        const items: CoinLite[] =
          res?.data?.coins?.map((c: any) => ({
            id: c?.item?.id,
            name: c?.item?.name,
            symbol: c?.item?.symbol,
            thumb: c?.item?.thumb,
            large: c?.item?.large,
            market_cap_rank: c?.item?.market_cap_rank,
          })) ?? [];
        if (!cancelled) setTrending(items);
      } catch {
        if (!cancelled) setError("Failed to load trending tokens.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      if (query.trim() === "") {
        setResults([]);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/search", { params: { query } });
        const items: CoinLite[] =
          res?.data?.coins?.map((c: any) => ({
            id: c?.id,
            name: c?.name,
            symbol: c?.symbol,
            thumb: c?.thumb,
            large: c?.large,
            market_cap_rank: c?.market_cap_rank,
          })) ?? [];
        if (!cancelled) setResults(items);
      } catch {
        if (!cancelled) setError("Search failed. Try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      cancelled = true;
    };
  }, [query, open]);

  const listToShow = useMemo(() => {
    if (query.trim()) return results;
    return trending;
  }, [query, results, trending]);

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-[680px] max-w-[95vw] bg-[#1c1c1c] text-white rounded-xl border border-gray-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
          <div className="text-lg font-semibold">Add Token</div>
          {selectedIds.size > 0 && (
            <div className="text-xs text-gray-400">{selectedIds.size} selected</div>
          )}
        </div>

        <div className="px-5 pt-4 pb-2">
          <div className="mb-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tokens (e.g., ETH, SOL)..."
              className="w-full bg-[#101010] border border-gray-700 rounded-md px-3 py-2 outline-none focus:border-gray-500"
            />
          </div>

          <div className="text-xs text-gray-400 mb-2">
            {query.trim() ? "Search Results" : "Trending"}
          </div>

          <div className="max-h-[360px] overflow-y-auto rounded-md border border-gray-800">
            {loading && <div className="p-4 text-gray-400 text-sm">Searching…</div>}
            {!loading && listToShow.length === 0 && (
              <div className="p-4 text-gray-400 text-sm">
                {query.trim() ? "No results found." : "Loading…"}
              </div>
            )}
            {!loading &&
              listToShow.map((c) => {
                const checked = selectedIds.has(c.id);
                return (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-[#2a2a2a] cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault();        
                      toggleId(c.id);
                    }}
                    onKeyDown={(e) => {          
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        toggleId(c.id);
                      }
                    }}
                    tabIndex={0}                 
                    role="checkbox"              
                    aria-checked={checked}
                  >
                    <img src={c.thumb || c.large} alt={c.name} className="w-6 h-6 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">
                        {c.name} <span className="text-gray-400">({(c.symbol || "").toUpperCase()})</span>
                      </div>
                    </div>

                    <input
                      type="radio"
                      name={`token-${c.id}`}   
                      checked={checked}
                      readOnly
                      className="accent-lime-400 pointer-events-none"
                    />
                  </label>
                );
            })}
          </div>

          {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
        </div>

        <div className="px-5 py-3 border-t border-gray-700 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            disabled={selectedIds.size === 0}
            onClick={() => selectedIds.size > 0 && onAdd(Array.from(selectedIds))}
            className={`px-3 py-1.5 rounded ${
              selectedIds.size > 0
                ? "bg-lime-400 text-black hover:bg-lime-500"
                : "bg-gray-600 text-gray-300 cursor-not-allowed"
            }`}
          >
            {selectedIds.size > 1 ? "Add Tokens" : "Add to Watchlist"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TokenAddModal;
