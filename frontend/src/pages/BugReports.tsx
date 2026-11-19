import React, { useState, useEffect } from 'react';
import {
  Bug,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge, MethodBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { BugReport } from '../types';

export const BugReports: React.FC = () => {
  const { activeProject } = useProject();
  const { success, error } = useToast();

  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);

  // Create Form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stepsToReproduce: '',
    expectedResult: '',
    actualResult: '',
    severity: 'Medium' as any,
    priority: 'Medium' as any,
    status: 'Open' as any,
  });

  const fetchBugs = async () => {
    try {
      setLoading(true);
      const res = await api.bugs.list({
        projectId: activeProject?.id,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        severity: severityFilter !== 'ALL' ? severityFilter : undefined,
        search: search.trim() || undefined,
      });
      if (res.data.success) {
        setBugs(res.data.bugs || []);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to load bugs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBugs();
  }, [activeProject?.id, statusFilter, severityFilter, search]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !formData.title.trim()) return;

    try {
      const res = await api.bugs.create({
        projectId: activeProject.id,
        ...formData,
      });
      if (res.data.success) {
        success(`Defect ${res.data.bug.bugId} registered`);
        setCreateModalOpen(false);
        fetchBugs();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create bug report');
    }
  };

  const handleUpdateStatus = async (bugId: string, newStatus: string) => {
    try {
      const res = await api.bugs.update(bugId, { status: newStatus });
      if (res.data.success) {
        success(`Bug marked as ${newStatus}`);
        fetchBugs();
        if (selectedBug && selectedBug.id === bugId) {
          setSelectedBug(res.data.bug);
        }
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update bug status');
    }
  };

  const handleDelete = async (id: string, bugIdCode: string) => {
    if (!confirm(`Are you sure you want to delete ${bugIdCode}?`)) return;

    try {
      const res = await api.bugs.delete(id);
      if (res.data.success) {
        success('Bug report deleted');
        setDetailModalOpen(false);
        fetchBugs();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete bug report');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bug className="w-5 h-5 text-rose-500" />
            Defect & Bug Tracking System
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log, triage, and track resolution status of API defects discovered during automated test execution.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              title: '',
              description: '',
              stepsToReproduce: '',
              expectedResult: '',
              actualResult: '',
              severity: 'Medium',
              priority: 'Medium',
              status: 'Open',
            });
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Log Defect Report
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search bug ID (e.g. BUG-001), defect title, steps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="w-full md:w-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="ALL">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Bugs Table */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : bugs.length === 0 ? (
        <EmptyState
          icon={Bug}
          title="No defects found"
          description="Great job! There are currently no unresolved defects logged for this project."
          actionText="Log New Defect"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Bug ID</th>
                  <th className="py-3 px-4">Defect Title</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Linked Test Case</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {bugs.map((bug) => (
                  <tr
                    key={bug.id}
                    onClick={() => {
                      setSelectedBug(bug);
                      setDetailModalOpen(true);
                    }}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-500">
                      {bug.bugId}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 max-w-sm truncate">
                        {bug.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-sm">
                        {bug.description}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={bug.severity} size="sm" />
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={bug.priority} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {bug.testCase ? (
                        <span className="font-semibold text-brand-500">
                          {bug.testCase.testCaseId}
                        </span>
                      ) : (
                        'Manual Log'
                      )}
                    </td>

                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={bug.status}
                        onChange={(e) => handleUpdateStatus(bug.id, e.target.value)}
                        className={`text-xs font-semibold px-2 py-0.5 rounded-md border focus:outline-none cursor-pointer ${
                          bug.status === 'Resolved' || bug.status === 'Closed'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                            : bug.status === 'In Progress'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                            : 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border-sky-300 dark:border-sky-700'
                        }`}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(bug.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDelete(bug.id, bug.bugId)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 transition"
                        title="Delete Bug"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Log New Defect Report"
        description="Document an API failure, regression, or contract mismatch"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bug Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Duplicate email registration returns 500 instead of 409 Conflict"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Severity
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
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
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description *
            </label>
            <textarea
              rows={2}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Summary of bug behavior and potential impact"
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Steps to Reproduce
            </label>
            <textarea
              rows={3}
              value={formData.stepsToReproduce}
              onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
              placeholder="1. Send POST /api/users with duplicate email&#10;2. Observe HTTP response status"
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expected Result
              </label>
              <textarea
                rows={2}
                value={formData.expectedResult}
                onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                placeholder="HTTP 409 Conflict with { error: 'Conflict' }"
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Actual Result
              </label>
              <textarea
                rows={2}
                value={formData.actualResult}
                onChange={(e) => setFormData({ ...formData, actualResult: e.target.value })}
                placeholder="HTTP 500 Internal Server Error returned"
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition"
            >
              Log Defect
            </button>
          </div>
        </form>
      </Modal>

      {/* Bug Details Inspector Modal */}
      {selectedBug && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`${selectedBug.bugId} – ${selectedBug.title}`}
          description={`Logged for ${activeProject?.name}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedBug.severity} />
                <StatusBadge status={selectedBug.priority} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Current Status:</span>
                <select
                  value={selectedBug.status}
                  onChange={(e) => handleUpdateStatus(selectedBug.id, e.target.value)}
                  className="text-xs font-semibold px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:outline-none"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Description
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedBug.description}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Steps to Reproduce
              </h4>
              <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {selectedBug.stepsToReproduce || 'None recorded'}
              </pre>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Expected Result
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                  {selectedBug.expectedResult || 'N/A'}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Actual Result
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                  {selectedBug.actualResult || 'N/A'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-400">
                Created on {new Date(selectedBug.createdAt).toLocaleString()}
              </span>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
