import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Plus,
  Play,
  Trash2,
  Edit2,
  FileCheck2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';
import { MethodBadge, StatusBadge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { TestSuite } from '../types';

export const TestSuites: React.FC = () => {
  const navigate = useNavigate();
  const { activeProject, activeEnvironment } = useProject();
  const { success, error } = useToast();

  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingSuiteId, setExecutingSuiteId] = useState<string | null>(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const fetchSuites = async () => {
    try {
      setLoading(true);
      const res = await api.testSuites.list(activeProject?.id);
      if (res.data.success) {
        setSuites(res.data.testSuites || []);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load test suites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuites();
  }, [activeProject?.id]);

  const handleRunSuite = async (suite: TestSuite) => {
    try {
      setExecutingSuiteId(suite.id);
      const res = await api.executions.runSuite(
        suite.id,
        activeProject?.id,
        activeEnvironment?.name || 'Development'
      );
      if (res.data.success) {
        success(`Suite "${suite.name}" executed: ${res.data.testRun.passedTests} passed`);
        navigate(`/test-runs/${res.data.testRun.id}`);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to execute test suite');
    } finally {
      setExecutingSuiteId(null);
    }
  };

  const handleCreateSuite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !formData.name.trim()) return;

    try {
      const res = await api.testSuites.create({
        projectId: activeProject.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
      });
      if (res.data.success) {
        success('Test Suite created');
        setCreateModalOpen(false);
        fetchSuites();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create suite');
    }
  };

  const handleUpdateSuite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSuite || !formData.name.trim()) return;

    try {
      const res = await api.testSuites.update(selectedSuite.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
      });
      if (res.data.success) {
        success('Test Suite updated');
        setEditModalOpen(false);
        fetchSuites();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update suite');
    }
  };

  const handleDeleteSuite = async (id: string, name: string) => {
    if (!confirm(`Delete test suite "${name}"? Test cases will be unassigned.`)) return;

    try {
      const res = await api.testSuites.delete(id);
      if (res.data.success) {
        success('Test suite deleted');
        fetchSuites();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete suite');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-500" />
            Test Suites Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Group functional, smoke, negative, and boundary scenarios into suites for one-click automated execution.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', description: '' });
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Create Test Suite
        </button>
      </div>

      {/* Suites List */}
      {suites.length === 0 && !loading ? (
        <EmptyState
          icon={Layers}
          title="No test suites found"
          description="Create your first test suite (e.g. Smoke Suite or Regression Suite) to organize your test cases."
          actionText="Create Test Suite"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {suites.map((suite) => {
            const isExecuting = executingSuiteId === suite.id;

            return (
              <div
                key={suite.id}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between transition hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {suite.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {suite.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedSuite(suite);
                          setFormData({
                            name: suite.name,
                            description: suite.description || '',
                          });
                          setEditModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSuite(suite.id, suite.name)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Included Cases summary */}
                  <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5 text-brand-500" />
                        Test Cases ({suite.testCases?.length || 0})
                      </span>
                      <button
                        onClick={() => navigate('/test-cases')}
                        className="text-[11px] text-brand-500 hover:underline flex items-center gap-0.5"
                      >
                        Manage Cases <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {suite.testCases && suite.testCases.length > 0 ? (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {suite.testCases.slice(0, 4).map((tc) => (
                          <div
                            key={tc.id}
                            className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800"
                          >
                            <div className="flex items-center gap-2 truncate max-w-[70%]">
                              <MethodBadge method={tc.method} size="sm" />
                              <span className="font-mono text-slate-400">{tc.testCaseId}</span>
                              <span className="text-slate-800 dark:text-slate-200 truncate">{tc.name}</span>
                            </div>
                            <span className="text-slate-400 text-[10px]">{tc.category}</span>
                          </div>
                        ))}
                        {suite.testCases.length > 4 && (
                          <div className="text-[10px] text-slate-400 text-center pt-1">
                            +{suite.testCases.length - 4} more test cases in suite
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-xs text-slate-400">
                        No test cases assigned to this suite yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer & Run Button */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Target: <span className="font-medium text-slate-300">{activeEnvironment?.name || 'Development'}</span>
                  </span>

                  <button
                    onClick={() => handleRunSuite(suite)}
                    disabled={isExecuting || !suite.testCases || suite.testCases.length === 0}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    {isExecuting ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Running...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Run Test Suite</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Test Suite"
        description="Group related test scenarios for batch execution"
      >
        <form onSubmit={handleCreateSuite} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Suite Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. User Authentication & Boundary Suite"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Suite test objective, critical paths, and execution frequency"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition"
            >
              Create Suite
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Test Suite"
      >
        <form onSubmit={handleUpdateSuite} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Suite Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
