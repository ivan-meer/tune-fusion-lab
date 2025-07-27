import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { HTMLAttributes, ReactNode } from "react";

interface AnimatedCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragEnd' | 'onDragStart' | 'onAnimationStart' | 'onAnimationEnd'> {
  variant?: "default" | "glass" | "neon" | "floating";
  hover3d?: boolean;
  glowEffect?: boolean;
  children: ReactNode;
}

const AnimatedCard = ({ 
  className, 
  variant = "default", 
  hover3d = false,
  glowEffect = false,
  children, 
  ...props 
}: AnimatedCardProps) => {
  const baseClasses = "rounded-lg border bg-card text-card-foreground transition-all duration-300";
  
  const variants = {
    default: "shadow-lg hover:shadow-xl",
    glass: "glassmorphism",
    neon: "neon-border",
    floating: "shadow-floating hover:shadow-deep"
  };

  const hover3dClasses = hover3d ? "card-3d transform-3d" : "";
  const glowClasses = glowEffect ? "glow-soft hover:glow-primary" : "";

  return (
    <motion.div
      className={cn(
        baseClasses,
        variants[variant],
        hover3dClasses,
        glowClasses,
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        scale: hover3d ? 1 : 1.02,
        y: -4
      }}
      transition={{
        type: "spring" as const,
        stiffness: 300,
        damping: 20
      }}
      {...props}
    >
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-lg opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export { AnimatedCard };