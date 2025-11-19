"use client";

import { type FC } from "react";
import { motion } from "framer-motion";
import { Home, BarChart3, Users, User, TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { icon: Home, label: "Home", href: "/" },
  { icon: TrendingUp, label: "Analyzer", href: "/analyzer" },
  { icon: BarChart3, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Feed", href: "/feed" },
  { icon: User, label: "Profile", href: "/profile" },
];

export const BottomNav: FC = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const IconComponent = item.icon;

          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1 py-2"
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <IconComponent className="h-6 w-6" />
                </motion.div>
                <span
                  className={`text-xs font-medium ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

