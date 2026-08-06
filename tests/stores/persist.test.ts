import { describe, it, expect, beforeEach } from 'vitest';
import { load, save } from '@/stores/persist';

describe('persist helper', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns the fallback when the key is absent', () => {
    expect(load('missing:v1', { hello: true })).toEqual({ hello: true });
  });

  it('round-trips values under the aip: prefix', () => {
    save('thing:v1', { count: 3 });
    expect(localStorage.getItem('aip:thing:v1')).toBe('{"count":3}');
    expect(load('thing:v1', { count: 0 })).toEqual({ count: 3 });
  });

  it('returns the fallback on corrupt JSON', () => {
    localStorage.setItem('aip:bad:v1', '{not json');
    expect(load('bad:v1', 'fallback')).toBe('fallback');
  });
});
