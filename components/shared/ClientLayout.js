"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { Sidebar } from "@/components/shared/Sidebar";
import { Topbar } from "@/components/shared/Topbar";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function ClientLayout({ children }) {
  const { isPlaying } = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    if (mounted && pathname !== "/" && !isPlaying) router.push("/");
  }, [mounted, pathname, isPlaying, router]);

  if (!mounted) {
    return <div className="bg-[#080c14] w-screen h-screen" />;
  }

  if (isPlaying) {
    return (
      <div className="flex h-screen bg-[#0a0e1a] text-[#e8eaf6] font-inter overflow-hidden selection:bg-[#00c8ff]/30">
        {/* Desktop sidebar — always visible on lg+ */}
        <div className="hidden lg:flex shrink-0">
          <Sidebar />
        </div>

        {/* Mobile sidebar — overlay drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              {/* Drawer */}
              <motion.div
                key="drawer"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-y-0 left-0 z-50 lg:hidden"
              >
                <Sidebar onClose={() => setSidebarOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
          <Topbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 md:p-6 lg:p-8 custom-scrollbar">
            <div className="max-w-[1400px] mx-auto w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, x: 40, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -40, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="w-full"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#080c14] min-h-screen text-white font-inter selection:bg-[#00c8ff]/30 overflow-x-hidden">
      {children}
    </div>
  );
}
