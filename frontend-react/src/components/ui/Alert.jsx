import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

export function Alert({ type = 'info', title, message, onClose, className = '' }) {
  const styles = {
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      textColor: 'text-green-900',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: XCircle,
      iconColor: 'text-red-600',
      textColor: 'text-red-900',
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: AlertCircle,
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-900',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: Info,
      iconColor: 'text-blue-600',
      textColor: 'text-blue-900',
    },
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <div className={`${style.bg} border-2 rounded-xl p-4 ${className} animate-slideInUp`}>
      <div className="flex items-start gap-3">
        <Icon className={`${style.iconColor} shrink-0 mt-0.5`} size={20} />
        <div className="flex-1">
          {title && <h4 className={`font-semibold ${style.textColor} mb-1`}>{title}</h4>}
          <p className={`text-sm ${style.textColor}`}>{message}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className={`${style.iconColor} hover:opacity-70 transition-opacity`}>
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
