import React from 'react';
import { Lightbulb, BookOpen, Target, ArrowRight } from 'lucide-react';
import './Insights.css';

const recommendationsData = [
  {
    id: 1,
    title: 'Review Node.js Fundamentals',
    description: 'Your recent quiz scores in Node.js backend architecture show a 30% gap compared to the required knowledge level. We recommend completing the "Advanced Node" module.',
    icon: Target,
    action: 'Start Module'
  },
  {
    id: 2,
    title: 'Explore React Hooks Deep Dive',
    description: 'You frequently asked about "State Management" and "React Hooks" this week. Here is a curated reading list to solidify your understanding.',
    icon: BookOpen,
    action: 'View List'
  },
  {
    id: 3,
    title: 'Productivity Optimization',
    description: 'Your productivity score peaked on Wednesday but dropped towards the weekend. Try setting focused 25-minute Pomodoro sessions on Friday.',
    icon: Lightbulb,
    action: 'Set Timer'
  }
];

export const RecommendationsPanel: React.FC = () => {
  return (
    <div className="recommendations-panel">
      <div className="chart-header">
        <h3 className="chart-title">AI Recommendations</h3>
        <p className="chart-subtitle">Personalized action items based on your learning patterns</p>
      </div>
      <div className="recommendation-list">
        {recommendationsData.map((rec) => {
          const Icon = rec.icon;
          return (
            <div key={rec.id} className="recommendation-item">
              <div className="rec-icon">
                <Icon size={24} />
              </div>
              <div className="rec-content">
                <h4>{rec.title}</h4>
                <p>{rec.description}</p>
              </div>
              <div className="rec-action">
                <button className="rec-btn">
                  {rec.action} <ArrowRight size={16} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
