import { describe, it, expect } from 'vitest';
import {
  normalizeFolderPath,
  doesPathMatch,
  getParentPath,
  getFolderName,
  getAncestorPaths,
  remapFolderPath,
} from './folderPath';

describe('folderPath utils', () => {
  describe('normalizeFolderPath', () => {
    it('returns root for empty / nullish / dot inputs', () => {
      expect(normalizeFolderPath(undefined)).toBe('/');
      expect(normalizeFolderPath(null)).toBe('/');
      expect(normalizeFolderPath('')).toBe('/');
      expect(normalizeFolderPath('   ')).toBe('/');
      expect(normalizeFolderPath('/')).toBe('/');
      expect(normalizeFolderPath('.')).toBe('/');
    });

    it('adds a leading slash and strips a trailing slash', () => {
      expect(normalizeFolderPath('work')).toBe('/work');
      expect(normalizeFolderPath('/work/')).toBe('/work');
    });

    it('collapses duplicate slashes and trims whitespace', () => {
      expect(normalizeFolderPath('  //work//project//  ')).toBe('/work/project');
    });
  });

  describe('doesPathMatch', () => {
    it('matches everything against root base', () => {
      expect(doesPathMatch('/a/b', '/')).toBe(true);
    });

    it('matches exact path and descendants only', () => {
      expect(doesPathMatch('/work', '/work')).toBe(true);
      expect(doesPathMatch('/work/sub', '/work')).toBe(true);
      expect(doesPathMatch('/workshop', '/work')).toBe(false);
    });
  });

  describe('getParentPath', () => {
    it('returns null for root', () => {
      expect(getParentPath('/')).toBeNull();
    });

    it('returns root for a first-level folder', () => {
      expect(getParentPath('/work')).toBe('/');
    });

    it('returns the immediate parent for a nested folder', () => {
      expect(getParentPath('/work/project/sub')).toBe('/work/project');
    });
  });

  describe('getFolderName', () => {
    it('returns root for root', () => {
      expect(getFolderName('/')).toBe('/');
    });

    it('returns the last segment', () => {
      expect(getFolderName('/work/project')).toBe('project');
    });
  });

  describe('getAncestorPaths', () => {
    it('returns empty for root', () => {
      expect(getAncestorPaths('/')).toEqual([]);
    });

    it('returns each ancestor from top down (inclusive of self)', () => {
      expect(getAncestorPaths('/work/project/sub')).toEqual([
        '/work',
        '/work/project',
        '/work/project/sub',
      ]);
    });
  });

  describe('remapFolderPath', () => {
    it('rewrites the base prefix when the path is under oldBase', () => {
      expect(remapFolderPath('/work/sub', '/work', '/archive')).toBe('/archive/sub');
      expect(remapFolderPath('/work', '/work', '/archive')).toBe('/archive');
    });

    it('leaves unrelated paths untouched', () => {
      expect(remapFolderPath('/other', '/work', '/archive')).toBe('/other');
    });
  });
});
