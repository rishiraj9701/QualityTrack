import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach auth token if present in localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('qualitytrack_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const api = {
  // Auth
  auth: {
    login: (credentials: any) => apiClient.post('/auth/login', credentials),
    register: (data: any) => apiClient.post('/auth/register', data),
    me: () => apiClient.get('/auth/me'),
  },

  // Projects
  projects: {
    list: () => apiClient.get('/projects'),
    get: (id: string) => apiClient.get(`/projects/${id}`),
    create: (data: any) => apiClient.post('/projects', data),
    update: (id: string, data: any) => apiClient.put(`/projects/${id}`, data),
    delete: (id: string) => apiClient.delete(`/projects/${id}`),
    updateEnvironment: (projectId: string, envName: string, data: any) =>
      apiClient.put(`/projects/${projectId}/environments/${envName}`, data),
  },

  // Endpoints
  endpoints: {
    list: (projectId?: string) => apiClient.get('/endpoints', { params: { projectId } }),
    get: (id: string) => apiClient.get(`/endpoints/${id}`),
    create: (data: any) => apiClient.post('/endpoints', data),
    update: (id: string, data: any) => apiClient.put(`/endpoints/${id}`, data),
    delete: (id: string) => apiClient.delete(`/endpoints/${id}`),
  },

  // Test Suites
  testSuites: {
    list: (projectId?: string) => apiClient.get('/test-suites', { params: { projectId } }),
    get: (id: string) => apiClient.get(`/test-suites/${id}`),
    create: (data: any) => apiClient.post('/test-suites', data),
    update: (id: string, data: any) => apiClient.put(`/test-suites/${id}`, data),
    delete: (id: string) => apiClient.delete(`/test-suites/${id}`),
  },

  // Test Cases
  testCases: {
    list: (params?: any) => apiClient.get('/test-cases', { params }),
    get: (id: string) => apiClient.get(`/test-cases/${id}`),
    create: (data: any) => apiClient.post('/test-cases', data),
    update: (id: string, data: any) => apiClient.put(`/test-cases/${id}`, data),
    duplicate: (id: string) => apiClient.post(`/test-cases/${id}/duplicate`),
    delete: (id: string) => apiClient.delete(`/test-cases/${id}`),
  },

  // Executions
  executions: {
    runSingle: (testCaseId: string, projectId?: string, environmentName?: string) =>
      apiClient.post('/executions/run-single', { testCaseId, projectId, environmentName }),
    runSuite: (suiteId: string, projectId?: string, environmentName?: string) =>
      apiClient.post('/executions/run-suite', { suiteId, projectId, environmentName }),
    runProject: (projectId: string, environmentName?: string) =>
      apiClient.post('/executions/run-project', { projectId, environmentName }),
    listRuns: (params?: any) => apiClient.get('/executions/runs', { params }),
    getRun: (id: string) => apiClient.get(`/executions/runs/${id}`),
    getResult: (id: string) => apiClient.get(`/executions/results/${id}`),
  },

  // Proxy Request (Postman Builder)
  proxy: {
    send: (requestOptions: {
      method: string;
      url: string;
      headers?: Record<string, string>;
      params?: Record<string, any>;
      body?: any;
      timeoutMs?: number;
    }) => apiClient.post('/proxy/send', requestOptions),
  },

  // Bug Reports
  bugs: {
    list: (params?: any) => apiClient.get('/bugs', { params }),
    get: (id: string) => apiClient.get(`/bugs/${id}`),
    create: (data: any) => apiClient.post('/bugs', data),
    update: (id: string, data: any) => apiClient.put(`/bugs/${id}`, data),
    delete: (id: string) => apiClient.delete(`/bugs/${id}`),
  },

  // Reports
  reports: {
    summary: (params?: any) => apiClient.get('/reports/summary', { params }),
    exportCsvUrl: (projectId?: string) =>
      `/api/reports/export-csv${projectId ? `?projectId=${projectId}` : ''}`,
  },

  // Dashboard
  dashboard: {
    getStats: (projectId?: string) => apiClient.get('/dashboard/stats', { params: { projectId } }),
  },
};

export default api;
