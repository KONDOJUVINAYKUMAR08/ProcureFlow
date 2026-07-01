import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold text-white tracking-tight">ProcureFlow</h1>
          <p className="text-sm text-neutral-500 mt-1">Loading...</p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
