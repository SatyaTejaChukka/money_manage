import React from 'react';

export function StatsCard({ title, value, icon, trend, color = 'blue', description }) {
  const colorStyles = {
    blue: { gradient: 'from-blue-500 to-blue-600' },
    green: { gradient: 'from-green-500 to-emerald-600' },
    red: { gradient: 'from-red-500 to-pink-600' },
    purple: { gradient: 'from-purple-500 to-indigo-600' },
    yellow: { gradient: 'from-yellow-500 to-orange-600' },
    indigo: { gradient: 'from-indigo-500 to-purple-600' },
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 card-lift border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
          {trend && (
            <div
              className={`inline-flex items-center mt-2 text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <span>{trend.isPositive ? 'up' : 'down'}</span>
              <span className="ml-1">{trend.value}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-linear-to-br ${style.gradient}`}>
          {icon ? React.createElement(icon, { className: 'text-white', size: 24 }) : null}
        </div>
      </div>
    </div>
  );
}

