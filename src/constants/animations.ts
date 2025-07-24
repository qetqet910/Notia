import { Variants } from 'framer-motion';

const easeOutCubic = [0.25, 0.46, 0.45, 0.94];

export const animations: Record<string, Variants> = {
  card: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: easeOutCubic },
    },
  },
  tabContent: {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: easeOutCubic },
    },
    exit: {
      opacity: 0,
      x: 10,
      transition: { duration: 0.2, ease: easeOutCubic },
    },
  },
  stagger: {
    visible: {
      transition: { staggerChildren: 0.1 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: easeOutCubic },
    },
  },
};
