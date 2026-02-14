import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export function Tabs({ tabs, defaultTab, onChange, children }) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex p-1 bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 w-full sm:w-fit overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
           const isActive = activeTab === tab.id;
           return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 sm:px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 z-10 whitespace-nowrap shrink-0",
                isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              {isActive && (
                <div
                  className="absolute inset-0 bg-zinc-800 rounded-xl shadow-lg border border-white/5"
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
      <div className="animate-fade-in relative">
        {children(activeTab)}
      </div>
    </div>
  );
}
