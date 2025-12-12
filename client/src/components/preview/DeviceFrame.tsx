import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DeviceFrameProps {
  children: React.ReactNode;
  type: "mobile" | "tablet" | "desktop";
  scale?: number;
}

export function DeviceFrame({ children, type, scale = 1 }: DeviceFrameProps) {
  const dimensions = {
    mobile: { width: 375, height: 812, radius: 40, bezel: 12 },
    tablet: { width: 768, height: 1024, radius: 24, bezel: 12 },
    desktop: { width: "100%", height: "100%", radius: 8, bezel: 0 },
  };

  const current = dimensions[type];

  if (type === "desktop") {
    return (
      <div className="w-full h-full bg-white rounded-lg shadow-sm border border-border overflow-hidden relative">
        <div className="h-8 bg-muted/30 border-b border-border flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
          </div>
          <div className="flex-1 text-center text-xs text-muted-foreground font-mono opacity-50">desktop-preview</div>
        </div>
        <div className="w-full h-[calc(100%-2rem)] overflow-y-auto custom-scrollbar bg-white">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8 min-h-full">
      <motion.div
        initial={false}
        animate={{
          width: current.width,
          height: current.height,
          borderRadius: current.radius + current.bezel,
        }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        style={{
          boxShadow: "0 0 0 1px rgba(0,0,0,0.1), 0 20px 40px -10px rgba(0,0,0,0.2), 0 0 0 12px #2D3436",
        }}
        className="relative bg-black shrink-0"
      >
        {/* Notch/Camera Area for Mobile */}
        {type === "mobile" && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-[30px] bg-black z-20 rounded-b-2xl flex justify-center items-start pt-2">
            <div className="w-16 h-1 bg-[#1a1a1a] rounded-full" />
          </div>
        )}

        <div
          className="w-full h-full overflow-hidden bg-white relative z-10"
          style={{ borderRadius: current.radius }}
        >
          {/* Status Bar Mockup */}
          <div className="h-11 w-full bg-white/90 backdrop-blur-md absolute top-0 left-0 z-50 flex justify-between items-center px-6 text-[10px] font-semibold text-black/80 select-none">
            <span>9:41</span>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 bg-black/80 rounded-full opacity-20" />
              <div className="w-3 h-3 bg-black/80 rounded-full opacity-20" />
              <div className="w-4 h-2.5 border border-black/30 rounded-[2px]" />
            </div>
          </div>
          
          <div className="w-full h-full pt-11 overflow-y-auto custom-scrollbar">
            {children}
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/20 rounded-full z-50" />
        </div>
      </motion.div>
    </div>
  );
}
