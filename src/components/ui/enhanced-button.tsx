import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface EnhancedButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragEnd' | 'onDragStart' | 'onAnimationStart' | 'onAnimationEnd'> {
  variant?: "primary" | "secondary" | "accent" | "neon" | "glass";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  withGlow?: boolean;
  magnetic?: boolean;
  asChild?: boolean;
}

const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    className, 
    variant = "primary", 
    size = "md", 
    isLoading = false, 
    withGlow = false,
    magnetic = false,
    asChild = false,
    children, 
    ...props 
  }, ref) => {
    const baseClasses = "relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none overflow-hidden";
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      accent: "bg-accent text-accent-foreground hover:bg-accent/90",
      neon: "neon-border bg-transparent text-accent hover:bg-accent/10",
      glass: "glassmorphism text-foreground hover:bg-card/60"
    };

    const sizes = {
      sm: "h-9 px-3 text-sm",
      md: "h-11 px-6 py-2",
      lg: "h-12 px-8 text-lg"
    };

    const glowClasses = withGlow ? "glow-primary hover:glow-intense" : "";
    const magneticClasses = magnetic ? "magnetic-hover" : "";

    if (asChild) {
      return (
        <motion.div
          className={cn(
            baseClasses,
            variants[variant],
            sizes[size],
            glowClasses,
            magneticClasses,
            className
          )}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
        >
          {/* Background animation */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-0"
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Content */}
          <span className="relative z-10">{children}</span>
          
          {/* Ripple effect */}
          <motion.div
            className="absolute inset-0 rounded-lg bg-foreground/10 scale-0"
            whileTap={{ scale: 1 }}
            transition={{ duration: 0.1 }}
          />
        </motion.div>
      );
    }

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          glowClasses,
          magneticClasses,
          className
        )}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
        {...props}
      >
        {/* Background animation */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-0"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Loading spinner */}
        {isLoading && (
          <motion.div
            className="loading-spinner mr-2"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
        
        {/* Content */}
        <span className="relative z-10">{children}</span>
        
        {/* Ripple effect */}
        <motion.div
          className="absolute inset-0 rounded-lg bg-foreground/10 scale-0"
          whileTap={{ scale: 1 }}
          transition={{ duration: 0.1 }}
        />
      </motion.button>
    );
  }
);

EnhancedButton.displayName = "EnhancedButton";

export { EnhancedButton };