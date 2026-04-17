import React from 'react';
import { motion } from 'framer-motion';

const HeroIllustration: React.FC = () => {
  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center overflow-hidden">
      {/* 背景装饰圆 */}
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-96 h-96 rounded-full bg-primary/20"
      />
      <motion.div
        animate={{ 
          scale: [1.1, 1, 1.1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute w-72 h-72 rounded-full bg-secondary/30"
      />
      
      {/* 匹克球拍 */}
      <motion.svg
        width="200"
        height="280"
        viewBox="0 0 200 280"
        className="relative z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {/* 球拍主体 */}
        <motion.ellipse
          cx="100"
          cy="100"
          rx="70"
          ry="85"
          fill="none"
          stroke="#f97316"
          strokeWidth="8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        {/* 球拍网格 */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          {[...Array(6)].map((_, i) => (
            <line
              key={`v${i}`}
              x1={40 + i * 24}
              y1="35"
              x2={40 + i * 24}
              y2="165"
              stroke="#fdba74"
              strokeWidth="2"
            />
          ))}
          {[...Array(7)].map((_, i) => (
            <line
              key={`h${i}`}
              x1="35"
              y1={40 + i * 20}
              x2="165"
              y2={40 + i * 20}
              stroke="#fdba74"
              strokeWidth="2"
            />
          ))}
        </motion.g>
        {/* 球拍手柄 */}
        <motion.rect
          x="85"
          y="175"
          width="30"
          height="80"
          rx="5"
          fill="#1f2937"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          style={{ originY: 0 }}
        />
        {/* 手柄装饰 */}
        <rect x="85" y="190" width="30" height="8" rx="2" fill="#f97316" />
        <rect x="85" y="210" width="30" height="8" rx="2" fill="#f97316" />
      </motion.svg>

      {/* 匹克球 */}
      <motion.svg
        width="60"
        height="60"
        viewBox="0 0 60 60"
        className="absolute z-20"
        style={{ top: '20%', right: '25%' }}
        animate={{ 
          y: [0, -15, 0],
          rotate: [0, 10, 0]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="30" cy="30" r="25" fill="#f97316" />
        <circle cx="30" cy="30" r="20" fill="#fb923c" />
        <circle cx="25" cy="25" r="8" fill="#fdba74" opacity="0.6" />
      </motion.svg>

      {/* 小球2 */}
      <motion.svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        className="absolute z-20"
        style={{ bottom: '30%', left: '20%' }}
        animate={{ 
          y: [0, 10, 0],
          x: [0, 5, 0]
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      >
        <circle cx="20" cy="20" r="15" fill="#fb923c" />
        <circle cx="20" cy="20" r="10" fill="#fdba74" />
      </motion.svg>

      {/* 装饰线条 */}
      <motion.div
        className="absolute bottom-10 left-10 w-20 h-1 bg-primary/30 rounded-full"
        animate={{ scaleX: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-20 right-10 w-16 h-1 bg-secondary/40 rounded-full"
        animate={{ scaleX: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      />
    </div>
  );
};

export default HeroIllustration;
