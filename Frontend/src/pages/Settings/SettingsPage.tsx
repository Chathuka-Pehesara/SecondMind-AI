import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Cpu, 
  Database, 
  Check, 
  Lock,
  Globe,
  Trash2
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';

type ActiveTab = 'general' | 'engine' | 'storage';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('general');
  const [autosave, setAutosave] = useState(true);
  const [devMode, setDevMode] = useState(false);
  const [gpuAccel, setGpuAccel] = useState(true);
  const [model, setModel] = useState('llama-3-8b');
  const [syncCloud, setSyncCloud] = useState(false);

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'engine', name: 'Cognitive Engine', icon: Cpu },
    { id: 'storage', name: 'Storage & Encryption', icon: Database },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Page Title & Desc */}
      <div className="space-y-1">
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          Manage your SecondMind application parameters and local database instances.
        </p>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-slate-200/40 dark:border-white/5 pb-px gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
                isActive 
                  ? 'text-brand-600 dark:text-brand-400' 
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100/50 dark:hover:bg-zinc-800/10'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-settings-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 dark:bg-brand-400"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Settings Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Card */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'general' && (
            <GlassCard className="p-6 space-y-6">
              <div className="space-y-1 border-b border-slate-200/40 dark:border-white/5 pb-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Workspace Configuration</h3>
                <p className="text-[10px] text-slate-500 dark:text-zinc-450">Configure basic application settings and username details.</p>
              </div>

              {/* Text Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Display Name</label>
                  <input
                    type="text"
                    defaultValue="John Doe"
                    className="w-full px-3.5 py-2 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl focus:outline-none focus:border-brand-500/50 dark:focus:border-brand-400/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all text-slate-800 dark:text-zinc-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Primary Email</label>
                  <input
                    type="email"
                    defaultValue="john@secondmind.ai"
                    className="w-full px-3.5 py-2 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl focus:outline-none focus:border-brand-500/50 dark:focus:border-brand-400/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all text-slate-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 pr-4">
                    <h4 className="text-xs font-semibold text-slate-850 dark:text-zinc-200">Autosave changes</h4>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-450 leading-relaxed">Save updates to the browser local state immediately.</p>
                  </div>
                  <Toggle active={autosave} onToggle={() => setAutosave(!autosave)} />
                </div>

                <div className="flex items-center justify-between border-t border-slate-200/40 dark:border-white/5 pt-4">
                  <div className="space-y-0.5 pr-4">
                    <h4 className="text-xs font-semibold text-slate-850 dark:text-zinc-200">Developer diagnostics</h4>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-450 leading-relaxed">Output processing metrics and latency metrics into the console.</p>
                  </div>
                  <Toggle active={devMode} onToggle={() => setDevMode(!devMode)} />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200/40 dark:border-white/5">
                <Button variant="primary" size="sm">
                  <Check className="w-4 h-4" />
                  <span>Save General Settings</span>
                </Button>
              </div>
            </GlassCard>
          )}

          {activeTab === 'engine' && (
            <GlassCard className="p-6 space-y-6">
              <div className="space-y-1 border-b border-slate-200/40 dark:border-white/5 pb-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Local Cognition Settings</h3>
                <p className="text-[10px] text-slate-500 dark:text-zinc-455">Select default models and connection thresholds for conceptual indexing.</p>
              </div>

              {/* Selection field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Target Language Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl focus:outline-none focus:border-brand-500/50 dark:focus:border-brand-400/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all text-slate-800 dark:text-zinc-200 cursor-pointer"
                >
                  <option value="llama-3-8b">Llama 3 (8B, Local Instance)</option>
                  <option value="mistral-7b">Mistral (7B, Local Instance)</option>
                  <option value="phi-3-mini">Phi-3 Mini (3.8B, Lightweight)</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 pr-4">
                    <h4 className="text-xs font-semibold text-slate-850 dark:text-zinc-200">Hardware Acceleration</h4>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-450 leading-relaxed">Leverage GPU core instances (WebGPU) to run embedding maps.</p>
                  </div>
                  <Toggle active={gpuAccel} onToggle={() => setGpuAccel(!gpuAccel)} />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200/40 dark:border-white/5">
                <Button variant="primary" size="sm">
                  <Check className="w-4 h-4" />
                  <span>Update Engine Options</span>
                </Button>
              </div>
            </GlassCard>
          )}

          {activeTab === 'storage' && (
            <GlassCard className="p-6 space-y-6">
              <div className="space-y-1 border-b border-slate-200/40 dark:border-white/5 pb-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Database Vault</h3>
                <p className="text-[10px] text-slate-500 dark:text-zinc-455">Maintain indexes or configure secondary browser-sync layers.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 pr-4">
                    <h4 className="text-xs font-semibold text-slate-850 dark:text-zinc-200">Browser cloud backup</h4>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-455 leading-relaxed">Save an encrypted replica blob to your secure iCloud/Drive sandbox.</p>
                  </div>
                  <Toggle active={syncCloud} onToggle={() => setSyncCloud(!syncCloud)} />
                </div>
              </div>

              {/* Destructive Action */}
              <div className="border-t border-red-500/20 dark:border-red-500/10 pt-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-red-500/5 dark:bg-red-500/2 p-4 rounded-2xl border border-red-500/15">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-red-650 dark:text-red-400 flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4" />
                      Danger: Clear Vault Database
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-450 leading-relaxed">
                      Permanently wipe all local notes, associations, and memory graphs. This cannot be undone.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="border-red-550/30 text-red-550 dark:border-red-500/30 dark:text-red-400 hover:bg-red-500/10 flex-shrink-0">
                    Purge Database
                  </Button>
                </div>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Sidebar Status Info Card */}
        <div className="space-y-4">
          <GlassCard className="p-5 space-y-4">
            <h4 className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Vault Status</h4>
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-white/5 pb-2">
                <span className="text-slate-500 dark:text-zinc-450">Active DB Type</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-250 flex items-center gap-1 font-mono">
                  <Database className="w-3.5 h-3.5 text-brand-500" />
                  IndexedDB
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-white/5 pb-2">
                <span className="text-slate-500 dark:text-zinc-450">Stored Blobs</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-250">142 nodes</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-white/5 pb-2">
                <span className="text-slate-500 dark:text-zinc-450">Disk Used</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-250">1.4 MB</span>
              </div>
              <div className="flex items-center justify-between pb-1">
                <span className="text-slate-500 dark:text-zinc-450">Encryption Strategy</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-250 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  AES-GCM (Local)
                </span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20 flex-shrink-0">
              <Globe className="w-4.5 h-4.5" />
            </div>
            <div>
              <h5 className="text-[11px] font-semibold text-slate-800 dark:text-zinc-200">SecondMind Host Node</h5>
              <p className="text-[9px] text-slate-500 dark:text-zinc-455 mt-0.5 leading-relaxed">
                App version 0.1.0-alpha. Local loopback client is active on port 5173.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

// Reusable animated Toggle Switch component using framer-motion
interface ToggleProps {
  active: boolean;
  onToggle: () => void;
}

const Toggle: React.FC<ToggleProps> = ({ active, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full flex items-center p-0.5 transition-colors cursor-pointer border focus:outline-none ${
        active 
          ? 'bg-brand-600 border-brand-600/30' 
          : 'bg-slate-200 border-slate-300 dark:bg-zinc-800 dark:border-zinc-700/60'
      }`}
    >
      <motion.div
        layout
        className="w-4.5 h-4.5 rounded-full bg-white shadow-md"
        animate={{ x: active ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
};
