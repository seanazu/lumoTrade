"use client";

import { useState, useRef, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderPlus,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Plus,
  Share2,
} from "lucide-react";
import { useWatchlistStore } from "@/lib/zustand/watchlistStore";
import { WatchlistStockItem } from "./WatchlistStockItem";
import { Button } from "@/components/design-system/atoms/Button";
import { Input } from "@/components/design-system/atoms/Input";
import { ShareButton } from "@/components/modules/share/ShareButton";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export const Watchlist: FC = () => {
  const {
    folders,
    activeFolder,
    setActiveFolder,
    addFolder,
    removeFolder,
    renameFolder,
  } = useWatchlistStore();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["default"])
  );
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const watchlistRef = useRef<HTMLDivElement>(null);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName("");
      setShowNewFolderInput(false);
    }
  };

  const handleRenameFolder = (folderId: string, name: string) => {
    if (name.trim()) {
      renameFolder(folderId, name.trim());
      setEditingFolder(null);
    }
  };

  return (
    <div ref={watchlistRef} className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Watchlist</h2>
          <div className="flex items-center gap-2">
            <ShareButton
              elementRef={watchlistRef}
              filename="my-watchlist"
              twitterText="Check out my watchlist on @LumoTrade 📈"
              className="h-8"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowNewFolderInput(!showNewFolderInput)}
              className="h-8"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {showNewFolderInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 mb-2"
            >
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddFolder();
                  if (e.key === "Escape") setShowNewFolderInput(false);
                }}
                autoFocus
                className="h-8 text-sm"
              />
              <Button size="sm" onClick={handleAddFolder} className="h-8 px-3">
                <Plus className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Folders */}
      <div className="flex-1 overflow-y-auto">
        {folders.map((folder) => {
          const isExpanded = expandedFolders.has(folder.id);
          const isEditing = editingFolder === folder.id;

          return (
            <div key={folder.id} className="border-b border-border/50">
              {/* Folder Header */}
              <div
                className={`flex items-center gap-2 p-3 hover:bg-primary/5 transition-colors cursor-pointer ${
                  activeFolder === folder.id ? "bg-primary/10" : ""
                }`}
                onClick={() => {
                  setActiveFolder(folder.id);
                  toggleFolder(folder.id);
                }}
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </motion.div>

                {isEditing ? (
                  <Input
                    defaultValue={folder.name}
                    onBlur={(e) =>
                      handleRenameFolder(folder.id, e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRenameFolder(
                          folder.id,
                          e.currentTarget.value
                        );
                      }
                      if (e.key === "Escape") setEditingFolder(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="h-6 text-sm flex-1"
                  />
                ) : (
                  <span className="flex-1 text-sm font-semibold">
                    {folder.name}
                  </span>
                )}

                <span className="text-xs text-muted-foreground">
                  {folder.stocks.length}
                </span>

                {folder.id !== "default" && (
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-primary/10 rounded transition-colors"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="min-w-[160px] bg-card rounded-lg border border-border p-1 shadow-lg z-50"
                        sideOffset={5}
                      >
                        <DropdownMenu.Item
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/10 rounded cursor-pointer outline-none"
                          onSelect={(e) => {
                            e.preventDefault();
                            setEditingFolder(folder.id);
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                          Rename
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive rounded cursor-pointer outline-none"
                          onSelect={() => removeFolder(folder.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                )}
              </div>

              {/* Folder Stocks */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {folder.stocks.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No stocks in this folder
                      </div>
                    ) : (
                      <div>
                        {folder.stocks.map((stock) => (
                          <WatchlistStockItem
                            key={stock.id}
                            stock={stock}
                            folderId={folder.id}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

