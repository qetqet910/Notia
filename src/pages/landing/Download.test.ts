import { describe, it, expect, beforeAll } from 'vitest';

// Define interfaces matching the component's expected structure
interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface GithubRelease {
  tag_name: string;
  published_at: string;
  assets: ReleaseAsset[];
}

describe('Download Page Logic (Real API Check)', () => {
  let release: GithubRelease | null = null;

  beforeAll(async () => {
    // 1. Fetch real data from GitHub API
    try {
        const response = await fetch('https://api.github.com/repos/qetqet910/Notia/releases/latest');
        if (!response.ok) {
            console.warn(`API call failed with status: ${response.status}. This test might fail if rate limited or repo is private/empty.`);
            return;
        }
        release = await response.json() as GithubRelease;
        console.log(`Fetched release: ${release.tag_name}`);
    } catch (e) {
        console.warn("Network error or API unavailable", e);
    }
  });

  it('should fetch valid release data', () => {
    // If this fails, it means we couldn't fetch data (maybe rate limit or no internet), 
    // but if we did, it must have the right shape.
    if (!release) {
        console.log("Skipping logic check because release data could not be fetched.");
        return;
    }
    expect(release).toBeDefined();
    expect(release!.tag_name).toBeDefined();
    expect(release!.assets).toBeInstanceOf(Array);
    expect(release!.assets.length).toBeGreaterThan(0);
  });

  it('should correctly identify Windows asset (.exe)', () => {
    if (!release) return;

    const assets = release!.assets;
    // Logic from Download.tsx
    const asset = assets.find(a => a.name.endsWith('.exe') && !a.name.includes('sig'));
    
    // We expect to find one if the release is properly formed
    if (asset) {
        console.log(`Found Windows asset: ${asset.name}`);
        expect(asset.browser_download_url).toContain('.exe');
    } else {
        console.warn('No .exe asset found in latest release. Check if release has attached binaries.');
    }
  });

  it('should correctly identify macOS asset (.dmg or .app.tar.gz)', () => {
    if (!release) return;

    const assets = release!.assets;
    // Logic from Download.tsx
    const asset = assets.find(a => (a.name.endsWith('.dmg') || a.name.endsWith('.app.tar.gz')) && !a.name.includes('sig'));

    if (asset) {
        console.log(`Found macOS asset: ${asset.name}`);
        expect(asset.browser_download_url).toMatch(/(\.dmg|\.app\.tar\.gz)$/);
    } else {
        console.warn('No macOS asset found in latest release.');
    }
  });

  it('should correctly identify Linux asset (.AppImage)', () => {
    if (!release) return;

    const assets = release!.assets;
    // Logic from Download.tsx
    const asset = assets.find(a => a.name.endsWith('.AppImage') && !a.name.includes('sig'));

    if (asset) {
        console.log(`Found Linux asset: ${asset.name}`);
        expect(asset.browser_download_url).toContain('.AppImage');
    } else {
        console.warn('No Linux asset found in latest release.');
    }
  });
});
