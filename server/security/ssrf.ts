import dns from 'node:dns/promises';
import { URL } from 'node:url';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  normalizedUrl?: string;
  domain?: string;
  resolvedIp?: string;
}

// Check if an IPv4 address is in a private/restricted range
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed is unsafe
  }

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;
  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 10.0.0.0/8 (Private)
  if (a === 10) return true;
  // 172.16.0.0/12 (Private: 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;
  // 169.254.0.0/16 (Link-local / cloud metadata)
  if (a === 169 && b === 254) return true;
  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (a === 192 && b === 0 && parts[2] === 0) return true;
  // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (Documentation / TEST-NET)
  if ((a === 192 && b === 0 && parts[2] === 2) || (a === 198 && b === 51 && parts[2] === 100) || (a === 203 && b === 0 && parts[2] === 113)) return true;
  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
  if (a >= 224) return true;

  return false;
}

// Check if an IPv6 address is in a private/restricted range
function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  // Loopback ::1
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
  // Unspecified ::
  if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;
  // Unique local addresses fc00::/7 (fc00:: - fdff::)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  // Link-local unicast fe80::/10
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) return true;
  // IPv4-mapped IPv6 ::ffff:127.0.0.1
  if (normalized.includes('::ffff:')) {
    const v4Part = normalized.split('::ffff:')[1];
    if (v4Part && isPrivateIPv4(v4Part)) return true;
  }

  return false;
}

export function isRestrictedIP(ip: string): boolean {
  if (ip.includes(':')) {
    return isPrivateIPv6(ip);
  }
  return isPrivateIPv4(ip);
}

/**
 * Validates, cleans and verifies a user-submitted website URL against SSRF and private networks.
 */
export async function validateAndResolveUrl(inputUrl: string): Promise<ValidationResult> {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { valid: false, error: 'URL must not be empty.' };
  }

  let raw = inputUrl.trim();
  // Auto-prefix protocol if missing
  if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
    raw = 'https://' + raw;
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch (err) {
    return { valid: false, error: 'Invalid URL format. Please provide a standard web address (e.g., https://example.com).' };
  }

  // Only allow HTTP/HTTPS
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: `Protocol "${parsed.protocol}" is not supported. Only http:// and https:// are allowed.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost and common local names
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.corp') ||
    hostname.endsWith('.home') ||
    hostname.endsWith('.lan') ||
    hostname === '0.0.0.0' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  ) {
    return { valid: false, error: 'Scanning of localhost and internal hostnames is prohibited for security.' };
  }

  // If hostname is directly an IP address
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    if (isPrivateIPv4(hostname)) {
      return { valid: false, error: 'Scanning of private or internal IP ranges is prohibited.' };
    }
  }

  // Resolve hostname via DNS to verify target IP address
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return { valid: false, error: `Could not resolve domain name "${hostname}". Please check that the domain exists.` };
    }

    for (const record of addresses) {
      if (isRestrictedIP(record.address)) {
        return {
          valid: false,
          error: `Domain "${hostname}" resolved to restricted IP address (${record.address}). Scan rejected for security.`
        };
      }
    }

    const primaryIp = addresses[0].address;
    const normalizedUrl = `${parsed.protocol}//${parsed.host}${parsed.pathname || '/'}${parsed.search}`;

    return {
      valid: true,
      normalizedUrl,
      domain: parsed.hostname,
      resolvedIp: primaryIp
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `DNS lookup failed for "${hostname}": ${err.message || 'Host unreachable'}`
    };
  }
}
