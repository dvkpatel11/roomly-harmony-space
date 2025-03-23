import React, { useEffect, useState, useCallback } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { getStorageStats, refreshImage, diagnoseImage } from '../../utils/imageStorage';

/**
 * Component to manage image cache refresh after login or reconnection
 * This component doesn't render anything - it just handles cache logic
 */
const ImageCacheManager: React.FC = () => {
  const { messages, loading } = useChatContext();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [firstAuthLoad, setFirstAuthLoad] = useState(true);
  const [refreshStats, setRefreshStats] = useState<{
    total: number;
    processed: number;
    refreshed: number;
    failed: number;
    cached: number;
  }>({
    total: 0,
    processed: 0,
    refreshed: 0,
    failed: 0,
    cached: 0
  });
  
  // Component mount debugging
  useEffect(() => {
    console.log('🖼️ ImageCacheManager mounted');
    
    const checkStats = async () => {
      try {
        const stats = await getStorageStats();
        console.log('🖼️ Current image storage stats:', stats);
      } catch (error) {
        console.error('Error getting image storage stats:', error);
      }
    };
    
    checkStats();
    
    return () => {
      console.log('🖼️ ImageCacheManager unmounted');
    };
  }, []);
  
  // Force first-time preload after user authentication
  useEffect(() => {
    if (user && firstAuthLoad && !loading) {
      console.log('🖼️ User authenticated - checking for images to preload');
      setFirstAuthLoad(false);
      
      // Slight delay to allow other components to initialize
      setTimeout(() => {
        refreshAllImages();
      }, 500);
    }
  }, [user, loading, firstAuthLoad]);
  
  // Refresh all images function
  const refreshAllImages = useCallback(async () => {
    if (refreshing || !user || loading) return;
    
    setRefreshing(true);
    console.log('🖼️ Starting comprehensive image cache refresh process');
    
    try {
      // Find all messages with images
      const imageMessages = messages.filter(msg => msg.image_url?.startsWith('img_'));
      
      if (imageMessages.length === 0) {
        console.log('🖼️ No image messages found to refresh');
        setRefreshing(false);
        return;
      }
      
      console.log(`🖼️ Found ${imageMessages.length} image messages to check/refresh`);
      
      // Track stats
      const stats = {
        total: imageMessages.length,
        processed: 0,
        refreshed: 0,
        failed: 0,
        cached: 0
      };
      
      // Process images with a slight delay to prevent UI blocking
      for (const message of imageMessages) {
        if (message.image_url && message.image_url.startsWith('img_')) {
          try {
            console.log(`🖼️ Diagnosing image for message ${message.id}: ${message.image_url}`);
            
            // Use diagnose to get detailed information
            const diagnostics = await diagnoseImage(message.image_url);
            
            if (diagnostics.exists) {
              if (diagnostics.refreshResult === 'success') {
                console.log(`🖼️ Successfully refreshed image: ${message.image_url}`);
                stats.refreshed++;
              } else {
                console.warn(`🖼️ Image exists but refresh failed: ${message.image_url}`, diagnostics.error);
                stats.failed++;
              }
            } else {
              console.warn(`🖼️ Image not found in storage: ${message.image_url}`);
              stats.failed++;
            }
          } catch (error) {
            console.warn(`🖼️ Failed to refresh image ${message.image_url}:`, error);
            stats.failed++;
          }
          
          stats.processed++;
          // Update stats every 5 images
          if (stats.processed % 5 === 0 || stats.processed === stats.total) {
            setRefreshStats({...stats});
            console.log(`🖼️ Refresh progress: ${stats.processed}/${stats.total} (refreshed: ${stats.refreshed}, failed: ${stats.failed})`);
          }
          
          // Add a small delay to prevent UI blocking
          if (stats.processed < stats.total) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }
      
      console.log(`🖼️ Image refresh complete. Refreshed: ${stats.refreshed}, Failed: ${stats.failed}, Total: ${stats.total}`);
    } catch (error) {
      console.error('Error during image refresh process:', error);
    } finally {
      setRefreshing(false);
    }
  }, [messages, user, loading, refreshing]);

  // Explicitly log message info
  useEffect(() => {
    if (!user || loading) return;
    
    const imageMessages = messages.filter(m => m.image_url?.startsWith('img_'));
    console.log(`🖼️ Current image message count: ${imageMessages.length}`, 
      imageMessages.length > 0 ? imageMessages[0] : 'No image messages');
    
  }, [messages, user, loading]);

  // This component doesn't render anything
  return null;
};

export default ImageCacheManager; 