import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlayCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Filter,
  Play,
  RotateCcw,
} from 'lucide-react';
import { api } from '../services/api';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { TestRun } from '../types';

export const TestRuns: React.FC = () => {
  const navigate = useNavigate();
  const { activeProject, activeEnvironment } = useProject();
  const { success, error } = useToast();

  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAll, setRunningAll] = useState(false);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const res = await api.executions.listRuns({
        projectId: activeProject?.id,
        limit: 50,
      });
      if (res.data.success) {
        setRuns(res.data.testRuns || []);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load test runs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [activeProject?.id]);

  const handleRunAllProjectTests = async () => {
    if (!activeProject) return;

    try {
      setRunningAll(true);
      const res = await api.executions.runProject(
        activeProject.id,
        activeEnvironment?.name || 'Development'
      );
      if (res.data.success) {
        success(`Project test suite executed: ${res.data.testRun.passedTests} passed`);
        navigate(`/test-runs/${res.data.testRun.id}`);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to run project tests');
    } finally {
      setRunningAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-brand-500" />
            Test Execution Runs & History
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit logs of test executions, assertion validations, and real-time pass/fail telemetry stored in PostgreSQL.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRuns}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
            title="Refresh Runs"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRunAllProjectTests}
            disabled={runningAll}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            {runningAll ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Executing Batch...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Execute All Project Tests</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Runs Table */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : runs.length === 0 ? (
        <EmptyState
          icon={PlayCircle}
          title="No execution history found"
          description="Trigger an individual test case, test suite, or automated batch run to generate execution history."
          actionText="Execute All Tests"
          onAction={handleRunAllProjectTests}
        />
      ) : (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Run Status</th>
                  <th className="py-3 px-4">Execution Target</th>
                  <th className="py-3 px-4">Pass / Total</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Environment</th>
                  <th className="py-3 px-4">Triggered By</th>
                  <th className="py-3 px-4">Executed At</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    onClick={() => navigate(`/test-runs/${run.id}`)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4">
                      <StatusBadge status={run.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      <div>{run.suite?.name || `${run.executionType} Run`}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">
                        {run.id.slice(0, 8)}...
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className="text-emerald-500 font-bold">{run.passedTests}</span>
                      <span className="text-slate-400"> / </span>
                      <span className="text-slate-700 dark:text-slate-300">{run.totalTests}</span>
                      {run.failedTests > 0 && (
                        <span className="text-rose-500 font-bold ml-1.5">
                          ({run.failedTests} failed)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {run.durationMs}ms
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        {run.environment}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {run.triggeredBy}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(run.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="text-brand-500 hover:text-brand-400 font-semibold inline-flex items-center gap-1">
                        Inspect <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
