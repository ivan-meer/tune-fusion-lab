import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';

// Hook for scroll-triggered animations
export const useScrollReveal = () => {
  const [isRevealed, setIsRevealed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isRevealed };
};

// Parallax scroll component
interface ParallaxScrollProps {
  children: React.ReactNode;
  offset?: number;
  speed?: number;
  className?: string;
}

export const ParallaxScroll: React.FC<ParallaxScrollProps> = ({ 
  children, 
  offset = 50, 
  speed = 0.5, 
  className = "" 
}) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, offset * speed]);

  return (
    <motion.div 
      style={{ y }} 
      className={`scroll-parallax ${className}`}
    >
      {children}
    </motion.div>
  );
};

// Smooth count up animation
interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({ 
  end, 
  duration = 2, 
  suffix = "", 
  className = "" 
}) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  const [displayValue, setDisplayValue] = useState(0);
  const { ref, isRevealed } = useScrollReveal();

  useEffect(() => {
    if (isRevealed) {
      const controls = count.set(end);
    }
  }, [isRevealed, count, end]);

  useEffect(() => {
    return rounded.onChange(setDisplayValue);
  }, [rounded]);

  return (
    <span ref={ref} className={className}>
      {displayValue}{suffix}
    </span>
  );
};

// Staggered reveal container
interface StaggeredRevealProps {
  children: React.ReactNode[];
  delay?: number;
  className?: string;
}

export const StaggeredReveal: React.FC<StaggeredRevealProps> = ({ 
  children, 
  delay = 0.1, 
  className = "" 
}) => {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.6, 
            delay: index * delay,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          viewport={{ once: true, amount: 0.3 }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};

// Magnetic hover effect
interface MagneticHoverProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

export const MagneticHover: React.FC<MagneticHoverProps> = ({ 
  children, 
  strength = 20, 
  className = "" 
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    setMousePosition({ x: x * 0.3, y: y * 0.3 });
  };

  return (
    <motion.div
      ref={ref}
      className={`magnetic-hover ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePosition({ x: 0, y: 0 });
      }}
      animate={{
        x: isHovered ? mousePosition.x : 0,
        y: isHovered ? mousePosition.y : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 150,
        damping: 15,
      }}
    >
      {children}
    </motion.div>
  );
};

// Neural network background animation
export const NeuralNetworkBg: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute inset-0 opacity-20">
        {/* Neural nodes */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
        
        {/* Neural connections */}
        <svg className="absolute inset-0 w-full h-full">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.line
              key={i}
              x1={`${Math.random() * 100}%`}
              y1={`${Math.random() * 100}%`}
              x2={`${Math.random() * 100}%`}
              y2={`${Math.random() * 100}%`}
              stroke="hsl(var(--accent))"
              strokeWidth="1"
              opacity="0.3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </svg>
      </div>
    </div>
  );
};