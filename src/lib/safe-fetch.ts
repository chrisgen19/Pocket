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
      // Always resolve with all:true so we can validate every returned address,
      // then hand back to undici in whichever shape it asked for (it passes
      // all:true in modern versions, false in older ones).
      dns.lookup(hostname, { ...(options ?? {}), all: true }, (err, addresses) => {
        if (err) return (callback as (e: Error | null) => void)(err);

        const list = addresses as Array<{ address: string; family: number }>;
        for (const { address } of list) {
          if (isPrivateIP(address)) {
            return (callback as (e: Error | null) => void)(
              new UnsafeUrlError('Refused: host resolved to a private or reserved address'),
            );
          }
        }

        if (options?.all) {
          (callback as (e: Error | null, addrs: typeof list) => void)(null, list);
        } else {
          const first = list[0];
          (callback as (e: Error | null, addr: string, family: number) => void)(
            null,
            first.address,
            first.family,
          );
        }
      });
    },
  },
});
