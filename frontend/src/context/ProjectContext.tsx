import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Project, Environment } from '../types';
import { api } from '../services/api';

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  activeEnvironment: Environment | null;
  loading: boolean;
  setActiveProjectById: (id: string) => void;
  setActiveEnvironmentByName: (name: string) => void;
  refreshProjects: () => Promise<void>;
  interpolate: (template: string) => string;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeEnvName, setActiveEnvName] = useState<string>('Development');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.projects.list();
      if (res.data.success && res.data.projects.length > 0) {
        setProjects(res.data.projects);

        // Keep existing active project if present, or pick first
        setActiveProject((prev) => {
          if (prev) {
            const found = res.data.projects.find((p: Project) => p.id === prev.id);
            if (found) return found;
          }
          const savedId = localStorage.getItem('qualitytrack_active_project_id');
          if (savedId) {
            const found = res.data.projects.find((p: Project) => p.id === savedId);
            if (found) return found;
          }
          return res.data.projects[0];
        });
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (activeProject) {
      localStorage.setItem('qualitytrack_active_project_id', activeProject.id);
    }
  }, [activeProject]);

  const setActiveProjectById = (id: string) => {
    const proj = projects.find((p) => p.id === id);
    if (proj) {
      setActiveProject(proj);
      setActiveEnvName(proj.currentEnv || 'Development');
    }
  };

  const setActiveEnvironmentByName = (name: string) => {
    setActiveEnvName(name);
  };

  const activeEnvironment =
    activeProject?.environments?.find((e) => e.name === activeEnvName) ||
    activeProject?.environments?.[0] ||
    null;

  // Utility to replace {{variable}} templates using active environment variables
  const interpolate = useCallback(
    (template: string): string => {
      if (!template) return '';
      const vars: Record<string, string> = {
        baseUrl: activeEnvironment?.baseUrl || activeProject?.baseUrl || 'http://localhost:5001',
      };

      if (activeEnvironment?.variables) {
        try {
          const parsed = JSON.parse(activeEnvironment.variables);
          if (Array.isArray(parsed)) {
            parsed.forEach((v: any) => {
              if (v.key && v.enabled !== false) {
                vars[v.key] = v.value || '';
              }
            });
          }
        } catch {}
      }

      return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, varName) => {
        return varName in vars ? vars[varName] : match;
      });
    },
    [activeEnvironment, activeProject]
  );

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        activeEnvironment,
        loading,
        setActiveProjectById,
        setActiveEnvironmentByName,
        refreshProjects: fetchProjects,
        interpolate,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within ProjectProvider');
  return context;
};
