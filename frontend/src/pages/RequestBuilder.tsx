import React, { useState } from 'react';
import {
  Send,
  Save,
  Clock,
  HardDrive,
  Copy,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Code2,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { MethodBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const RequestBuilder: React.FC = () => {
  const { activeProject, interpolate } = useProject();
  const { success, error, warning } = useToast();

  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  const [url, setUrl] = useState('{{baseUrl}}/api/users');
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params');

  // Key-Value States
  const [queryParams, setQueryParams] = useState<{ key: string; value: string; enabled: boolean }[]>([
    { key: 'page', value: '1', enabled: false },
    { key: 'limit', value: '10', enabled: false },
  ]);

  const [headers, setHeaders] = useState<{ key: string; value: string; enabled: boolean }[]>([
    { key: 'Content-Type', value: 'application/json', enabled: true },
    { key: 'Accept', value: 'application/json', enabled: true },
  ]);

  // Request Body
  const [bodyType, setBodyType] = useState<'json' | 'raw' | 'none'>('json');
  const [bodyContent, setBodyContent] = useState(
    JSON.stringify(
      {
        name: 'Rishi Kumar',
        email: 'rishi.kumar@example.com',
        password: 'Password123!',
        role: 'QA Automation Engineer',
      },
      null,
      2
    )
  );

  // Auth Configuration
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'basic' | 'apiKey'>('none');
  const [bearerToken, setBearerToken] = useState('{{apiKey}}');
  const [basicAuth, setBasicAuth] = useState({ username: '', password: '' });
  const [apiKeyAuth, setApiKeyAuth] = useState({ key: 'x-api-key', value: '{{apiKey}}', addTo: 'header' });

  // Execution & Response State
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [activeResponseTab, setActiveResponseTab] = useState<'body' | 'headers' | 'raw'>('body');
  const [copied, setCopied] = useState(false);

  // Save Modal
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveEndpointName, setSaveEndpointName] = useState('');

  const handleSend = async () => {
    if (!url.trim()) {
      warning('Please enter a target URL');
      return;
    }

    try {
      setSending(true);

      // Interpolate templates in URL
      const finalUrl = interpolate(url.trim());

      // Build Headers dictionary
      const finalHeaders: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.enabled && h.key) {
          finalHeaders[h.key] = interpolate(h.value);
        }
      });

      // Build Query Params dictionary
      const finalParams: Record<string, string> = {};
      queryParams.forEach((q) => {
        if (q.enabled && q.key) {
          finalParams[q.key] = interpolate(q.value);
        }
      });

      // Inject Auth into headers/params
      if (authType === 'bearer' && bearerToken) {
        finalHeaders['Authorization'] = `Bearer ${interpolate(bearerToken)}`;
      } else if (authType === 'basic' && (basicAuth.username || basicAuth.password)) {
        const credentials = btoa(`${basicAuth.username}:${basicAuth.password}`);
        finalHeaders['Authorization'] = `Basic ${credentials}`;
      } else if (authType === 'apiKey' && apiKeyAuth.key && apiKeyAuth.value) {
        const keyVal = interpolate(apiKeyAuth.value);
        if (apiKeyAuth.addTo === 'header') {
          finalHeaders[apiKeyAuth.key] = keyVal;
        } else {
          finalParams[apiKeyAuth.key] = keyVal;
        }
      }

      // Build Body
      let parsedBody: any = undefined;
      if (method !== 'GET' && bodyType !== 'none') {
        const interpolatedBody = interpolate(bodyContent);
        if (bodyType === 'json') {
          try {
            parsedBody = JSON.parse(interpolatedBody);
          } catch (e: any) {
            warning(`JSON parsing warning: ${e.message}. Sending as raw payload.`);
            parsedBody = interpolatedBody;
          }
        } else {
          parsedBody = interpolatedBody;
        }
      }

      const res = await api.proxy.send({
        method,
        url: finalUrl,
        headers: finalHeaders,
        params: finalParams,
        body: parsedBody,
        timeoutMs: 12000,
      });

      setResponse(res.data);
      if (res.data.isInfrastructureError) {
        error(res.data.errorMessage || 'Infrastructure network error');
      } else {
        success(`HTTP ${res.data.statusCode} in ${res.data.responseTimeMs}ms`);
      }
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Execution failed');
    } finally {
      setSending(false);
    }
  };

  const handleCopyResponse = () => {
    if (!response) return;
    const content = typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.rawBody;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormatJson = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(bodyContent), null, 2);
      setBodyContent(formatted);
      success('JSON formatted');
    } catch {
      error('Invalid JSON syntax');
    }
  };

  const handleSaveToProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !saveEndpointName.trim()) return;

    try {
      // Clean path: if starts with baseUrl or http, extract pathname
      let cleanPath = url;
      try {
        const parsed = new URL(interpolate(url));
        cleanPath = parsed.pathname;
      } catch {}

      await api.endpoints.create({
        projectId: activeProject.id,
        name: saveEndpointName.trim(),
        method,
        path: cleanPath,
        description: `Saved from API Request Builder (${method} ${cleanPath})`,
        bodyTemplate: bodyType === 'json' ? bodyContent : undefined,
      });

      success(`Endpoint '${saveEndpointName}' saved to ${activeProject.name}`);
      setSaveModalOpen(false);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to save endpoint');
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-brand-500" />
            Postman-Style API Request Builder
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Construct HTTP calls with variable interpolation (`{'{{baseUrl}}'}`), custom headers, and inspect real response status & headers.
          </p>
        </div>
        <button
          onClick={() => {
            setSaveEndpointName(`${method} ${url.replace('{{baseUrl}}', '')}`);
            setSaveModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition shadow-sm"
        >
          <Save className="w-3.5 h-3.5 text-brand-500" />
          Save to Project
        </button>
      </div>

      {/* Main Request Control Bar */}
      <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-center gap-2">
        {/* Method Selector */}
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as any)}
          className={`px-3 py-2 rounded-lg text-xs font-mono font-bold border focus:outline-none cursor-pointer transition ${
            method === 'GET'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
              : method === 'POST'
              ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700'
              : method === 'PUT'
              ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-700'
              : method === 'PATCH'
              ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-700'
              : 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-700'
          }`}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>

        {/* URL Input */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Enter request URL (e.g. {{baseUrl}}/api/users)"
            className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder-slate-400"
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-md disabled:opacity-50"
        >
          {sending ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </>
          )}
        </button>
      </div>

      {/* Request Configuration Tabs */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {/* Tab Header */}
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('params')}
            className={`py-3 px-3 border-b-2 transition -mb-px flex items-center gap-1.5 ${
              activeTab === 'params'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Params
            {queryParams.filter((q) => q.enabled).length > 0 && (
              <span className="w-4 h-4 rounded-full bg-brand-500/20 text-brand-500 text-[10px] flex items-center justify-center">
                {queryParams.filter((q) => q.enabled).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('headers')}
            className={`py-3 px-3 border-b-2 transition -mb-px flex items-center gap-1.5 ${
              activeTab === 'headers'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Headers
            {headers.filter((h) => h.enabled).length > 0 && (
              <span className="w-4 h-4 rounded-full bg-brand-500/20 text-brand-500 text-[10px] flex items-center justify-center">
                {headers.filter((h) => h.enabled).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('body')}
            className={`py-3 px-3 border-b-2 transition -mb-px flex items-center gap-1.5 ${
              activeTab === 'body'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Body {method !== 'GET' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`py-3 px-3 border-b-2 transition -mb-px flex items-center gap-1.5 ${
              activeTab === 'auth'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Authorization {authType !== 'none' && <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* Params Tab */}
          {activeTab === 'params' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Query Parameters
                </span>
                <button
                  type="button"
                  onClick={() => setQueryParams([...queryParams, { key: '', value: '', enabled: true }])}
                  className="text-xs text-brand-500 hover:text-brand-400 font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Param
                </button>
              </div>

              {queryParams.map((param, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={param.enabled}
                    onChange={(e) => {
                      const updated = [...queryParams];
                      updated[idx].enabled = e.target.checked;
                      setQueryParams(updated);
                    }}
                    className="rounded border-slate-700 text-brand-600 focus:ring-0"
                  />
                  <input
                    type="text"
                    placeholder="Key"
                    value={param.key}
                    onChange={(e) => {
                      const updated = [...queryParams];
                      updated[idx].key = e.target.value;
                      setQueryParams(updated);
                    }}
                    className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={param.value}
                    onChange={(e) => {
                      const updated = [...queryParams];
                      updated[idx].value = e.target.value;
                      setQueryParams(updated);
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                  <button
                    onClick={() => setQueryParams(queryParams.filter((_, i) => i !== idx))}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Headers Tab */}
          {activeTab === 'headers' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Request Headers
                </span>
                <button
                  type="button"
                  onClick={() => setHeaders([...headers, { key: '', value: '', enabled: true }])}
                  className="text-xs text-brand-500 hover:text-brand-400 font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Header
                </button>
              </div>

              {headers.map((h, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={h.enabled}
                    onChange={(e) => {
                      const updated = [...headers];
                      updated[idx].enabled = e.target.checked;
                      setHeaders(updated);
                    }}
                    className="rounded border-slate-700 text-brand-600 focus:ring-0"
                  />
                  <input
                    type="text"
                    placeholder="Header Name"
                    value={h.key}
                    onChange={(e) => {
                      const updated = [...headers];
                      updated[idx].key = e.target.value;
                      setHeaders(updated);
                    }}
                    className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="Value (supports {{apiKey}})"
                    value={h.value}
                    onChange={(e) => {
                      const updated = [...headers];
                      updated[idx].value = e.target.value;
                      setHeaders(updated);
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                  <button
                    onClick={() => setHeaders(headers.filter((_, i) => i !== idx))}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Body Tab */}
          {activeTab === 'body' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="bodyType"
                      checked={bodyType === 'json'}
                      onChange={() => setBodyType('json')}
                      className="text-brand-600 focus:ring-0"
                    />
                    JSON
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="bodyType"
                      checked={bodyType === 'raw'}
                      onChange={() => setBodyType('raw')}
                      className="text-brand-600 focus:ring-0"
                    />
                    Raw Text
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="bodyType"
                      checked={bodyType === 'none'}
                      onChange={() => setBodyType('none')}
                      className="text-brand-600 focus:ring-0"
                    />
                    None
                  </label>
                </div>

                {bodyType === 'json' && (
                  <button
                    type="button"
                    onClick={handleFormatJson}
                    className="text-xs text-brand-500 hover:text-brand-400 font-semibold inline-flex items-center gap-1"
                  >
                    <Code2 className="w-3.5 h-3.5" /> Format JSON
                  </button>
                )}
              </div>

              {bodyType !== 'none' ? (
                <textarea
                  rows={8}
                  value={bodyContent}
                  onChange={(e) => setBodyContent(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  This request does not have a body payload.
                </div>
              )}
            </div>
          )}

          {/* Auth Tab */}
          {activeTab === 'auth' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Auth Type:
                </label>
                <select
                  value={authType}
                  onChange={(e) => setAuthType(e.target.value as any)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="none">No Auth</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                  <option value="apiKey">API Key</option>
                </select>
              </div>

              {authType === 'bearer' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Token (supports template `{'{{apiKey}}'}`)
                  </label>
                  <input
                    type="text"
                    value={bearerToken}
                    onChange={(e) => setBearerToken(e.target.value)}
                    placeholder="e.g. eyJhbGciOi..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              )}

              {authType === 'basic' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={basicAuth.username}
                      onChange={(e) => setBasicAuth({ ...basicAuth, username: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={basicAuth.password}
                      onChange={(e) => setBasicAuth({ ...basicAuth, password: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {authType === 'apiKey' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Key
                    </label>
                    <input
                      type="text"
                      value={apiKeyAuth.key}
                      onChange={(e) => setApiKeyAuth({ ...apiKeyAuth, key: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      value={apiKeyAuth.value}
                      onChange={(e) => setApiKeyAuth({ ...apiKeyAuth, value: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Add to
                    </label>
                    <select
                      value={apiKeyAuth.addTo}
                      onChange={(e) => setApiKeyAuth({ ...apiKeyAuth, addTo: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
                    >
                      <option value="header">Header</option>
                      <option value="query">Query Params</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Response Viewer Section */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {/* Response Metadata Bar */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Response
            </span>

            {response && !response.isInfrastructureError ? (
              <div className="flex items-center gap-3">
                {/* Status Badge */}
                <div
                  className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border ${
                    response.statusCode >= 200 && response.statusCode < 300
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                      : response.statusCode >= 400 && response.statusCode < 500
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400 border-rose-300 dark:border-rose-700'
                  }`}
                >
                  {response.statusCode} {response.statusText}
                </div>

                {/* Duration */}
                <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{response.responseTimeMs} ms</span>
                </div>

                {/* Size */}
                <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                  <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                  <span>{(response.responseSizeBytes / 1024).toFixed(2)} KB</span>
                </div>
              </div>
            ) : response?.isInfrastructureError ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{response.errorMessage || 'Target Unreachable / Policy Blocked'}</span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Ready to send</span>
            )}
          </div>

          {response && (
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setActiveResponseTab('body')}
                  className={`px-3 py-1 rounded-md font-medium transition ${
                    activeResponseTab === 'body'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Body
                </button>
                <button
                  onClick={() => setActiveResponseTab('headers')}
                  className={`px-3 py-1 rounded-md font-medium transition ${
                    activeResponseTab === 'headers'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Headers
                </button>
                <button
                  onClick={() => setActiveResponseTab('raw')}
                  className={`px-3 py-1 rounded-md font-medium transition ${
                    activeResponseTab === 'raw'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Raw
                </button>
              </div>

              <button
                onClick={handleCopyResponse}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
                title="Copy response body"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Response Body Content */}
        <div className="p-4 min-h-[200px]">
          {response ? (
            activeResponseTab === 'body' ? (
              <pre className="p-3.5 rounded-lg bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed selection:bg-brand-500/30">
                {typeof response.data === 'object'
                  ? JSON.stringify(response.data, null, 2)
                  : response.rawBody || 'Empty response body'}
              </pre>
            ) : activeResponseTab === 'headers' ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono max-h-96 overflow-y-auto">
                {Object.entries(response.headers || {}).map(([k, v]) => (
                  <div key={k} className="py-2 flex items-start gap-3">
                    <span className="w-1/3 text-slate-500 dark:text-slate-400 font-semibold truncate">
                      {k}
                    </span>
                    <span className="flex-1 text-slate-800 dark:text-slate-200 break-all">
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="p-3.5 rounded-lg bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed">
                {response.rawBody || 'No raw data'}
              </pre>
            )
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
              <Code2 className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-xs font-medium">Click "Send" to execute this API request</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Target requests are securely dispatched via QualityTrack's SSRF-guarded proxy engine.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Save Endpoint Modal */}
      <Modal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title="Save Endpoint to Project"
        description={`Save this request configuration into "${activeProject?.name}"`}
      >
        <form onSubmit={handleSaveToProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Endpoint Name *
            </label>
            <input
              type="text"
              required
              value={saveEndpointName}
              onChange={(e) => setSaveEndpointName(e.target.value)}
              placeholder="e.g. Register New User"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <div className="flex items-center gap-2">
              <MethodBadge method={method} size="sm" />
              <span className="font-mono text-slate-700 dark:text-slate-300">{url}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Target Project: <span className="font-semibold text-slate-300">{activeProject?.name}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSaveModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition"
            >
              Save Endpoint
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
