import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import './Insights.css';

// Mock Data
const learningProgressData = [
  { name: 'Mon', score: 65, avg: 50 },
  { name: 'Tue', score: 72, avg: 52 },
  { name: 'Wed', score: 85, avg: 55 },
  { name: 'Thu', score: 78, avg: 58 },
  { name: 'Fri', score: 90, avg: 60 },
  { name: 'Sat', score: 95, avg: 62 },
  { name: 'Sun', score: 100, avg: 65 },
];

const knowledgeGapsData = [
  { subject: 'React Hooks', user: 40, required: 90 },
  { subject: 'TypeScript', user: 60, required: 85 },
  { subject: 'CSS Grid', user: 80, required: 75 },
  { subject: 'Node.js', user: 30, required: 80 },
  { subject: 'GraphQL', user: 50, required: 70 },
];

const topicsData = [
  { name: 'State Mgmt', count: 45 },
  { name: 'API Routes', count: 32 },
  { name: 'Auth', count: 28 },
  { name: 'Deployment', count: 20 },
  { name: 'Testing', count: 15 },
];

export const LearningProgressChart: React.FC = () => {
  return (
    <div className="chart-panel">
      <div className="chart-header">
        <h3 className="chart-title">Learning Progress</h3>
        <p className="chart-subtitle">Your knowledge acquisition over the week</p>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={learningProgressData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Area type="monotone" dataKey="score" stroke="#a78bfa" fillOpacity={1} fill="url(#colorScore)" name="Your Score" />
            <Area type="monotone" dataKey="avg" stroke="#64748b" fillOpacity={0} strokeDasharray="5 5" name="Class Average" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const KnowledgeGapsChart: React.FC = () => {
  return (
    <div className="chart-panel">
      <div className="chart-header">
        <h3 className="chart-title">Knowledge Gaps</h3>
        <p className="chart-subtitle">Areas needing improvement vs expectations</p>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={knowledgeGapsData}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="Your Knowledge" dataKey="user" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.5} />
            <Radar name="Required" dataKey="required" stroke="#f472b6" fill="#f472b6" fillOpacity={0.2} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const FrequentlyAskedTopicsChart: React.FC = () => {
  return (
    <div className="chart-panel">
      <div className="chart-header">
        <h3 className="chart-title">Frequently Asked Topics</h3>
        <p className="chart-subtitle">What you've been asking AI the most</p>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={topicsData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={true} vertical={false} />
            <XAxis type="number" stroke="#94a3b8" />
            <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <Tooltip 
              cursor={{fill: 'rgba(255,255,255,0.05)'}}
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
            />
            <Bar dataKey="count" fill="#34d399" radius={[0, 4, 4, 0]} name="Queries" barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
