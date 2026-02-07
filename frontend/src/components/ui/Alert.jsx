import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

export function Alert({ type = 'info', title, message, onClose, className = '' }) {
  const styles = {
    success: {
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
      textColor: 'text-emerald-300',
      titleColor: 'text-emerald-200',
    },
    error: {
      bg: 'bg-red-500/10 border-red-500/30',
      icon: XCircle,
      iconColor: 'text-red-400',
      textColor: 'text-red-300',
      titleColor: 'text-red-200',
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/30',
      icon: AlertCircle,
      iconColor: 'text-amber-400',
      textColor: 'text-amber-300',
      titleColor: 'text-amber-200',
    },
    info: {
      bg: 'bg-blue-500/10 border-blue-500/30',
      icon: Info,
      iconColor: 'text-blue-400',
      textColor: 'text-blue-300',
      titleColor: 'text-blue-200',
    },
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <div className={`${style.bg} border rounded-xl p-4 backdrop-blur-sm ${className} animate-fade-in`}>
      <div className="flex items-start gap-3">
        <Icon className={`${style.iconColor} shrink-0 mt-0.5`} size={20} />
        <div className="flex-1">
          {title && <h4 className={`font-semibold ${style.titleColor} mb-1`}>{title}</h4>}
          <p className={`text-sm ${style.textColor}`}>{message}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
