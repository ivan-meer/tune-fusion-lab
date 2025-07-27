// ============================================================================
// TRACK VARIATIONS HOOK - Draft/Parent-Child Track Management
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TrackVariation, EnhancedTrack } from '@/types/musicGeneration';

/**
 * Hook for managing track variations and draft system
 * Handles parent-child relationships between tracks for easy navigation
 */
export function useTrackVariations() {
  const [variations, setVariations] = useState<TrackVariation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  // ============================================================================
  // VARIATION MANAGEMENT
  // ============================================================================
  
  /**
   * Load all variations for a specific track
   */
  const loadTrackVariations = useCallback(async (trackId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('track_variations')
        .select(`
          *,
          parent_track:tracks!parent_track_id(*),
          child_track:tracks!child_track_id(*)
        `)
        .or(`parent_track_id.eq.${trackId},child_track_id.eq.${trackId}`)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setVariations(data || []);
      console.log(`📊 Loaded ${data?.length || 0} variations for track ${trackId}`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load variations';
      console.error('❌ Error loading track variations:', err);
      setError(errorMessage);
      
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить вариации трека",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Create a new variation of an existing track
   */
  const createVariation = useCallback(async (
    parentTrackId: string,
    variationType: 'manual' | 'auto_improve' | 'style_change' | 'lyrics_change',
    newTrackData?: Partial<EnhancedTrack>
  ) => {
    try {
      console.log(`🎵 Creating ${variationType} variation for parent track ${parentTrackId}`);

      // If no new track data provided, we'll need to generate a new track
      if (!newTrackData?.id) {
        throw new Error('New track data with ID is required to create variation');
      }

      // Create the variation relationship
      const { data: variation, error: variationError } = await supabase
        .from('track_variations')
        .insert({
          parent_track_id: parentTrackId,
          child_track_id: newTrackData.id,
          variation_type: variationType
        })
        .select()
        .single();

      if (variationError) {
        throw variationError;
      }

      // Update the child track to reference the parent draft
      const { error: updateError } = await supabase
        .from('tracks')
        .update({ 
          parent_draft_id: parentTrackId,
          is_draft: false // Variations are not drafts themselves
        })
        .eq('id', newTrackData.id);

      if (updateError) {
        console.warn('⚠️ Failed to update child track parent reference:', updateError);
      }

      // Reload variations
      await loadTrackVariations(parentTrackId);

      toast({
        title: "✅ Вариация создана",
        description: `Новая ${variationType === 'manual' ? 'ручная' : 'автоматическая'} вариация трека готова`
      });

      console.log('✅ Variation created successfully:', variation.id);
      return variation;

    } catch (error) {
      console.error('❌ Error creating variation:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create variation';
      toast({
        title: "Ошибка создания вариации",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
    }
  }, [toast, loadTrackVariations]);

  /**
   * Delete a variation relationship (but not the tracks themselves)
   */
  const deleteVariation = useCallback(async (variationId: string) => {
    try {
      console.log(`🗑️ Deleting variation ${variationId}`);

      const { error } = await supabase
        .from('track_variations')
        .delete()
        .eq('id', variationId);

      if (error) {
        throw error;
      }

      // Update local state
      setVariations(prev => prev.filter(v => v.id !== variationId));

      toast({
        title: "✅ Вариация удалена",
        description: "Связь между треками удалена (сами треки сохранены)"
      });

      console.log('✅ Variation deleted successfully');

    } catch (error) {
      console.error('❌ Error deleting variation:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete variation';
      toast({
        title: "Ошибка удаления",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
    }
  }, [toast]);

  // ============================================================================
  // DRAFT SYSTEM
  // ============================================================================
  
  /**
   * Create a new draft track (parent for future variations)
   */
  const createDraft = useCallback(async (trackData: Partial<EnhancedTrack>) => {
    try {
      console.log('📝 Creating new draft track...');

      const { data: draft, error } = await supabase
        .from('tracks')
        .insert({
          ...trackData,
          is_draft: true,
          parent_draft_id: null // Drafts have no parent
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "📝 Драфт создан",
        description: "Новый родительский трек готов для создания вариаций"
      });

      console.log('✅ Draft created successfully:', draft.id);
      return draft;

    } catch (error) {
      console.error('❌ Error creating draft:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create draft';
      toast({
        title: "Ошибка создания драфта",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
    }
  }, [toast]);

  /**
   * Get all child variations for a parent track
   */
  const getChildVariations = useCallback((parentTrackId: string): TrackVariation[] => {
    return variations.filter(v => v.parent_track_id === parentTrackId);
  }, [variations]);

  /**
   * Get parent track for a child variation
   */
  const getParentTrack = useCallback((childTrackId: string): TrackVariation | null => {
    return variations.find(v => v.child_track_id === childTrackId) || null;
  }, [variations]);

  /**
   * Check if a track is a draft (parent track)
   */
  const isDraftTrack = useCallback(async (trackId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('is_draft')
        .eq('id', trackId)
        .single();

      if (error) {
        throw error;
      }

      return data?.is_draft || false;

    } catch (error) {
      console.error('❌ Error checking if track is draft:', error);
      return false;
    }
  }, []);

  // ============================================================================
  // UTILITIES
  // ============================================================================
  
  /**
   * Get variation tree structure for UI display
   */
  const getVariationTree = useCallback((rootTrackId: string) => {
    const children = getChildVariations(rootTrackId);
    const parent = getParentTrack(rootTrackId);
    
    return {
      hasParent: !!parent,
      parent: parent,
      children: children,
      isRoot: !parent && children.length > 0,
      isLeaf: !!parent && children.length === 0,
      isStandalone: !parent && children.length === 0
    };
  }, [getChildVariations, getParentTrack]);

  /**
   * Get formatted variation statistics
   */
  const getVariationStats = useCallback(() => {
    const stats = {
      totalVariations: variations.length,
      byType: {} as Record<string, number>,
      parentTracks: new Set<string>(),
      childTracks: new Set<string>()
    };

    variations.forEach(variation => {
      stats.byType[variation.variation_type] = (stats.byType[variation.variation_type] || 0) + 1;
      stats.parentTracks.add(variation.parent_track_id);
      stats.childTracks.add(variation.child_track_id);
    });

    return {
      ...stats,
      uniqueParents: stats.parentTracks.size,
      uniqueChildren: stats.childTracks.size
    };
  }, [variations]);

  // ============================================================================
  // RETURN API
  // ============================================================================
  
  return {
    // State
    variations,
    isLoading,
    error,
    
    // Core functions
    loadTrackVariations,
    createVariation,
    deleteVariation,
    
    // Draft system
    createDraft,
    isDraftTrack,
    
    // Queries
    getChildVariations,
    getParentTrack,
    getVariationTree,
    getVariationStats
  };
}