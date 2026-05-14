import { promises as dns } from 'node:dns';
import net from 'node:net';

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

function ipv4ToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return -1;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isPrivateIPv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  if (n < 0) return true;
  const ranges: Array<[string, number]> = [
    ['0.0.0.0', 8],
    ['10.0.0.0', 8],
    ['100.64.0.0', 10],
    ['127.0.0.0', 8],
    ['169.254.0.0', 16],
    ['172.16.0.0', 12],
    ['192.0.0.0', 24],
    ['192.168.0.0', 16],
    ['198.18.0.0', 15],
    ['224.0.0.0', 4],
    ['240.0.0.0', 4],
  ];
  for (const [base, bits] of ranges) {
    const baseInt = ipv4ToInt(base);
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    if ((n & mask) === (baseInt & mask)) return true;
  }
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === '::' || lower === '::1') return true;
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local fc00::/7
  if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) {
    return true; // link-local fe80::/10
  }
  if (lower.startsWith('ff')) return true; // multicast
  const v4Mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4Mapped) return isPrivateIPv4(v4Mapped[1]);
  return false;
}

function isPrivateIP(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateIPv6(ip);
  return true; // unparseable — fail safe
}

/**
 * Parse and validate a URL for outbound fetches.
 * Throws UnsafeUrlError on non-http(s) schemes, unresolvable hosts, or hosts
 * that map to loopback / private / link-local / multicast / reserved IPs.
 *
 * Must be called for every hop when following redirects manually.
 */
export async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError('Invalid URL');
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new UnsafeUrlError('Only http and https URLs are allowed');
  }

  // Strip IPv6 brackets so net.isIP recognises the literal.
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host)) {
    if (isPrivateIP(host)) {
      throw new UnsafeUrlError('URL resolves to a private or reserved address');
    }
    return url;
  }

  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await dns.lookup(host, { all: true });
  } catch {
    throw new UnsafeUrlError('Unable to resolve host');
  }
  if (addresses.length === 0) {
    throw new UnsafeUrlError('Unable to resolve host');
  }
  for (const { address } of addresses) {
    if (isPrivateIP(address)) {
      throw new UnsafeUrlError('URL resolves to a private or reserved address');
    }
  }
  return url;
}
