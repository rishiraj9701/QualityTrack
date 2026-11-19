import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Sun,
  Moon,
  FolderGit2,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';
import axios from 'axios';

export const TopNav: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { projects, activeProject, activeEnvironment, setActiveProjectById, setActiveEnvironmentByName } =
    useProject();
  const location = useLocation();

  const [demoApiHealthy, setDemoApiHealthy] = useState<boolean | null>(null);

  // Check Demo API health periodically
  useEffect(() => {
    const checkDemoHealth = async () => {
      try {
        // Probe via backend proxy to avoid direct localhost cross-port issues if any
        const res = await axios.get('/api/health');
        if (res.status === 200) {
          setDemoApiHealthy(true);
        } else {
          setDemoApiHealthy(false);
        }
      } catch {
        setDemoApiHealthy(false);
      }
    };

    checkDemoHealth();
    const interval = setInterval(checkDemoHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Format page title from pathname
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
        return 'Dashboard & Metrics';
      case '/projects':
        return 'Project & Environment Management';
      case '/request-builder':
        return 'API Request Builder';
      case '/test-suites':
        return 'Test Suites';
      case '/test-cases':
        return 'Test Case Repository';
      case '/test-runs':
        return 'Test Execution Runs';
      case '/bug-reports':
        return 'Defect & Bug Tracking';
      case '/reports':
        return 'QA Analytics & Reports';
      case '/settings':
        return 'Settings & Environments';
      default:
        if (path.startsWith('/test-runs/')) return 'Test Execution Run Details';
        return 'QualityTrack';
    }
  };

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between z-10 sticky top-0">
      {/* Left: Breadcrumbs & Page Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {getPageTitle(location.pathname)}
        </h1>
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
          <Activity className="w-3 h-3 text-brand-500" />
          <span>QA Testing Platform</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Project Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/60">
          <FolderGit2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <select
            value={activeProject?.id || ''}
            onChange={(e) => setActiveProjectById(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Environment Selector */}
        {activeProject?.environments && activeProject.environments.length > 0 && (
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/60">
            <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <select
              value={activeEnvironment?.name || 'Development'}
              onChange={(e) => setActiveEnvironmentByName(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {activeProject.environments.map((env) => (
                <option key={env.id} value={env.name} className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {env.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Target API Status Pill */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition"
          title="Status of backend & testing target service"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              demoApiHealthy === true
                ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                : demoApiHealthy === false
                ? 'bg-rose-500 ring-2 ring-rose-500/20'
                : 'bg-amber-500 animate-pulse'
            }`}
          />
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
            Target API: {demoApiHealthy ? 'Online' : 'Checking'}
          </span>
        </div>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 transition"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
            RK
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              Rishi Kumar
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-brand-400" /> QA Engineer
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
