"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoListOutline } from "react-icons/io5";
import type { Product } from "../../../components/products/types";

interface ProductDetailsProps {
  description?: string;
  specs?: Product["specs"];
  gallery?: Product["gallery"];
  specifications?: Product["specifications"];
  rating?: Product["rating"];
  reviews?: Product["reviews"];
}

const TABS = [
  { key: "specs", label: "المواصفات", icon: <IoListOutline size={15} /> },
];

export default function ProductDetails({ description, specifications }: ProductDetailsProps) {
  const [active, setActive] = useState("specs");

  return (
    <div className="mt-12 border-t pt-10" style={{ borderColor: "var(--color-1)" }}>
      {/* Tab Bar */}
      <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border"
            style={active === tab.key
              ? { background: "linear-gradient(to-r, from-[#02B9FA], to-[#005AAD])", color: "#fff", borderColor: "#02B9FA" }
              : { color: "#60758E", borderColor: "#02B9FA", background: "#F6F8FC" }
            }
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* Specs */}
          {active === "specs" && (
            <div>
              {specifications && specifications.length > 0 ? (
                <div className="space-y-4">
                  {specifications.map((group, gi) => (
                    <div key={gi} className="rounded-2xl overflow-hidden border border-gray-100">
                      <div className="px-4 py-2.5 border-b" style={{ borderColor: "#02B9FA", background: "linear-gradient(135deg, rgba(2,211,255,0.08), rgba(0,90,173,0.08))" }}>
                        <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: "#01226B" }}>{group.groupName}</h3>
                      </div>
                      <div className="bg-white">
                        {group.items.map((item, ii) => (
                          <div
                            key={ii}
                            className={`flex items-center justify-between px-4 py-3 ${ii < group.items.length - 1 ? "border-b" : ""}`}
                            style={ii < group.items.length - 1 ? { borderColor: "var(--color-1)" } : {}}
                          >
                            <span className="text-xs" style={{ color: "#60758E" }}>{item.label}</span>
                            <span className="text-xs font-bold" style={{ color: "#01226B" }}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">لا توجد مواصفات متاحة.</p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
