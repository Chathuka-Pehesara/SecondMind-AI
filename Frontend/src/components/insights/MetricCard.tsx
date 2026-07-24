import React from 'react';
import { LucideIcon } from 'lucide-react';
import './Insights.css';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  description?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, trend, description }) => {
  return (
    <div className="metric-card">
      <div className="metric-card-header">
        <div className="metric-card-title-group">
          <div className="metric-icon-wrapper">
            <Icon size={20} className="metric-icon" />
          </div>
          <h3 className="metric-title">{title}</h3>
        </div>
      </div>
      <div className="metric-card-content">
        <div className="metric-value">{value}</div>
        {trend && (
          <div className={`metric-trend ${trend.isPositive ? 'trend-up' : 'trend-down'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </div>
        )}
      </div>
      {description && <div className="metric-description">{description}</div>}
    </div>
  );
};
