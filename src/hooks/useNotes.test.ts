import { renderHook } from '@testing-library/react';
import { useNotes } from './useNotes';
import { useDataStore } from '@/stores/dataStore';
import { useAuthStore } from '@/stores/authStore';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/services/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    })),
    channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
    })),
  },
}));

// Mock isTauri
vi.mock('@/utils/isTauri', () => ({
    isTauri: () => false,
}));

describe('useNotes Hook', () => {
  beforeEach(() => {
    useDataStore.setState({ 
        notes: {}, 
        isInitialized: true,
        channels: [],
        activityCache: null
    });
    // Mock user in auth store
    useAuthStore.setState({ 
        user: { id: 'user-1', email: 'test@test.com' } as any,
        session: {} as any
    });
  });

  it('should filter out deleted notes from "notes" list', () => {
    useDataStore.setState({
      notes: {
        'n1': { 
            id: 'n1', 
            owner_id: 'user-1', 
            title: 'Active Note', 
            deleted_at: null, 
            updated_at: '2024-01-01T10:00:00Z', 
            reminders: [],
            tags: [],
            created_at: '2024-01-01T10:00:00Z'
        } as any,
        'n2': { 
            id: 'n2', 
            owner_id: 'user-1', 
            title: 'Deleted Note', 
            deleted_at: '2024-01-02T10:00:00Z', 
            updated_at: '2024-01-02T10:00:00Z', 
            reminders: [],
            tags: [],
            created_at: '2024-01-01T10:00:00Z'
        } as any,
      }
    });

    const { result } = renderHook(() => useNotes());
    
    // Main list should only have active notes
    expect(result.current.notes).toHaveLength(1);
    expect(result.current.notes[0].id).toBe('n1');
    
    // Trash list should only have deleted notes
    expect(result.current.trashNotes).toHaveLength(1);
    expect(result.current.trashNotes[0].id).toBe('n2');
  });

  it('should sort notes by is_pinned (desc) then updated_at (desc)', () => {
    useDataStore.setState({
      notes: {
        'n1': { 
            id: 'n1', owner_id: 'user-1', title: 'Normal New', 
            is_pinned: false, 
            updated_at: '2024-01-02T10:00:00Z' 
        } as any,
        'n2': { 
            id: 'n2', owner_id: 'user-1', title: 'Pinned Old', 
            is_pinned: true, 
            updated_at: '2024-01-01T10:00:00Z' 
        } as any,
        'n3': { 
            id: 'n3', owner_id: 'user-1', title: 'Normal Old', 
            is_pinned: false, 
            updated_at: '2024-01-01T10:00:00Z' 
        } as any,
        'n4': { 
            id: 'n4', owner_id: 'user-1', title: 'Pinned New', 
            is_pinned: true, 
            updated_at: '2024-01-03T10:00:00Z' 
        } as any,
      }
    });

    const { result } = renderHook(() => useNotes());
    const ids = result.current.notes.map(n => n.id);
    
    // Expected Order:
    // 1. Pinned New (n4)
    // 2. Pinned Old (n2)
    // 3. Normal New (n1)
    // 4. Normal Old (n3)
    expect(ids).toEqual(['n4', 'n2', 'n1', 'n3']);
  });
});
