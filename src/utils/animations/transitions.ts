import { Transition } from "framer-motion";

/**
 * Default smooth transition
 */
export const smoothTransition: Transition = {
  duration: 0.3,
  ease: "easeInOut",
};

/**
 * Spring transition
 */
export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

/**
 * Quick transition
 */
export const quickTransition: Transition = {
  duration: 0.15,
  ease: "easeOut",
};

/**
 * Slow transition
 */
export const slowTransition: Transition = {
  duration: 0.5,
  ease: "easeInOut",
};

/**
 * Bounce transition
 */
export const bounceTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 10,
};

