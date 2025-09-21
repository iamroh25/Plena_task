import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { FiRefreshCw } from "react-icons/fi";
import { Sparklines, SparklinesLine } from "react-sparklines";
import { api } from "../axios/axios";
import { useDispatch } from "react-redux";
import { updateTime } from "../store/lastUpdatedSlice";
import TokenAddModal from "./TokenAddModal";

const MIN_HOLDING = 0.05;
const MAX_HOLDING = 400;
const LS_KEY = "watchlistData";
const PAGE_SIZE = 10;

const Watchlist = () => {
  const [rowData, setRowData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const gridRef = useRef<AgGridReact<any>>(null);

  const [editRowIdFromMenu, setEditRowIdFromMenu] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const dispatch = useDispatch();

  const makeHoldings = (len: number) =>
    Array.from({ length: len }, () =>
      Number((MIN_HOLDING + Math.random() * (MAX_HOLDING - MIN_HOLDING)).toFixed(4))
    );

  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRowData(parsed);
          setCurrentPage(1);
          setEditRowIdFromMenu(null);
          return;
        }
      } catch(err) {
        console.error(err)
      }
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    const res = await api.get("/coins/markets", {
      params: {
        vs_currency: "usd",
        order: "market_cap_desc",
        per_page: 100,
        page: 1,
        sparkline: true,
      },
    });

    const holdings = makeHoldings(res.data.length);
    const merged = res.data.map((coin: any, index: number) => {
      const amount = holdings[index];
      return {
        ...coin,
        holdings: amount,
        value: amount * coin.current_price,
      };
    });

    setRowData(merged);
    localStorage.setItem(LS_KEY, JSON.stringify(merged));
    setCurrentPage(1);
    setEditRowIdFromMenu(null);
  };

  const refreshPrices = async () => {
    try {
      setRefreshing(true);
      if (!rowData.length) {
        await fetchData();
        return;
      }
      const ids = rowData.map((r) => r.id).join(",");
      const res = await api.get("/coins/markets", {
        params: {
          vs_currency: "usd",
          ids,
          order: "market_cap_desc",
          per_page: rowData.length,
          page: 1,
          sparkline: true,
        },
      });

      const next = res.data.map((coin: any) => {
        const prev = rowData.find((r) => r.id === coin.id);
        const holdings =
          prev?.holdings ??
          Number((MIN_HOLDING + Math.random() * (MAX_HOLDING - MIN_HOLDING)).toFixed(4));
        return {
          ...coin,
          holdings,
          value: holdings * coin.current_price,
        };
      });

      setRowData(next);
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddTokens = async (ids: string[]) => {
    try {
      if (!ids.length) return;
      const res = await api.get("/coins/markets", {
        params: {
          vs_currency: "usd",
          ids: ids.join(","),
          order: "market_cap_desc",
          per_page: ids.length,
          page: 1,
          sparkline: true,
        },
      });

      const newHoldings = makeHoldings(res.data.length);
      const toAdd = res.data.map((coin: any, idx: number) => {
        const amount = newHoldings[idx];
        return {
          ...coin,
          holdings: amount,
          value: amount * coin.current_price,
        };
      });

      setRowData((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const merged = [...prev, ...toAdd.filter((c: any) => !existingIds.has(c.id))];
        localStorage.setItem(LS_KEY, JSON.stringify(merged));
        return merged;
      });

      dispatch(updateTime(new Date().toISOString()));
    } catch (e) {
      console.error("Failed to add tokens", e);
    } finally {
      setAddOpen(false);
    }
  };

  const HoldingsCellRenderer = (props: any) => {
    const { value, data } = props;
    const [isEditing, setIsEditing] = useState(false);
    const [tempHoldings, setTempHoldings] = useState<number>(value);

    useEffect(() => {
      if (editRowIdFromMenu === data.id) {
        setIsEditing(true);
        setTempHoldings(value);
      }
    }, [editRowIdFromMenu, data.id, value]);

    const handleSave = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setRowData((prev) => {
        const idx = prev.findIndex((r) => r.id === data.id);
        if (idx === -1) return prev;
        const next = [...prev];
        const updated = {
          ...next[idx],
          holdings: tempHoldings,
          value: tempHoldings * next[idx].current_price,
        };
        next[idx] = updated;

        localStorage.setItem(LS_KEY, JSON.stringify(next));
        return next;
      });
      dispatch(updateTime(new Date().toISOString()));
      setEditRowIdFromMenu(null);
      setIsEditing(false);
    };

    if (isEditing) {
      return (
        <div
          className="flex items-center gap-2"
        >
          <input
            type="number"
            value={tempHoldings}
            onChange={(e) => setTempHoldings(Number(e.target.value))}
            className="w-20 px-1 py-0.5 rounded"
            autoFocus
          />
          <button
            onClick={handleSave}
            className="px-2 py-0.5 bg-lime-400 text-black rounded hover:bg-lime-500"
          >
            Save
          </button>
        </div>
      );
    }

    return (
      <span
        onClick={() => {
          setIsEditing(true);
        }}
        onDoubleClick={(e) => e.stopPropagation()}
        className="cursor-pointer"
      >
        {value}
      </span>
    );
  };

  const ActionsCellRenderer = (props: any) => {
    const { data } = props;
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

    const toggleMenu = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!open) {
        const rect = btnRef.current?.getBoundingClientRect();
        if (rect) {
          setMenuPos({
            top: rect.bottom + window.scrollY + 6,
            left: rect.right + window.scrollX - 176,
          });
        }
        setOpen(true);
      } else {
        setOpen(false);
      }
    };

    useEffect(() => {
      if (!open) return;
      const onDocClick = (ev: MouseEvent) => {
        const target = ev.target as Node;
        const clickedBtn =
          btnRef.current && (btnRef.current === target || btnRef.current.contains(target));
        const clickedMenu =
          menuRef.current && (menuRef.current === target || menuRef.current.contains(target));
        if (!clickedBtn && !clickedMenu) setOpen(false);
      };
      const onKey = (ev: KeyboardEvent) => {
        if (ev.key === "Escape") setOpen(false);
      };
      document.addEventListener("click", onDocClick);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("click", onDocClick);
        document.removeEventListener("keydown", onKey);
      };
    }, [open]);

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditRowIdFromMenu(data.id);
      setOpen(false);
    };

    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      setRowData((prev) => {
        const next = prev.filter((r) => r.id !== data.id);
        localStorage.setItem(LS_KEY, JSON.stringify(next));
        return next;
      });
      dispatch(updateTime(new Date().toISOString()));
      setOpen(false);
    };

    return (
      <>
        <button
          ref={btnRef}
          className="px-2 text-gray-400 hover:text-white"
          aria-label="Actions"
          onClick={toggleMenu}
        >
          …
        </button>

        {open &&
          menuPos &&
          createPortal(
            <div
              ref={menuRef}
              style={{
                position: "absolute",
                top: menuPos.top,
                left: menuPos.left,
                width: 176,
                zIndex: 9999,
              }}
            >
              <div className="rounded-md border border-gray-700 bg-[#1b1b1b] shadow-lg">
                <button
                  className="block w-full px-3 py-2 text-left hover:bg-gray-700"
                  onClick={handleEdit}
                >
                  ✏️ Edit Holdings
                </button>
                <button
                  className="block w-full px-3 py-2 text-left text-red-400 hover:bg-red-500/20"
                  onClick={handleRemove}
                >
                  🗑 Remove
                </button>
              </div>
            </div>,
            document.body
          )}
      </>
    );
  };

  const columnDefs: Array<ColDef> = useMemo(
    () => [
      {
        headerName: "Token",
        field: "name",
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-2">
            <img
              src={params.data.image}
              alt={params.value}
              className="w-6 h-6 rounded-full"
            />
            <span>
              {params.value} ({params.data.symbol?.toUpperCase()})
            </span>
          </div>
        ),
      },
      {
        headerName: "Price",
        field: "current_price",
        valueFormatter: (p) => (p.value ? `$${p.value.toLocaleString()}` : "$0"),
      },
      {
        headerName: "24h %",
        field: "price_change_percentage_24h",
        valueFormatter: (p) => {
          const v = Number(p?.value);
          if (!isFinite(v)) return "0.00%";
          const sign = v > 0 ? "+" : "";
          return `${sign}${v.toFixed(2)}%`;
        },
      },
      {
        headerName: "Sparkline",
        field: "sparkline_in_7d",
        valueFormatter: () => "",
        cellRenderer: (params: any) => {
          const prices = params.value?.price || [];
          return (
            <Sparklines data={prices} limit={50} width={100} height={20}>
              <SparklinesLine
                color={params.data.price_change_percentage_24h >= 0 ? "limegreen" : "red"}
              />
            </Sparklines>
          );
        },
      },
      {
        headerName: "Holdings",
        field: "holdings",
        cellRenderer: HoldingsCellRenderer,
      },
      {
        headerName: "Value",
        field: "value",
        valueFormatter: (p) => (p.value ? `$${p.value.toLocaleString()}` : "$0"),
      },
      {
        headerName: "",
        field: "actions",
        cellRenderer: ActionsCellRenderer,
      },
    ],
    [editRowIdFromMenu]
  );

  const defaultColDef = useMemo<ColDef>(() => ({
    width: 206,         
    resizable: true,     
    sortable: true,    
  }), []);
  const totalPages = Math.ceil(rowData.length / PAGE_SIZE);
  const getPageData = useCallback(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return rowData.slice(start, start + PAGE_SIZE);
  }, [currentPage, rowData]);

  return (
    <div className="w-full text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-green-400">★</span> Watchlist
        </h2>
        <div className="flex gap-2">
          <button
            onClick={refreshPrices}
            disabled={refreshing}
            className={`flex items-center gap-2 px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 ${
              refreshing ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh Prices"}
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="px-3 py-1 rounded bg-lime-400 text-black font-semibold hover:bg-lime-500"
          >
            + Add Token
          </button>
        </div>
      </div>

      <div className="ag-theme-quartz-dark rounded-lg" style={{ height: 600, width: "100%" }}>
        <AgGridReact
          ref={gridRef}
          rowData={getPageData()}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          headerHeight={40}
          rowHeight={48}
          domLayout="autoHeight"
          suppressPaginationPanel={true}
          getRowId={(params) => params.data.id}
        />
      </div>

      <div className="flex justify-between items-center text-sm text-gray-400 mt-3">
        <span>
          {(currentPage - 1) * PAGE_SIZE + 1}–
          {Math.min(currentPage * PAGE_SIZE, rowData.length)} of {rowData.length} results
        </span>

        <span className="flex items-center gap-4">
          <span>
            {currentPage} of {totalPages} pages
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`${currentPage === 1 ? "text-gray-600 cursor-not-allowed" : "hover:text-white"}`}
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`${currentPage === totalPages ? "text-gray-600 cursor-not-allowed" : "hover:text-white"}`}
            >
              Next
            </button>
          </div>
        </span>
      </div>

      <TokenAddModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAddTokens} />
    </div>
  );
};

export default Watchlist;
