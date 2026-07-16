"use client";

import { useGameStore } from "@/store/gameStore";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function InboxContainer() {
  const { news: messages = [] } = useGameStore();
  const [selectedMsg, setSelectedMsg] = useState(null);

  useEffect(() => {
    if (messages.length > 0 && !selectedMsg) {
      setSelectedMsg(messages[0]);
    }
  }, [messages, selectedMsg]);

  return (
    <div className="pb-10 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-[32px] font-rajdhani font-bold tracking-wide text-white mb-1">Gelen Kutusu</h2>
        <p className="text-[#8892b0] text-[15px]">Medya, yönetim ve personelden gelen mesajlar</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-[600px]">
        {/* Left Side: Message List */}
        <div className="md:col-span-4 bg-[#141b2d]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-lg overflow-hidden flex flex-col max-h-[700px]">
          <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
            <span className="font-rajdhani font-bold text-lg tracking-wider text-[#e8eaf6] uppercase">Mesajlar ({messages.length})</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            <AnimatePresence>
              {messages.length === 0 ? (
                <div className="text-center py-10 text-[#8892b0]">
                  <div className="text-4xl mb-3 opacity-30 grayscale">📭</div>
                  Mesajınız yok.
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isSelected = selectedMsg === msg;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={idx} 
                      onClick={() => setSelectedMsg(msg)}
                      className={`relative p-4 rounded-xl cursor-pointer transition-all border ${isSelected ? 'border-[#00c8ff]/30 bg-[#00c8ff]/5 shadow-[0_0_15px_rgba(0,200,255,0.1)]' : 'border-transparent hover:bg-white/5'}`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="inbox-active"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-[#00c8ff] rounded-r-full shadow-[0_0_10px_#00c8ff]"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-[10px] text-[#00c8ff] font-bold tracking-widest uppercase truncate">{msg.sender || 'Yönetim'}</div>
                      </div>
                      <div className="text-[14px] font-bold text-white mb-1 leading-tight">{msg.subject}</div>
                      <div className="text-[12px] text-[#8892b0] truncate">{msg.body}</div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Message Content */}
        <div className="md:col-span-8 bg-[#141b2d]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-lg overflow-hidden flex flex-col max-h-[700px]">
          {!selectedMsg ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[#8892b0]">
              <div className="text-6xl mb-4 opacity-30 grayscale">✉️</div>
              <p>Görüntülemek için sol menüden bir mesaj seçin.</p>
            </div>
          ) : (
            <motion.div 
              key={selectedMsg.subject + selectedMsg.body}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <div className="p-8 border-b border-white/5 bg-black/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00c8ff]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <h3 className="text-2xl font-rajdhani font-bold text-white mb-2">{selectedMsg.subject}</h3>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-[#0a0e1a] border border-white/10 flex items-center justify-center text-[10px]">👤</div>
                  <span className="text-[#00c8ff] font-bold tracking-wide uppercase text-xs">{selectedMsg.sender || 'Yönetim'}</span>
                </div>
              </div>
              
              <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                <div className="text-[#e8eaf6] leading-relaxed text-[15px] whitespace-pre-wrap">
                  {selectedMsg.body}
                </div>
              </div>
              
              <div className="p-6 bg-black/20 border-t border-white/5 flex justify-end gap-3">
                <button className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm tracking-wide hover:bg-white/10 transition-colors">Arşivle</button>
                <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00c8ff] to-[#0090b8] text-white font-bold text-sm tracking-wide shadow-[0_0_15px_rgba(0,200,255,0.3)] hover:scale-105 transition-transform">Sil</button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
