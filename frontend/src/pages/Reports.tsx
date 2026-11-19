import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  Filter,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
import { useToast } from '../context/ToastContext';
import { CardSkeleton } from '../components/common/Skeleton';
import { MethodBadge } from '../components/common/Badge';

export const Reports: React.FC = () => {
  const { activeProject } = useProject();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any>({});
  const [bugsBySeverity, setBugsBySeverity] = useState<any>({});
  const [failingEndpoints, setFailingEndpoints] = useState<any[]>([]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.reports.summary({
        projectId: activeProject?.id,
      });
      if (res.data.success) {
        setSummary(res.data.summary);
        setTrends(res.data.trends || []);
        setCategoryStats(res.data.categoryStats || {});
        setBugsBySeverity(res.data.bugsBySeverity || {});
        setFailingEndpoints(res.data.frequentlyFailingEndpoints || []);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeProject?.id]);

  const handleExportCsv = () => {
    const url = api.reports.exportCsvUrl(activeProject?.id);
    window.open(url, '_blank');
    success('CSV Export downloaded successfully');
  };

  if (loading && !summary) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  // Prepare category data for Bar chart
  const categoryChartData = Object.entries(categoryStats).map(([cat, val]: [string, any]) => ({
    name: cat.replace(' Testing', ''),
    Passed: val.passed,
    Failed: val.failed,
  }));

  // Prepare Bug Severity data for Pie chart
  const severityChartData = [
    { name: 'Critical', value: bugsBySeverity?.Critical || 0, color: '#ef4444' },
    { name: 'High', value: bugsBySeverity?.High || 0, color: '#f97316' },
    { name: 'Medium', value: bugsBySeverity?.Medium || 0, color: '#eab308' },
    { name: 'Low', value: bugsBySeverity?.Low || 0, color: '#3b82f6' },
  ].filter((s) => s.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-500" />
            Quality Assurance Report & Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Executive testing summary, assertion accuracy metrics, category pass rates, and CSV audit reports.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Report (CSV)
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Pass Percentage</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {summary?.passPercentage ?? 0}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summary?.passedTests ?? 0} of {summary?.totalExecutedTests ?? 0} assertions passed
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Total Executed</span>
            <TrendingUp className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {summary?.totalExecutedTests ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {summary?.totalRuns ?? 0} execution runs
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Failures & Errors</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-500">
            {(summary?.failedTests ?? 0) + (summary?.errorTests ?? 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summary?.failedTests ?? 0} assertion fails • {summary?.errorTests ?? 0} network errors
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Average Run Time</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {summary?.avgDurationMs ?? 0}ms
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total execution time: {summary?.totalDurationMs ?? 0}ms
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
            Test Performance by Category
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Passed vs failed tests in positive, negative, boundary, and edge case suites
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <Legend />
                <Bar dataKey="Passed" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bug Severity Distribution */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
            Defect Severity Breakdown
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Distribution of logged issues by critical, high, medium, and low severity
          </p>

          <div className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
            {severityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={severityChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {severityChartData.map((entry, index) => (
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
            ) : (
              <div className="text-center text-xs text-slate-400">
                No defect records logged yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Frequently Failing Endpoints Leaderboard */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
          Endpoint Flakiness & Failing Leaderboard
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Endpoints with highest frequency of assertion failures across all test suites
        </p>

        {failingEndpoints.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {failingEndpoints.map((ep, i) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-400 w-4 font-bold">#{i + 1}</span>
                  <MethodBadge method={ep.method} size="sm" />
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                    {ep.path}
                  </span>
                  <span className="text-slate-400 text-[11px]">({ep.endpoint})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-rose-500 font-bold font-mono">
                    {ep.failCount} {ep.failCount === 1 ? 'failure' : 'failures'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400">
            Zero failing endpoints recorded. All tested endpoints are adhering to API contracts!
          </div>
        )}
      </div>
    </div>
  );
};
