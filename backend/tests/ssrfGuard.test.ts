import { validateTargetUrl } from '../src/utils/ssrfGuard';

describe('SSRF Guard & Security Protocol Validator', () => {
  test('allows safe external and local test targets', () => {
    const local = validateTargetUrl('http://localhost:5001/api/users', true);
    expect(local.isValid).toBe(true);

    const external = validateTargetUrl('https://api.github.com/users', false);
    expect(external.isValid).toBe(true);
  });

  test('blocks cloud metadata endpoints (AWS/GCP/Azure)', () => {
    const awsMetadata = validateTargetUrl('http://169.254.169.254/latest/meta-data/', true);
    expect(awsMetadata.isValid).toBe(false);
    expect(awsMetadata.reason).toContain('cloud instance metadata');

    const gcpMetadata = validateTargetUrl('http://metadata.google.internal/computeMetadata/v1/', true);
    expect(gcpMetadata.isValid).toBe(false);
  });

  test('blocks non-HTTP protocols (file, ftp, gopher)', () => {
    const fileProto = validateTargetUrl('file:///etc/passwd');
    expect(fileProto.isValid).toBe(false);
    expect(fileProto.reason).toContain('Unsupported protocol');

    const ftpProto = validateTargetUrl('ftp://example.com/test');
    expect(ftpProto.isValid).toBe(false);
  });

  test('blocks unauthorized local ports when allowLocalDemo is restricted', () => {
    const loopback = validateTargetUrl('http://127.0.0.1:22', true);
    expect(loopback.isValid).toBe(false);
    expect(loopback.reason).toContain('Loopback access is only allowed for designated testing target ports');
  });

  test('rejects empty or malformed URLs', () => {
    expect(validateTargetUrl('').isValid).toBe(false);
    expect(validateTargetUrl('not a url').isValid).toBe(false);
  });
});
