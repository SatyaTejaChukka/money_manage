import React, { Fragment } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg max-h-[90vh] bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/5 shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
