import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { validateTargetUrl } from '../utils/ssrfGuard';

export interface ProxyRequestOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeoutMs?: number;
  allowLocalDemo?: boolean;
}

export interface ProxyResponseResult {
  success: boolean;
  isInfrastructureError: boolean;
  statusCode: number;
  statusText: string;
  responseTimeMs: number;
  responseSizeBytes: number;
  headers: Record<string, string>;
  data: any;
  rawBody: string;
  errorMessage?: string;
}

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5 MB maximum

/**
 * Controlled HTTP Proxy executor for QualityTrack
 * Implements SSRF guarding, response size caps, timeout controls, and timing precision.
 */
export async function executeProxyRequest(
  options: ProxyRequestOptions
): Promise<ProxyResponseResult> {
  const {
    method = 'GET',
    url,
    headers = {},
    params,
    data,
    timeoutMs = 10000,
    allowLocalDemo = true,
  } = options;

  // 1. SSRF Guard Validation
  const urlCheck = validateTargetUrl(url, allowLocalDemo);
  if (!urlCheck.isValid) {
    return {
      success: false,
      isInfrastructureError: true,
      statusCode: 0,
      statusText: 'BLOCKED_BY_POLICY',
      responseTimeMs: 0,
      responseSizeBytes: 0,
      headers: {},
      data: null,
      rawBody: '',
      errorMessage: `Request rejected by Security Policy: ${urlCheck.reason}`,
    };
  }

  const targetUrl = urlCheck.normalizedUrl || url;

  // 2. Prepare Axios Config
  const cleanHeaders = { ...headers };
  // Never pass internal dangerous host or authorization headers blindly unless user intended
  delete cleanHeaders['host'];

  const config: AxiosRequestConfig = {
    method: method.toUpperCase() as any,
    url: targetUrl,
    headers: cleanHeaders,
    params,
    data,
    timeout: timeoutMs,
    validateStatus: () => true, // Don't throw for 4xx/5xx; capture real HTTP responses
    maxContentLength: MAX_RESPONSE_BYTES,
    maxBodyLength: MAX_RESPONSE_BYTES,
    transformResponse: [(resData) => resData], // Preserve raw text so we can calculate exact size and parse safely
  };

  const startTime = Date.now();

  try {
    const response: AxiosResponse = await axios(config);
    const endTime = Date.now();
    const duration = endTime - startTime;

    const rawBody = typeof response.data === 'string'
      ? response.data
      : JSON.stringify(response.data || '');

    const responseBytes = Buffer.byteLength(rawBody, 'utf8');

    // Parse JSON if possible
    let parsedData = response.data;
    if (typeof response.data === 'string') {
      try {
        parsedData = JSON.parse(response.data);
      } catch {
        parsedData = response.data;
      }
    }

    // Format response headers as simple key-value pairs
    const flattenedHeaders: Record<string, string> = {};
    if (response.headers) {
      Object.entries(response.headers).forEach(([k, v]) => {
        flattenedHeaders[k] = Array.isArray(v) ? v.join(', ') : String(v);
      });
    }

    return {
      success: response.status < 400,
      isInfrastructureError: false,
      statusCode: response.status,
      statusText: response.statusText || `${response.status}`,
      responseTimeMs: duration,
      responseSizeBytes: responseBytes,
      headers: flattenedHeaders,
      data: parsedData,
      rawBody,
    };
  } catch (err: any) {
    const duration = Date.now() - startTime;
    const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
    const isRefused = err.code === 'ECONNREFUSED';

    let errorDetail = err.message || 'Unknown network error occurred';
    if (isTimeout) {
      errorDetail = `Request timed out after ${timeoutMs}ms`;
    } else if (isRefused) {
      errorDetail = `Connection refused at ${targetUrl}. Ensure the target server is active and reachable.`;
    }

    return {
      success: false,
      isInfrastructureError: true,
      statusCode: 0,
      statusText: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      responseTimeMs: duration,
      responseSizeBytes: 0,
      headers: {},
      data: null,
      rawBody: '',
      errorMessage: errorDetail,
    };
  }
}
