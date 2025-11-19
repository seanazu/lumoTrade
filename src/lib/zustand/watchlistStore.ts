import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WatchlistFolder, WatchlistStock, ColorFlag } from "@/types/watchlist";

interface WatchlistState {
  folders: WatchlistFolder[];
  activeFolder: string | null;
  
  // Folder actions
  addFolder: (name: string) => void;
  removeFolder: (folderId: string) => void;
  renameFolder: (folderId: string, name: string) => void;
  setActiveFolder: (folderId: string | null) => void;
  reorderFolders: (fromIndex: number, toIndex: number) => void;
  
  // Stock actions
  addStockToFolder: (folderId: string, stock: Omit<WatchlistStock, "id" | "addedAt">) => void;
  removeStockFromFolder: (folderId: string, stockId: string) => void;
  moveStock: (stockId: string, fromFolderId: string, toFolderId: string) => void;
  updateStockFlag: (folderId: string, stockId: string, colorFlag: ColorFlag) => void;
  updateStockNotes: (folderId: string, stockId: string, notes: string) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set) => ({
      folders: [
        {
          id: "default",
          name: "My Watchlist",
          stocks: [
            {
              id: "stock-example-1",
              symbol: "AAPL",
              name: "Apple Inc.",
              price: 178.25,
              change: 2.15,
              changePercent: 1.22,
              colorFlag: "green",
              addedAt: Date.now() - 86400000,
            },
            {
              id: "stock-example-2",
              symbol: "TSLA",
              name: "Tesla Inc.",
              price: 242.84,
              change: -3.21,
              changePercent: -1.30,
              colorFlag: "red",
              addedAt: Date.now() - 172800000,
            },
            {
              id: "stock-example-3",
              symbol: "NVDA",
              name: "NVIDIA Corporation",
              price: 495.22,
              change: 8.45,
              changePercent: 1.74,
              colorFlag: "blue",
              addedAt: Date.now() - 259200000,
            },
          ],
          createdAt: Date.now(),
          order: 0,
        },
      ],
      activeFolder: "default",

      addFolder: (name) =>
        set((state) => {
          const newFolder: WatchlistFolder = {
            id: `folder-${Date.now()}`,
            name,
            stocks: [],
            createdAt: Date.now(),
            order: state.folders.length,
          };
          return { folders: [...state.folders, newFolder] };
        }),

      removeFolder: (folderId) =>
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== folderId),
          activeFolder: state.activeFolder === folderId ? state.folders[0]?.id || null : state.activeFolder,
        })),

      renameFolder: (folderId, name) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === folderId ? { ...f, name } : f
          ),
        })),

      setActiveFolder: (folderId) => set({ activeFolder: folderId }),

      reorderFolders: (fromIndex, toIndex) =>
        set((state) => {
          const newFolders = [...state.folders];
          const [removed] = newFolders.splice(fromIndex, 1);
          newFolders.splice(toIndex, 0, removed);
          return {
            folders: newFolders.map((f, i) => ({ ...f, order: i })),
          };
        }),

      addStockToFolder: (folderId, stock) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === folderId
              ? {
                  ...f,
                  stocks: [
                    ...f.stocks,
                    {
                      ...stock,
                      id: `stock-${Date.now()}`,
                      addedAt: Date.now(),
                    },
                  ],
                }
              : f
          ),
        })),

      removeStockFromFolder: (folderId, stockId) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === folderId
              ? {
                  ...f,
                  stocks: f.stocks.filter((s) => s.id !== stockId),
                }
              : f
          ),
        })),

      moveStock: (stockId, fromFolderId, toFolderId) =>
        set((state) => {
          const fromFolder = state.folders.find((f) => f.id === fromFolderId);
          const stock = fromFolder?.stocks.find((s) => s.id === stockId);
          
          if (!stock) return state;

          return {
            folders: state.folders.map((f) => {
              if (f.id === fromFolderId) {
                return {
                  ...f,
                  stocks: f.stocks.filter((s) => s.id !== stockId),
                };
              }
              if (f.id === toFolderId) {
                return {
                  ...f,
                  stocks: [...f.stocks, stock],
                };
              }
              return f;
            }),
          };
        }),

      updateStockFlag: (folderId, stockId, colorFlag) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === folderId
              ? {
                  ...f,
                  stocks: f.stocks.map((s) =>
                    s.id === stockId ? { ...s, colorFlag } : s
                  ),
                }
              : f
          ),
        })),

      updateStockNotes: (folderId, stockId, notes) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === folderId
              ? {
                  ...f,
                  stocks: f.stocks.map((s) =>
                    s.id === stockId ? { ...s, notes } : s
                  ),
                }
              : f
          ),
        })),
    }),
    {
      name: "lumo-watchlist-storage",
    }
  )
);

