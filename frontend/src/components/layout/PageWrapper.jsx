import React from 'react';
import { motion } from 'framer-motion';

export default function PageWrapper({ children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`max-w-6xl mx-auto space-y-8 ${className}`}
    >
      {children}
    </motion.div>
  );
}
