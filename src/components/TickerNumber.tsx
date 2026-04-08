import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface TickerNumberProps {
  value: number;
  suffix?: string;
  prefix?: string;
  showDelta?: boolean;
  className?: string;
}

const TickerNumber = ({ value, suffix = "", prefix = "", showDelta = false, className = "" }: TickerNumberProps) => {
  const [display, setDisplay] = useState(value);
  const [delta, setDelta] = useState(0);
  const prevRef = useRef(value);
  const animRef = useRef<number>();

  useEffect(() => {
    const prev = prevRef.current;
    const diff = value - prev;
    if (diff !== 0) {
      setDelta(diff);
      // Smooth animate from prev to value
      const start = prev;
      const duration = 600;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease out quad
        const eased = 1 - (1 - progress) * (1 - progress);
        setDisplay(Math.round(start + diff * eased));
        if (progress < 1) {
          animRef.current = requestAnimationFrame(animate);
        }
      };
      animRef.current = requestAnimationFrame(animate);
      prevRef.current = value;
    }

    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [value]);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="tabular-nums">{prefix}{display.toLocaleString()}{suffix}</span>
      {showDelta && delta > 0 && (
        <AnimatePresence>
          <motion.span
            key={value}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-0.5 text-[10px] text-emerald-500 font-medium"
          >
            <TrendingUp className="w-2.5 h-2.5" />+{delta}
          </motion.span>
        </AnimatePresence>
      )}
    </span>
  );
};

export default TickerNumber;
