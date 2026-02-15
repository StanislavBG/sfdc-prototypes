import { useGreeting } from "@/hooks/use-greeting";
import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";

export default function Home() {
  const { data, isLoading, error } = useGreeting();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Element */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-white shadow-lg shadow-black/5">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <p className="text-muted-foreground font-medium animate-pulse">
                Loading experience...
              </p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8 max-w-md mx-auto shadow-sm">
              <div className="flex flex-col items-center gap-3 text-red-600">
                <AlertCircle className="w-10 h-10" />
                <h3 className="font-display font-semibold text-lg">Unable to connect</h3>
                <p className="text-sm text-red-500/80 text-center text-balance">
                  We couldn't retrieve the greeting message at this time.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-block"
              >
                <span className="px-4 py-1.5 rounded-full bg-white border border-border/50 text-sm font-medium text-muted-foreground shadow-sm">
                  System Status: Online
                </span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground text-balance drop-shadow-sm">
                {data?.message}
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Welcome to your new minimalistic application. Designed with purpose and precision.
              </p>

              <motion.div 
                className="pt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <button 
                  onClick={() => window.location.reload()}
                  className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-xl bg-primary px-8 font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:scale-105 hover:shadow-xl hover:shadow-primary/20 active:scale-95"
                >
                  <span className="mr-2">Refresh Message</span>
                  <Loader2 className="w-4 h-4 transition-transform group-hover:rotate-180" />
                </button>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>

      <footer className="absolute bottom-6 text-center text-sm text-muted-foreground/50 font-medium">
        Engineered for Excellence
      </footer>
    </div>
  );
}
