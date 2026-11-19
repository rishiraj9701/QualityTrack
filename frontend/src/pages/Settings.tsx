import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  RotateCcw,
  CheckCircle2,
  Server,
  Database,
  ShieldCheck,
  Code2,
  ExternalLink,
  Layers,
} from 'lucide-react';
import axios from 'axios';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';

export const Settings: React.FC = () => {
  const { activeProject, activeEnvironment } = useProject();
  const { success, error, info } = useToast();

  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleResetDemoData = async () => {
    try {
      setResetting(true);
      // Reset demo target through demo api port 5001 directly or proxy
      const res = await axios.post('http://localhost:5001/api/users/reset');
      if (res.data.success) {
        success('Demo target API user store successfully restored to initial clean state!');
        setResetMessage(`Reset completed: ${res.data.userCount} default demo users seeded.`);
      }
    } catch (err: any) {
      // Fallback via proxy if direct cross-origin is blocked
      try {
        const proxyRes = await axios.post('/api/proxy/send', {
          method: 'POST',
          url: 'http://localhost:5001/api/users/reset',
        });
        if (proxyRes.data.statusCode === 200) {
          success('Demo target API restored to initial clean state via backend proxy!');
          setResetMessage('Reset completed via backend proxy.');
          return;
        }
      } catch {}
      error('Failed to reset demo data. Ensure Demo API is active on port 5001.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-brand-500" />
          Settings & Environment Infrastructure
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure backend targets, database connections, reset demo datasets, and verify QA platform readiness.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demo Target API Management Card */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Simulated User Management REST API
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Isolated target service running on Port 5001 for QA test validation
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            The Demo API implements realistic contract constraints including email validation regex, duplicate rejection (409 Conflict), required fields, string length boundaries (&gt;100 chars), and password length minimums.
          </p>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 text-xs font-mono space-y-1">
            <div className="text-slate-400 text-[11px]">Active Target URL:</div>
            <div className="text-emerald-500 font-bold">http://localhost:5001/api/users</div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={handleResetDemoData}
              disabled={resetting}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-brand-400 ${resetting ? 'animate-spin' : ''}`} />
              <span>Reset Demo Target Data</span>
            </button>

            {resetMessage && (
              <span className="text-[11px] text-emerald-500 font-medium">
                {resetMessage}
              </span>
            )}
          </div>
        </div>

        {/* Database & Prisma Architecture Card */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Database & Prisma ORM Persistence
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PostgreSQL-compatible relational schema with SQLite local zero-config fallback
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            All projects, test suites, test cases, assertion evaluations, test runs, and bug reports are stored in a fully normalized relational database using Prisma ORM.
          </p>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 text-xs font-mono space-y-1">
            <div className="text-slate-400 text-[11px]">Database Engine:</div>
            <div className="text-brand-500 font-bold">Prisma ORM with SQLite (dev.db) / PostgreSQL schema included</div>
          </div>

          <div className="pt-2 text-xs text-slate-500">
            To switch to a local or hosted PostgreSQL instance, supply `DATABASE_URL` in `backend/.env` and copy `schema.postgresql.prisma`.
          </div>
        </div>
      </div>

      {/* Quality Assurance Platform Capabilities Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-brand-950 text-white shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-400" />
          <h3 className="text-sm font-bold tracking-tight">
            Quality Assurance Platform Capabilities
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-bold text-brand-300">1. Real-World API Testing</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Demonstrates practical understanding of REST methods (GET, POST, PUT, PATCH, DELETE), status codes, payloads, and boundary limits.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-bold text-brand-300">2. Automated Assertion Engine</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Validates HTTP status codes, JSON schema data types, response property equality, and latency thresholds automatically.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="font-bold text-brand-300">3. Defect & Bug Lifecycle</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Direct linkage between failed assertion runs and actionable bug reports with prefilled steps to reproduce, expected vs actual values.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
