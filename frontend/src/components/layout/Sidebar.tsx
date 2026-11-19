import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  Send,
  Layers,
  FileCheck2,
  PlayCircle,
  Bug,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { activeProject, activeEnvironment } = useProject();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderGit2 },
    { name: 'API Testing', href: '/request-builder', icon: Send },
    { name: 'Test Suites', href: '/test-suites', icon: Layers },
    { name: 'Test Cases', href: '/test-cases', icon: FileCheck2 },
    { name: 'Test Runs', href: '/test-runs', icon: PlayCircle },
    { name: 'Bug Reports', href: '/bug-reports', icon: Bug },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 select-none z-20 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white shrink-0 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                QualityTrack
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-500 border border-brand-500/20">
                  MVP
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">QA Automation Platform</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Active Project Indicator Card */}
      {!collapsed && activeProject && (
        <div className="px-3 pt-3 pb-1">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Active Context
            </div>
            <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
              {activeProject.name}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>{activeEnvironment?.name || 'Development'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? item.name : undefined}
          >
            <item.icon className="w-4 h-4 shrink-0 transition-colors group-hover:scale-105" />
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer / System Status */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>System Online</span>
            </div>
            <span className="font-mono text-[10px]">v1.0.0</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="System Online"></span>
          </div>
        )}
      </div>
    </aside>
  );
};
