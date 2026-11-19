import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Bug,
  ChevronDown,
  ChevronRight,
  HardDrive,
  Copy,
  Check,
  Code2,
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { MethodBadge, StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { TableSkeleton } from '../components/common/Skeleton';
import { TestRun, TestResult, AssertionResult } from '../types';

export const TestRunDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [testRun, setTestRun] = useState<TestRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});

  // Bug Modal State
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const [bugForm, setBugForm] = useState({
    title: '',
    description: '',
    stepsToReproduce: '',
    expectedResult: '',
    actualResult: '',
    severity: 'High' as any,
    priority: 'High' as any,
    projectId: '',
    endpointId: '',
    testCaseId: '',
    testResultId: '',
  });

  const fetchRunDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.executions.getRun(id);
      if (res.data.success) {
        setTestRun(res.data.testRun);
        // Expand failed results by default
        const initExpanded: Record<string, boolean> = {};
        res.data.testRun.testResults?.forEach((tr: TestResult) => {
          if (tr.status === 'FAILED' || tr.status === 'ERROR') {
            initExpanded[tr.id] = true;
          }
        });
        setExpandedResults(initExpanded);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load test run details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRunDetail();
  }, [id]);

  const toggleExpand = (resId: string) => {
    setExpandedResults((prev) => ({ ...prev, [resId]: !prev[resId] }));
  };

  const handleOpenLogBug = (tr: TestResult) => {
    const tc = tr.testCase;
    const errorText = tr.errorMessage || 'Assertion mismatch or response condition unmet.';

    setBugForm({
      title: `[Defect] ${tc?.testCaseId || 'TC'} – ${tc?.name || 'Test Case'} assertion failed`,
      description: `Test execution ${testRun?.id.slice(0, 8)} detected a failure in ${tc?.method} ${tc?.path}. Reason: ${errorText}`,
      stepsToReproduce: `1. Send ${tc?.method} ${tc?.path}\n2. Headers: ${tc?.headers || 'None'}\n3. Body: ${tc?.body || 'None'}\n4. Verify response against assertion contract.`,
      expectedResult: `Expected HTTP ${tc?.expectedStatus || 200} with valid assertions.`,
      actualResult: `Received HTTP ${tr.statusCode || 'N/A'}. Error: ${errorText}\nResponse: ${tr.responseBody?.slice(0, 200) || 'None'}`,
      severity: tc?.priority === 'Critical' ? 'Critical' : tc?.priority === 'High' ? 'High' : 'Medium',
      priority: 'High',
      projectId: testRun?.projectId || '',
      endpointId: tc?.endpointId || '',
      testCaseId: tc?.id || '',
      testResultId: tr.id,
    });
    setBugModalOpen(true);
  };

  const handleCreateBug = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.bugs.create(bugForm);
      if (res.data.success) {
        success(`Bug ${res.data.bug.bugId} logged successfully!`);
        setBugModalOpen(false);
        fetchRunDetail();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create bug report');
    }
  };

  if (loading || !testRun) {
    return <TableSkeleton rows={6} />;
  }

  const passRate = testRun.totalTests > 0
    ? ((testRun.passedTests / testRun.totalTests) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/test-runs')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Test Runs
      </button>

      {/* Run Summary Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <StatusBadge status={testRun.status} size="md" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {testRun.suite?.name || `${testRun.executionType} Run`}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Run ID: <span className="font-mono text-slate-400">{testRun.id}</span> • Executed on {new Date(testRun.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-6 shrink-0 bg-slate-50 dark:bg-slate-850 px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Pass Rate
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {passRate}%
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Duration
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
                {testRun.durationMs}ms
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Environment
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {testRun.environment}
              </div>
            </div>
          </div>
        </div>

        {/* Counts breakdown bar */}
        <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800/40">
            {testRun.passedTests} Passed
          </div>
          <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-800/40">
            {testRun.failedTests} Failed
          </div>
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
            {testRun.skippedTests} Skipped
          </div>
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700">
            {testRun.totalTests} Total Tests
          </div>
        </div>
      </div>

      {/* Individual Test Results List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Execution Results & Assertion Telemetry ({testRun.testResults?.length || 0})
        </h3>

        {testRun.testResults?.map((res) => {
          const isExpanded = !!expandedResults[res.id];
          const tc = res.testCase;

          let parsedAssertions: AssertionResult[] = [];
          try {
            if (res.assertionResults) {
              parsedAssertions = JSON.parse(res.assertionResults);
            }
          } catch { }

          const hasBugLinked = res.bugReports && res.bugReports.length > 0;

          return (
            <div
              key={res.id}
              className={`rounded-xl border transition bg-white dark:bg-slate-900 overflow-hidden shadow-sm ${res.status === 'PASSED'
                  ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  : 'border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-500/10'
                }`}
            >
              {/* Row Header */}
              <div
                onClick={() => toggleExpand(res.id)}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition select-none"
              >
                <div className="flex items-center gap-3">
                  <button className="text-slate-400">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  <StatusBadge status={res.status} size="sm" />

                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                    {tc?.testCaseId}
                  </span>

                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {tc?.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <MethodBadge method={tc?.method || 'GET'} size="sm" />
                      <span className="font-mono text-[11px] text-slate-500 truncate max-w-sm">
                        {tc?.path}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto">
                  <div className="text-right font-mono text-xs">
                    <span className="text-slate-500">HTTP </span>
                    <span
                      className={`font-bold ${res.statusCode && res.statusCode < 400
                          ? 'text-emerald-500'
                          : 'text-rose-500'
                        }`}
                    >
                      {res.statusCode ?? 'ERR'}
                    </span>
                    <span className="text-slate-400 text-[11px] ml-2">
                      {res.responseTimeMs ?? 0}ms
                    </span>
                  </div>

                  {res.status !== 'PASSED' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenLogBug(res);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition"
                    >
                      <Bug className="w-3.5 h-3.5" />
                      <span>{hasBugLinked ? 'Bug Logged' : 'Log Bug'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Inspection Pane */}
              {isExpanded && (
                <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 space-y-4">
                  {/* Error banner if failed */}
                  {res.errorMessage && (
                    <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-medium flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>{res.errorMessage}</div>
                    </div>
                  )}

                  {/* Assertion Breakdown */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Assertions Evaluated ({parsedAssertions.length})
                    </h4>

                    {parsedAssertions.length > 0 ? (
                      <div className="space-y-1.5">
                        {parsedAssertions.map((a, i) => (
                          <div
                            key={i}
                            className={`p-2.5 rounded-lg border text-xs flex items-start justify-between gap-3 ${a.passed
                                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                                : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/40 text-rose-800 dark:text-rose-300'
                              }`}
                          >
                            <div className="flex items-start gap-2">
                              {a.passed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <span className="font-semibold">{a.type}: </span>
                                <span>{a.message}</span>
                              </div>
                            </div>
                            <span className="font-mono text-[10px] uppercase font-bold shrink-0">
                              {a.passed ? 'PASS' : 'FAIL'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">
                        Default status code assertion evaluated.
                      </div>
                    )}
                  </div>

                  {/* Response Body Viewer */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Actual Response Body
                    </h4>
                    <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-56 leading-relaxed">
                      {res.responseBody || 'Empty payload'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Log Bug Modal */}
      <Modal
        isOpen={bugModalOpen}
        onClose={() => setBugModalOpen(false)}
        title="Create Defect Report from Test Failure"
        description="Prefilled automatically from execution assertion telemetry"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateBug} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bug Title *
            </label>
            <input
              type="text"
              required
              value={bugForm.title}
              onChange={(e) => setBugForm({ ...bugForm, title: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Severity
              </label>
              <select
                value={bugForm.severity}
                onChange={(e) => setBugForm({ ...bugForm, severity: e.target.value as any })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={bugForm.priority}
                onChange={(e) => setBugForm({ ...bugForm, priority: e.target.value as any })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Steps to Reproduce
            </label>
            <textarea
              rows={3}
              value={bugForm.stepsToReproduce}
              onChange={(e) => setBugForm({ ...bugForm, stepsToReproduce: e.target.value })}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expected vs Actual Result
            </label>
            <div className="grid grid-cols-2 gap-2">
              <textarea
                rows={2}
                placeholder="Expected"
                value={bugForm.expectedResult}
                onChange={(e) => setBugForm({ ...bugForm, expectedResult: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              <textarea
                rows={2}
                placeholder="Actual"
                value={bugForm.actualResult}
                onChange={(e) => setBugForm({ ...bugForm, actualResult: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setBugModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition"
            >
              Log Bug Report
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
