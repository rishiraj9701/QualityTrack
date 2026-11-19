import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  Trash2,
  Edit2,
  Globe,
  Layers,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { Project, EnvironmentVariable } from '../types';

export const Projects: React.FC = () => {
  const { projects, activeProject, setActiveProjectById, refreshProjects } = useProject();
  const { success, error } = useToast();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [envModalOpen, setEnvModalOpen] = useState(false);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    baseUrl: 'http://localhost:5001',
    currentEnv: 'Development',
  });

  // Environment Variables state
  const [currentEnvTab, setCurrentEnvTab] = useState<'Development' | 'Staging' | 'Production'>('Development');
  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([]);
  const [envBaseUrl, setEnvBaseUrl] = useState('');
  const [showSecrets, setShowSecrets] = useState<Record<number, boolean>>({});

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      description: '',
      baseUrl: 'http://localhost:5001',
      currentEnv: 'Development',
    });
    setCreateModalOpen(true);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const res = await api.projects.create(formData);
      if (res.data.success) {
        success('Project created successfully');
        setCreateModalOpen(false);
        await refreshProjects();
        setActiveProjectById(res.data.project.id);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create project');
    }
  };

  const handleOpenEdit = (p: Project) => {
    setSelectedProject(p);
    setFormData({
      name: p.name,
      description: p.description || '',
      baseUrl: p.baseUrl || 'http://localhost:5001',
      currentEnv: p.currentEnv || 'Development',
    });
    setEditModalOpen(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !formData.name.trim()) return;

    try {
      const res = await api.projects.update(selectedProject.id, formData);
      if (res.data.success) {
        success('Project updated successfully');
        setEditModalOpen(false);
        await refreshProjects();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update project');
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete project "${name}"? All associated endpoints, test cases, and runs will be removed.`)) {
      return;
    }

    try {
      const res = await api.projects.delete(id);
      if (res.data.success) {
        success('Project deleted');
        await refreshProjects();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleOpenEnvModal = (p: Project) => {
    setSelectedProject(p);
    const envObj = p.environments?.find((e) => e.name === 'Development') || p.environments?.[0];
    setCurrentEnvTab((envObj?.name as any) || 'Development');
    setEnvBaseUrl(envObj?.baseUrl || p.baseUrl || 'http://localhost:5001');

    try {
      const vars = envObj?.variables ? JSON.parse(envObj.variables) : [];
      setEnvVars(Array.isArray(vars) ? vars : []);
    } catch {
      setEnvVars([]);
    }
    setEnvModalOpen(true);
  };

  const handleSwitchEnvTab = (envName: 'Development' | 'Staging' | 'Production') => {
    setCurrentEnvTab(envName);
    if (!selectedProject) return;
    const envObj = selectedProject.environments?.find((e) => e.name === envName);
    setEnvBaseUrl(envObj?.baseUrl || (envName === 'Development' ? 'http://localhost:5001' : 'https://api.example.com'));
    try {
      const vars = envObj?.variables ? JSON.parse(envObj.variables) : [];
      setEnvVars(Array.isArray(vars) ? vars : []);
    } catch {
      setEnvVars([]);
    }
  };

  const handleAddVariable = () => {
    setEnvVars((prev) => [...prev, { key: '', value: '', isSecret: false, enabled: true }]);
  };

  const handleRemoveVariable = (idx: number) => {
    setEnvVars((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveEnvironment = async () => {
    if (!selectedProject) return;
    try {
      const res = await api.projects.updateEnvironment(selectedProject.id, currentEnvTab, {
        baseUrl: envBaseUrl,
        variables: envVars,
      });
      if (res.data.success) {
        success(`Environment '${currentEnvTab}' saved`);
        setEnvModalOpen(false);
        await refreshProjects();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to save environment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-brand-500" />
            Projects & Environment Registry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organize APIs, configure environment tiers (Dev, Staging, Prod), and manage secret variables securely.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Create New Project
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((p) => {
          const isActive = activeProject?.id === p.id;

          return (
            <div
              key={p.id}
              className={`p-5 rounded-xl border transition-all duration-200 flex flex-col justify-between bg-white dark:bg-slate-900 shadow-sm ${
                isActive
                  ? 'border-brand-500 ring-1 ring-brand-500/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {p.name}
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {p.description || 'No project description provided.'}
                    </p>
                  </div>
                </div>

                {/* Base URL badge */}
                <div className="mt-3 flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{p.baseUrl || 'http://localhost:5001'}</span>
                </div>

                {/* Metric Badges */}
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {p._count?.endpoints ?? 0}
                    </div>
                    <div className="text-[10px] text-slate-400">Endpoints</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {p._count?.testCases ?? 0}
                    </div>
                    <div className="text-[10px] text-slate-400">Test Cases</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {p._count?.bugReports ?? 0}
                    </div>
                    <div className="text-[10px] text-slate-400">Bugs</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveProjectById(p.id)}
                  disabled={isActive}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                      : 'bg-brand-600/10 hover:bg-brand-600/20 text-brand-600 dark:text-brand-400'
                  }`}
                >
                  {isActive ? 'Current Context' : 'Select Project'}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEnvModal(p)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Configure Environments & Variables"
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Edit Project"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(p.id, p.name)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New QA Project"
        description="Set up an API target testbed with automated environments"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Identity Verification Microservice"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Primary validation scope, test plans, and contract criteria"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Base URL *
            </label>
            <input
              type="text"
              required
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              placeholder="http://localhost:5001"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
              Create Project
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Project Details"
      >
        <form onSubmit={handleUpdateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project Name
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
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Base URL
            </label>
            <input
              type="text"
              required
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
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

      {/* Environments & Variables Modal */}
      <Modal
        isOpen={envModalOpen}
        onClose={() => setEnvModalOpen(false)}
        title={`Configure Environments – ${selectedProject?.name}`}
        description="Configure target URLs and environment variable substitutions like {{baseUrl}} and {{apiKey}}"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Environment Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            {(['Development', 'Staging', 'Production'] as const).map((env) => (
              <button
                key={env}
                onClick={() => handleSwitchEnvTab(env)}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition -mb-px ${
                  currentEnvTab === env
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {env}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Environment Base URL
            </label>
            <input
              type="text"
              value={envBaseUrl}
              onChange={(e) => setEnvBaseUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-brand-500" />
                Environment Variables
              </label>
              <button
                type="button"
                onClick={handleAddVariable}
                className="text-xs text-brand-500 hover:text-brand-400 font-semibold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Variable
              </button>
            </div>

            {envVars.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-850/50 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                No custom variables defined. Click "+ Add Variable" to create templates.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {envVars.map((v, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800"
                  >
                    <input
                      type="text"
                      placeholder="Variable Key (e.g. apiKey)"
                      value={v.key}
                      onChange={(e) => {
                        const updated = [...envVars];
                        updated[idx].key = e.target.value;
                        setEnvVars(updated);
                      }}
                      className="w-1/3 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100"
                    />

                    <div className="relative flex-1">
                      <input
                        type={v.isSecret && !showSecrets[idx] ? 'password' : 'text'}
                        placeholder="Value"
                        value={v.value}
                        onChange={(e) => {
                          const updated = [...envVars];
                          updated[idx].value = e.target.value;
                          setEnvVars(updated);
                        }}
                        className="w-full px-2 py-1 pr-7 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100"
                      />
                      {v.isSecret && (
                        <button
                          type="button"
                          onClick={() =>
                            setShowSecrets((prev) => ({ ...prev, [idx]: !prev[idx] }))
                          }
                          className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-200"
                        >
                          {showSecrets[idx] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={v.isSecret}
                        onChange={(e) => {
                          const updated = [...envVars];
                          updated[idx].isSecret = e.target.checked;
                          setEnvVars(updated);
                        }}
                        className="rounded border-slate-700 text-brand-600 focus:ring-0"
                      />
                      Secret
                    </label>

                    <button
                      type="button"
                      onClick={() => handleRemoveVariable(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEnvModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEnvironment}
              className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition"
            >
              Save Environment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
