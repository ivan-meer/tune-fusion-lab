import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface AudioVisualizerProps {
  isPlaying?: boolean;
  barCount?: number;
  className?: string;
}

const AudioVisualizer = ({ 
  isPlaying = false, 
  barCount = 20, 
  className = "" 
}: AudioVisualizerProps) => {
  const [bars, setBars] = useState<number[]>([]);

  useEffect(() => {
    setBars(Array.from({ length: barCount }, () => Math.random()));
  }, [barCount]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.random()));
    }, 150);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className={`flex items-end gap-1 h-12 ${className}`}>
      {bars.map((height, index) => (
        <motion.div
          key={index}
          className="bg-gradient-to-t from-primary via-accent to-primary-variant rounded-sm min-h-[4px]"
          style={{ width: '3px' }}
          animate={{
            height: isPlaying ? `${height * 100}%` : '20%',
            opacity: isPlaying ? 1 : 0.5
          }}
          transition={{
            duration: 0.15,
            ease: "easeOut",
            delay: index * 0.01
          }}
        />
      ))}
    </div>
  );
};

export { AudioVisualizer };