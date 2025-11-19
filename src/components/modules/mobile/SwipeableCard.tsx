"use client";

import { type ReactNode, type FC } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Trash2, Bell } from "lucide-react";

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon: ReactNode;
    label: string;
    color: string;
  };
  rightAction?: {
    icon: ReactNode;
    label: string;
    color: string;
  };
}

export const SwipeableCard: FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = {
    icon: <Trash2 className="h-5 w-5" />,
    label: "Delete",
    color: "bg-red-500",
  },
  rightAction = {
    icon: <Bell className="h-5 w-5" />,
    label: "Alert",
    color: "bg-primary",
  },
}) => {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-150, -75, 0, 75, 150], [1, 1, 0, 1, 1]);
  const leftActionOpacity = useTransform(x, [-150, -75, 0], [1, 0.5, 0]);
  const rightActionOpacity = useTransform(x, [0, 75, 150], [0, 0.5, 1]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;

    if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft();
      x.set(0);
    } else if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight();
      x.set(0);
    } else {
      x.set(0);
    }
  };

  return (
    <div className="relative overflow-hidden touch-pan-y">
      {/* Left Action Background */}
      <motion.div
        style={{ opacity: leftActionOpacity }}
        className={`absolute inset-y-0 left-0 flex items-center justify-start px-6 ${leftAction.color} text-white`}
      >
        {leftAction.icon}
        <span className="ml-2 font-semibold">{leftAction.label}</span>
      </motion.div>

      {/* Right Action Background */}
      <motion.div
        style={{ opacity: rightActionOpacity }}
        className={`absolute inset-y-0 right-0 flex items-center justify-end px-6 ${rightAction.color} text-white`}
      >
        <span className="mr-2 font-semibold">{rightAction.label}</span>
        {rightAction.icon}
      </motion.div>

      {/* Swipeable Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 150 }}
        dragElastic={0.2}
        style={{ x }}
        onDragEnd={handleDragEnd}
        className="relative z-10 bg-background"
      >
        {children}
      </motion.div>
    </div>
  );
};

