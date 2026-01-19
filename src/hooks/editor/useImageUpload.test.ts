/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { useImageUpload } from './useImageUpload';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '@/services/supabaseClient';
import * as tauriApi from '@tauri-apps/api/core';

// --- Mocks ---

// 1. Mock useAuthStore
const mockUser = { id: 'test-user-id' };
const mockUseAuthStore = vi.fn(() => ({ user: mockUser }));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

// 2. Mock useToast
const mockToast = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// 3. Mock isTauri
const mockIsTauri = vi.fn();
vi.mock('@/utils/isTauri', () => ({
  isTauri: () => mockIsTauri(),
}));

// 4. Mock Supabase
vi.mock('@/services/supabaseClient', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
  },
}));

// 5. Mock Tauri Invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('useImageUpload Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: mockUser }); // Default: logged in
    mockIsTauri.mockReturnValue(false); // Default: Web environment
  });

  it('should return null and show toast if user is not logged in', async () => {
    mockUseAuthStore.mockReturnValue({ user: null });
    const { result } = renderHook(() => useImageUpload());

    const file = new File(['dummy'], 'test.png', { type: 'image/png' });
    const url = await result.current.handleImageUpload(file);

    expect(url).toBeNull();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: '오류',
      description: '이미지를 업로드하려면 로그인이 필요합니다.',
    }));
  });

  it('should return null and show toast if file is too large (>10MB)', async () => {
    const largeFile = { 
      name: 'large.png', 
      size: 1024 * 1024 * 11, // 11MB
      type: 'image/png' 
    } as File;
    
    const { result } = renderHook(() => useImageUpload());
    const url = await result.current.handleImageUpload(largeFile);

    expect(url).toBeNull();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      description: '이미지 파일 크기는 10MB를 초과할 수 없습니다.',
    }));
  });

  it('should upload file successfully in Web environment', async () => {
    const publicUrl = 'https://supabase.co/storage/bucket/test.png';
    
    // Setup Supabase Mocks
    const uploadMock = vi.fn().mockResolvedValue({ data: { path: 'path' }, error: null });
    const getUrlMock = vi.fn().mockReturnValue({ data: { publicUrl } });
    
    (supabase.storage.from as any).mockReturnValue({
      upload: uploadMock,
      getPublicUrl: getUrlMock,
    });

    const { result } = renderHook(() => useImageUpload());
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });

    let url;
    await act(async () => {
      url = await result.current.handleImageUpload(file);
    });

    // Check loading state (it toggles fast, but we can check the result)
    expect(url).toBe(publicUrl);
    
    // Verify Upload Call
    expect(uploadMock).toHaveBeenCalledTimes(1);
    // Path should start with userId
    expect(uploadMock.mock.calls[0][0]).toMatch(/^test-user-id\/.+\.png$/);
  });

  it('should use optimized image in Tauri environment', async () => {
    mockIsTauri.mockReturnValue(true);
    const optimizedBase64 = btoa('optimized-content'); // Mock optimized data
    (tauriApi.invoke as any).mockResolvedValue(optimizedBase64);

    const publicUrl = 'https://supabase.co/storage/bucket/optimized.webp';
     // Setup Supabase Mocks
     const uploadMock = vi.fn().mockResolvedValue({ data: { path: 'path' }, error: null });
     const getUrlMock = vi.fn().mockReturnValue({ data: { publicUrl } });
     
     (supabase.storage.from as any).mockReturnValue({
       upload: uploadMock,
       getPublicUrl: getUrlMock,
     });

    const { result } = renderHook(() => useImageUpload());
    const file = new File(['raw content'], 'test.png', { type: 'image/png' });

    let url;
    await act(async () => {
      url = await result.current.handleImageUpload(file);
    });

    // Verify Tauri optimize_image was called
    expect(tauriApi.invoke).toHaveBeenCalledWith('optimize_image', expect.any(Object));

    // Verify Upload used the optimized file (should be webp)
    expect(uploadMock).toHaveBeenCalledTimes(1);
    const uploadedFileArg = uploadMock.mock.calls[0][1];
    expect(uploadedFileArg.type).toBe('image/webp');
    
    expect(url).toBe(publicUrl);
  });

  it('should handle upload errors gracefully', async () => {
    // Setup Supabase Error Mock
    const uploadMock = vi.fn().mockResolvedValue({ data: null, error: new Error('Upload failed') });
    (supabase.storage.from as any).mockReturnValue({ upload: uploadMock });

    const { result } = renderHook(() => useImageUpload());
    const file = new File(['content'], 'test.png', { type: 'image/png' });

    const url = await result.current.handleImageUpload(file);

    expect(url).toBeNull();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: '업로드 실패',
    }));
  });
});
