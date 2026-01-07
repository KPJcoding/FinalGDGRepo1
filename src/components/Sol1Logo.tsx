import { motion } from "framer-motion";
import sol1OfficialLogo from "@/assets/sol1-official-logo.jpg";

interface Sol1LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  showTagline?: boolean;
  className?: string;
}

export function Sol1Logo({ size = "md", animated = true, showTagline = false, className = "" }: Sol1LogoProps) {
  const sizes = {
    sm: { width: 40, height: 40 },
    md: { width: 56, height: 56 },
    lg: { width: 80, height: 80 },
    xl: { width: 180, height: 180 },
  };

  const { width, height } = sizes[size];

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <motion.div
        className="relative"
        whileHover={animated ? { scale: 1.05 } : undefined}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {/* Glow effect */}
        {animated && (
          <motion.div
            className="absolute inset-0 rounded-2xl blur-xl"
            style={{ 
              background: 'linear-gradient(135deg, hsl(187 94% 43% / 0.3), hsl(200 85% 40% / 0.2))'
            }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3] 
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        
        <motion.img
          src={sol1OfficialLogo}
          alt="SOL-1 Logo"
          width={width}
          height={height}
          className="relative z-10 rounded-xl object-contain"
          initial={animated ? { opacity: 0, scale: 0.9 } : undefined}
          animate={animated ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </motion.div>

      {/* Tagline */}
      {showTagline && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="text-center"
        >
          <p className="text-sm md:text-base font-medium text-primary-foreground/90 max-w-xs leading-tight">
            One Stop Solution for Every
          </p>
          <p className="text-sm md:text-base font-bold text-sol-cyan">
            IIIT Nagpur Student Problem
          </p>
        </motion.div>
      )}
    </div>
  );
}
