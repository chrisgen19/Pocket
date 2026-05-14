import dns from 'node:dns';
import { Agent } from 'undici';
import { isPrivateIP, UnsafeUrlError } from './url-safety';

/**
 * Undici dispatcher whose socket-level DNS lookup rejects any address that
 * resolves to a loopback / private / link-local / reserved range.
 *
 * This closes the DNS-rebinding TOCTOU between assertSafeUrl() (which validates
 * pre-flight) and the actual socket connection: the lookup callback is what
 * undici uses to dial, so the connection only proceeds against a vetted IP.
 */
export const safeDispatcher = new Agent({
  connect: {
    lookup: (hostname, options, callback) => {
      dns.lookup(hostname, options ?? {}, (err, address, family) => {
        if (err) return callback(err, '', 0);
        const addr = String(address);
        if (isPrivateIP(addr)) {
          return callback(
            new UnsafeUrlError('Refused: host resolved to a private or reserved address'),
            '',
            0,
          );
        }
        callback(null, addr, family);
      });
    },
  },
});
