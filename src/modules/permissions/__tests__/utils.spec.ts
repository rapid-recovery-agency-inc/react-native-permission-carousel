import { PermissionState } from '../types';
import { getPermissionStateFromPermissionStatus } from '../utils';

describe('utils', () => {
  describe('getPermissionStateFromPermissionStatus', () => {
    it('should return the correct permission state for a given permission status', () => {
      const actual = getPermissionStateFromPermissionStatus('granted');
      expect(actual).toBe(PermissionState.GRANTED);
    });

    it('should return the correct permission state for a given permission status', () => {
      const actual = getPermissionStateFromPermissionStatus('denied');
      expect(actual).toBe(PermissionState.DENIED);
    });

    it('should return the correct permission state for a given permission status', () => {
      const actual = getPermissionStateFromPermissionStatus('blocked');
      expect(actual).toBe(PermissionState.BLOCKED);
    });

    it('should return null for an unknown permission status', () => {
      const actual = getPermissionStateFromPermissionStatus('unknown');
      expect(actual).toBeNull();
    });
  });
});
