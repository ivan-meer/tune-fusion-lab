import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UnifiedMusicStudio from '../UnifiedMusicStudio';
import { useAuth } from '@/components/auth/AuthProvider';
import { useMusicGeneration } from '@/hooks/useMusicGeneration';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

// Mock the dependencies
vi.mock('@/components/auth/AuthProvider');
vi.mock('@/hooks/useMusicGeneration');
vi.mock('@/hooks/useRealtimeUpdates');
vi.mock('@/hooks/use-toast');

const mockUseAuth = vi.mocked(useAuth);
const mockUseMusicGeneration = vi.mocked(useMusicGeneration);
const mockUseRealtimeUpdates = vi.mocked(useRealtimeUpdates);

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true } })
    }
  }
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('UnifiedMusicStudio', () => {
  const mockGenerateMusic = vi.fn();
  const mockResetGeneration = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' },
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn()
    } as any);

    mockUseMusicGeneration.mockReturnValue({
      generateMusic: mockGenerateMusic,
      resetGeneration: mockResetGeneration,
      isGenerating: false,
      currentJob: null,
      connectProgress: vi.fn(),
      disconnectProgress: vi.fn()
    });

    mockUseRealtimeUpdates.mockReturnValue(undefined);
  });

  it('component mounts without errors', () => {
    const { container } = render(
      <TestWrapper>
        <UnifiedMusicStudio />
      </TestWrapper>
    );

    expect(container).toBeInTheDocument();
  });

  // TODO: Add comprehensive UI tests when testing library is properly configured
  it('renders without crashing with different states', () => {
    // Test with different generation states
    const states = [
      { isGenerating: false, currentJob: null },
      { 
        isGenerating: true, 
        currentJob: {
          id: 'test-job',
          status: 'processing' as const,
          progress: 50,
          request: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    ];

    states.forEach((state) => {
      mockUseMusicGeneration.mockReturnValue({
        generateMusic: mockGenerateMusic,
        resetGeneration: mockResetGeneration,
        connectProgress: vi.fn(),
        disconnectProgress: vi.fn(),
        ...state
      });

      const { container } = render(
        <TestWrapper>
          <UnifiedMusicStudio />
        </TestWrapper>
      );

      expect(container).toBeInTheDocument();
    });
  });
});