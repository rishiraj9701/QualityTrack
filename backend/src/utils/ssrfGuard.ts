import { URL } from 'url';

export interface URLValidationResult {
  isValid: boolean;
  reason?: string;
  normalizedUrl?: string;
}

// Allowed local testing targets for the Demo API
const ALLOWED_LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1'];
const ALLOWED_LOCAL_PORTS = ['5001', '3000', '8080'];

/**
 * Validates target URLs to guard against Server-Side Request Forgery (SSRF)
 * Blocks cloud metadata endpoints, unspecified internal networks, and malformed URLs.
 */
export function validateTargetUrl(rawUrl: string, allowLocalDemo: boolean = true): URLValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, reason: 'URL is required and must be a string' };
  }

  const trimmed = rawUrl.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch (err) {
    return { isValid: false, reason: 'Invalid URL format' };
  }

  // Enforce HTTP / HTTPS only
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isValid: false, reason: `Unsupported protocol '${parsed.protocol}'. Only http and https are allowed.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block AWS / GCP / Azure metadata services unconditionally
  const metadataIPs = ['169.254.169.254', 'metadata.google.internal', '169.254.170.2'];
  if (metadataIPs.includes(hostname) || hostname.endsWith('.metadata.google.internal')) {
    return { isValid: false, reason: 'Access to cloud instance metadata services is strictly forbidden (SSRF protection).' };
  }

  // Check localhost / loopback targets
  const isLoopback =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('127.');

  if (isLoopback) {
    if (allowLocalDemo) {
      const port = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
      if (!ALLOWED_LOCAL_PORTS.includes(port)) {
        return {
          isValid: false,
          reason: `Loopback access is only allowed for designated testing target ports (${ALLOWED_LOCAL_PORTS.join(', ')}). Target port was ${port}.`,
        };
      }
    } else {
      return { isValid: false, reason: 'Access to loopback/localhost addresses is restricted.' };
    }
  }

  // Check RFC1918 Private ranges if desired
  // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  const isPrivateIp =
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);

  if (isPrivateIp && !allowLocalDemo) {
    return { isValid: false, reason: 'Access to private internal network addresses is restricted.' };
  }

  return {
    isValid: true,
    normalizedUrl: parsed.toString(),
  };
}
