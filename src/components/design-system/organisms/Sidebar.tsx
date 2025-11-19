"use client";

import { type ReactNode, type FC } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
}

const Sidebar: FC<SidebarProps> = ({ isOpen, onClose, children }) => {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 bottom-0 z-40 w-80 bg-background border-r border-border transition-transform duration-300",
          "lg:relative lg:top-0 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile close button */}
          <div className="lg:hidden p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Menu</h2>
            <motion.button
              onClick={onClose}
              className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-5 w-5" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {children || (
              <div className="flex items-center justify-center h-full text-center text-muted-foreground p-4">
                <p className="text-sm">No content</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export { Sidebar };

