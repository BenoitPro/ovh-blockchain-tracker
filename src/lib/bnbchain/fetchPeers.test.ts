import { describe, it, expect } from 'vitest';
import { extractBNBPeerIP } from './fetchPeers';

describe('extractBNBPeerIP', () => {
  it('extracts IPv4 from a standard host:port string', () => {
    expect(extractBNBPeerIP('1.2.3.4:30311')).toBe('1.2.3.4');
  });

  it('returns null for private 192.168.x.x addresses', () => {
    expect(extractBNBPeerIP('192.168.1.1:30311')).toBeNull();
  });

  it('returns null for private 10.x.x.x addresses', () => {
    expect(extractBNBPeerIP('10.0.0.1:30311')).toBeNull();
  });

  it('returns null for loopback', () => {
    expect(extractBNBPeerIP('127.0.0.1:30311')).toBeNull();
  });

  it('strips IPv6-mapped IPv4 prefix', () => {
    expect(extractBNBPeerIP('::ffff:1.2.3.4:30311')).toBe('1.2.3.4');
  });

  it('returns null for pure IPv6', () => {
    expect(extractBNBPeerIP('[2001:db8::1]:30311')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractBNBPeerIP('')).toBeNull();
  });
});
