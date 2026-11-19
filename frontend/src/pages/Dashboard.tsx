import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Send,
  FileCheck2,
  PlayCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Bug,
  Activity,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '../services/api';
import { useProject } from '../context/ProjectContext';
import { StatusBadge, MethodBadge } from '../components/common/Badge';
import { CardSkeleton, TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { activeProject } = useProject();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [statusDist, setStatusDist] = useState<any[]>([]);
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [recentBugs, setRecentBugs] = useState<any[]>([]);
  const [failingEndpoints, setFailingEndpoints] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.dashboard.getStats(activeProject?.id);
      if (res.data.success) {
        setStats(res.data.stats);
        setTrends(res.data.trends || []);
        setStatusDist(res.data.statusDistribution || []);
        setRecentRuns(res.data.recentRuns || []);
        setRecentBugs(res.data.recentBugs || []);
        setFailingEndpoints(res.data.frequentlyFailingEndpoints || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeProject?.id]);

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-brand-950 p-6 border border-slate-800 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-xs font-medium border border-brand-500/30">
              <Activity className="w-3.5 h-3.5" />
              Automated API Testing & QA Platform
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              QualityTrack Quality Assurance Overview
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Real-time API testing telemetry, automated test suite execution metrics, assertion pass rates, and bug tracking.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate('/request-builder')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
            >
              <Send className="w-3.5 h-3.5 text-brand-400" />
              API Tester
            </button>
            <button
              onClick={() => navigate('/test-cases')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md transition"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Run Test Cases
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pass Rate */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
            <span>Overall Pass Rate</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.passRate ?? 0}%
            </span>
            <span className="text-[11px] text-slate-400">
              ({stats?.passedTests ?? 0} / {stats?.totalExecutions ?? 0})
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats?.passRate || 0)}%` }}
            />
          </div>
        </div>

        {/* Total Executions */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
            <span>Total Test Executions</span>
            <span className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500">
              <PlayCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats?.totalExecutions ?? 0}
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="text-emerald-500 font-semibold">{stats?.passedTests ?? 0} Passed</span>
            <span>•</span>
            <span className="text-rose-500 font-semibold">{stats?.failedTests ?? 0} Failed</span>
          </div>
        </div>

        {/* Test Cases Repository */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
            <span>Configured Test Cases</span>
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
              <FileCheck2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats?.totalTestCases ?? 0}
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Covering Positive, Negative & Boundary</span>
          </div>
        </div>

        {/* Endpoints & Projects */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
            <span>API Endpoints Managed</span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
              <Send className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats?.totalEndpoints ?? 0}
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Across {stats?.totalProjects ?? 0} active QA projects</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Execution Trend Area Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-500" />
                Execution History & Assertion Trends
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pass vs fail metrics across consecutive test runs
              </p>
            </div>
          </div>

          {trends.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFail" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pass"
                    name="Passed Tests"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPass)"
                  />
                  <Area
                    type="monotone"
                    dataKey="fail"
                    name="Failed Tests"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorFail)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={Activity}
              title="No execution trends recorded yet"
              description="Execute test suites or individual test cases to populate real-time trend analytics."
              actionText="Run Tests Now"
              onAction={() => navigate('/test-cases')}
            />
          )}
        </div>

        {/* Pass vs Fail Donut Chart */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Test Status Distribution
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Ratio of passed vs failed assertions
          </p>

          {statusDist.length > 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusDist}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {statusDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No status data"
              description="Run tests to generate pass vs fail distribution."
            />
          )}
        </div>
      </div>

      {/* Bottom Grid: Recent Test Runs & Recent Bugs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Test Executions Table */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-brand-500" />
                Recent Test Executions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest batch and individual test runs
              </p>
            </div>
            <button
              onClick={() => navigate('/test-runs')}
              className="text-xs text-brand-500 hover:text-brand-400 font-medium inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentRuns.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentRuns.map((run) => (
                <div
                  key={run.id}
                  onClick={() => navigate(`/test-runs/${run.id}`)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850/50 px-2 rounded-lg cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={run.status} size="sm" />
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {run.suite?.name || `${run.executionType} Run`}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(run.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })} • {run.durationMs}ms
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {run.passedTests} / {run.totalTests} Passed
                    </div>
                    <div className="text-[11px] text-slate-400">{run.environment}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No test runs recorded"
              description="Execute a test suite to view execution telemetry."
            />
          )}
        </div>

        {/* Recently Reported Bugs Table */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Bug className="w-4 h-4 text-rose-500" />
                Active Defects & Reported Bugs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Issues logged from failed test executions
              </p>
            </div>
            <button
              onClick={() => navigate('/bug-reports')}
              className="text-xs text-brand-500 hover:text-brand-400 font-medium inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentBugs.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentBugs.map((b) => (
                <div
                  key={b.id}
                  onClick={() => navigate('/bug-reports')}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850/50 px-2 rounded-lg cursor-pointer transition"
                >
                  <div className="space-y-0.5 max-w-[70%]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {b.bugId}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {b.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {b.testCase ? `Linked to ${b.testCase.testCaseId}` : b.project?.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={b.severity} size="sm" />
                    <StatusBadge status={b.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No active defects"
              description="Zero bugs reported. When a test fails, you can log defects directly into this tracking board."
            />
          )}
        </div>
      </div>
    </div>
  );
};
