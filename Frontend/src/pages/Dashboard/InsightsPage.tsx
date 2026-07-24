import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Brain, Calendar, Zap } from 'lucide-react';
import { MetricCard } from '../../components/insights/MetricCard';
import { LearningProgressChart, KnowledgeGapsChart, FrequentlyAskedTopicsChart } from '../../components/insights/InsightsCharts';
import { RecommendationsPanel } from '../../components/insights/RecommendationsPanel';
import '../../components/insights/Insights.css';

export const InsightsPage: React.FC = () => {
  return (
    <div className="insights-container">
      <motion.div 
        className="insights-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>AI Insights & Analytics</h1>
        <p>Your personalized learning journey and performance metrics.</p>
      </motion.div>

      <motion.div 
        className="metrics-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <MetricCard 
          title="Productivity Score" 
          value="87/100" 
          icon={Zap} 
          trend={{ value: '+5%', isPositive: true }}
          description="Based on focus time and task completion"
        />
        <MetricCard 
          title="Weekly Report" 
          value="Excellent" 
          icon={Calendar} 
          trend={{ value: 'Steady', isPositive: true }}
          description="You maintained a 5-day streak this week"
        />
        <MetricCard 
          title="Concepts Mastered" 
          value="12" 
          icon={Brain} 
          trend={{ value: '+3', isPositive: true }}
          description="New concepts learned this week"
        />
        <MetricCard 
          title="Study Hours" 
          value="18.5h" 
          icon={Activity} 
          trend={{ value: '-2h', isPositive: false }}
          description="Compared to last week's 20.5h"
        />
      </motion.div>

      <motion.div 
        className="charts-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <LearningProgressChart />
        <KnowledgeGapsChart />
        <FrequentlyAskedTopicsChart />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <RecommendationsPanel />
      </motion.div>
    </div>
  );
};
