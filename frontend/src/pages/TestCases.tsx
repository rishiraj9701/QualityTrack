import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  Plus,
  Play,
  Copy,
  Trash2,
  Edit2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { api } from '../services/api';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { MethodBadge, StatusBadge, Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { TestCase, Assertion } from '../types';

export const TestCases: React.FC = () => {
  const navigate = useNavigate();
  const { activeProject, activeEnvironment } = useProject();
  const { success, error, warning } = useToast();

  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingCaseId, setExecutingCaseId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [suiteFilter, setSuiteFilter] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<TestCase | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    testCaseId: '',
    method: 'GET',
    path: '/api/users',
    expectedStatus: 200,
    category: 'Positive Testing' as any,
    priority: 'Medium' as any,
    suiteId: '',
    endpointId: '',
    headers: JSON.stringify({ 'Content-Type': 'application/json' }, null, 2),
    body: '',
    assertions: [] as Assertion[],
  });

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await api.testCases.list({
        projectId: activeProject?.id,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        suiteId: suiteFilter !== 'ALL' ? suiteFilter : undefined,
        search: search.trim() || undefined,
      });
      if (res.data.success) {
        setTestCases(res.data.testCases || []);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load test cases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [activeProject?.id, categoryFilter, priorityFilter, suiteFilter, search]);

  const handleRunTestCase = async (tc: TestCase) => {
    try {
      setExecutingCaseId(tc.id);
      const res = await api.executions.runSingle(
        tc.id,
        activeProject?.id,
        activeEnvironment?.name || 'Development'
      );
      if (res.data.success) {
        const run = res.data.testRun;
        if (run.status === 'PASSED') {
          success(`Test ${tc.testCaseId} PASSED in ${run.durationMs}ms!`);
        } else {
          error(`Test ${tc.testCaseId} FAILED. View execution details.`);
        }
        navigate(`/test-runs/${run.id}`);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to run test case');
    } finally {
      setExecutingCaseId(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await api.testCases.duplicate(id);
      if (res.data.success) {
        success('Test case duplicated');
        fetchCases();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to duplicate test case');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await api.testCases.delete(id);
      if (res.data.success) {
        success('Test case deleted');
        fetchCases();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete test case');
    }
  };

  const handleAddAssertion = () => {
    setFormData((prev) => ({
      ...prev,
      assertions: [
        ...prev.assertions,
        {
          type: 'STATUS_CODE',
          target: 'statusCode',
          operator: 'equals',
          expectedValue: '200',
        },
      ],
    }));
  };

  const handleRemoveAssertion = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      assertions: prev.assertions.filter((_, i) => i !== idx),
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !formData.name.trim() || !formData.path.trim()) {
      warning('Please provide a name and endpoint path');
      return;
    }

    try {
      const res = await api.testCases.create({
        projectId: activeProject.id,
        ...formData,
      });
      if (res.data.success) {
        success(`Test Case ${res.data.testCase.testCaseId} created`);
        setCreateModalOpen(false);
        fetchCases();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create test case');
    }
  };

  const handleOpenEdit = (tc: TestCase) => {
    setSelectedCase(tc);
    setFormData({
      name: tc.name,
      description: tc.description || '',
      testCaseId: tc.testCaseId,
      method: tc.method,
      path: tc.path,
      expectedStatus: tc.expectedStatus,
      category: tc.category as any,
      priority: tc.priority as any,
      suiteId: tc.suiteId || '',
      endpointId: tc.endpointId || '',
      headers: tc.headers || '',
      body: tc.body || '',
      assertions: tc.assertions || [],
    });
    setEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    try {
      const res = await api.testCases.update(selectedCase.id, formData);
      if (res.data.success) {
        success(`Test Case ${selectedCase.testCaseId} updated`);
        setEditModalOpen(false);
        fetchCases();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update test case');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-brand-500" />
            Test Case Repository & Assertions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Maintain positive, negative, boundary, and edge-case test definitions with automated assertions and status expectations.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              name: '',
              description: '',
              testCaseId: '',
              method: 'GET',
              path: '/api/users',
              expectedStatus: 200,
              category: 'Positive Testing',
              priority: 'Medium',
              suiteId: '',
              endpointId: '',
              headers: JSON.stringify({ 'Content-Type': 'application/json' }, null, 2),
              body: '',
              assertions: [
                { type: 'STATUS_CODE', target: 'statusCode', operator: 'equals', expectedValue: '200' },
              ],
            });
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Create Test Case
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search test case ID, title, endpoint path..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full md:w-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="ALL">All Categories</option>
          <option value="Positive Testing">Positive Testing</option>
          <option value="Negative Testing">Negative Testing</option>
          <option value="Boundary Testing">Boundary Testing</option>
          <option value="Edge Case Testing">Edge Case Testing</option>
          <option value="Functional Testing">Functional Testing</option>
          <option value="Integration Testing">Integration Testing</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-full md:w-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="ALL">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
          <option value="Critical">Critical</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : testCases.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No test cases found"
          description="Create your first test scenario or clear your active filters."
          actionText="Create Test Case"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Test ID</th>
                  <th className="py-3 px-4">Name & Path</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Expected</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Last Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {testCases.map((tc) => {
                  const isRunning = executingCaseId === tc.id;
                  const lastResult = tc.testResults?.[0];

                  return (
                    <tr
                      key={tc.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {tc.testCaseId}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {tc.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <MethodBadge method={tc.method} size="sm" />
                          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                            {tc.path}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {tc.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {tc.expectedStatus}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {tc.assertions?.length || 0} assertions
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={tc.priority} size="sm" />
                      </td>

                      <td className="py-3.5 px-4">
                        {lastResult ? (
                          <div className="space-y-0.5">
                            <StatusBadge status={lastResult.status} size="sm" />
                            <div className="text-[10px] text-slate-400 font-mono">
                              {lastResult.responseTimeMs}ms
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Unrun</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRunTestCase(tc)}
                            disabled={isRunning}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition disabled:opacity-50 shadow-sm"
                            title="Execute this test case immediately"
                          >
                            {isRunning ? (
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Play className="w-3 h-3 fill-white" />
                            )}
                            <span>Run</span>
                          </button>

                          <button
                            onClick={() => handleDuplicate(tc.id)}
                            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Duplicate Test Case"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(tc)}
                            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Edit Test Case"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(tc.id, tc.name)}
                            className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Delete Test Case"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={createModalOpen || editModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditModalOpen(false);
        }}
        title={createModalOpen ? 'Create New Test Case' : `Edit Test Case – ${formData.testCaseId}`}
        description="Configure target HTTP method, endpoint, assertions, and expected status codes"
        maxWidth="3xl"
      >
        <form onSubmit={createModalOpen ? handleCreateSubmit : handleUpdateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Test Case Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. TC011 – Boundary Check on Email Length"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                <option value="Positive Testing">Positive Testing</option>
                <option value="Negative Testing">Negative Testing</option>
                <option value="Boundary Testing">Boundary Testing</option>
                <option value="Edge Case Testing">Edge Case Testing</option>
                <option value="Functional Testing">Functional Testing</option>
                <option value="Integration Testing">Integration Testing</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                HTTP Method *
              </label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Endpoint Path *
              </label>
              <input
                type="text"
                required
                value={formData.path}
                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                placeholder="/api/users"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expected Status *
              </label>
              <input
                type="number"
                required
                value={formData.expectedStatus}
                onChange={(e) => setFormData({ ...formData, expectedStatus: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Test objective, boundary constraints, and expected error code"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Request Body (if not GET) */}
          {formData.method !== 'GET' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Request Body (JSON)
              </label>
              <textarea
                rows={3}
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder='{ "name": "Test", "email": "test@example.com" }'
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          )}

          {/* Assertions Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                Response Assertions ({formData.assertions.length})
              </label>
              <button
                type="button"
                onClick={handleAddAssertion}
                className="text-xs text-brand-500 hover:text-brand-400 font-semibold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Assertion
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {formData.assertions.map((a, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800"
                >
                  <select
                    value={a.type}
                    onChange={(e) => {
                      const updated = [...formData.assertions];
                      updated[idx].type = e.target.value as any;
                      setFormData({ ...formData, assertions: updated });
                    }}
                    className="w-1/3 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="STATUS_CODE">STATUS CODE</option>
                    <option value="PROPERTY_EQUALS">PROPERTY EQUALS</option>
                    <option value="BODY_CONTAINS">BODY CONTAINS</option>
                    <option value="PROPERTY_TYPE">PROPERTY TYPE</option>
                    <option value="NOT_NULL">NOT NULL</option>
                    <option value="RESPONSE_TIME">RESPONSE TIME</option>
                  </select>

                  {/* Target path */}
                  {a.type !== 'STATUS_CODE' && a.type !== 'BODY_CONTAINS' && a.type !== 'RESPONSE_TIME' && (
                    <input
                      type="text"
                      placeholder="Property (e.g. user.email)"
                      value={a.target || ''}
                      onChange={(e) => {
                        const updated = [...formData.assertions];
                        updated[idx].target = e.target.value;
                        setFormData({ ...formData, assertions: updated });
                      }}
                      className="w-1/4 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  )}

                  {/* Expected Value */}
                  <input
                    type="text"
                    placeholder="Expected Value"
                    value={a.expectedValue}
                    onChange={(e) => {
                      const updated = [...formData.assertions];
                      updated[idx].expectedValue = e.target.value;
                      setFormData({ ...formData, assertions: updated });
                    }}
                    className="flex-1 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveAssertion(idx)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setCreateModalOpen(false);
                setEditModalOpen(false);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition"
            >
              {createModalOpen ? 'Create Test Case' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
