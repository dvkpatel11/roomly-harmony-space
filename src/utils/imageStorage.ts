/**
 * Image Storage Utility
 * 
 * Provides efficient storage and retrieval of images for the chat application
 * - Compresses images before storage
 * - Uses IndexedDB for persistent local storage
 * - Manages a cache for fast retrieval
 * - Handles cleanup of old images
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the database schema
interface ImageDBSchema extends DBSchema {
  images: {
    key: string;
    value: {
      data: Blob;
      timestamp: number;
      messageId: number;
      householdId: string;
      size: number;
      originalSize: number;
    };
    indexes: { 'by-household': string, 'by-timestamp': number };
  };
  metadata: {
    key: string;
    value: {
      totalSize: number;
      lastCleanup: number;
    };
  };
}

// Constants
const DB_NAME = 'roomly-images';
const DB_VERSION = 1;
const MAX_STORAGE_SIZE = 100 * 1024 * 1024; // 100MB max storage
const MAX_IMAGE_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const MAX_COMPRESSION_SIZE = 1024 * 1024; // 1MB - larger images get more compression
const MEMORY_CACHE_SIZE = 50; // Number of images to keep in memory

// Memory cache to avoid frequent DB access
const memoryCache = new Map<string, { blob: Blob, timestamp: number }>();

// Track DB connection
let dbPromise: Promise<IDBPDatabase<ImageDBSchema>> | null = null;

/**
 * Initialize the database connection
 */
const getDB = async (): Promise<IDBPDatabase<ImageDBSchema>> => {
  if (!dbPromise) {
    dbPromise = openDB<ImageDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create object stores and indexes
        const imageStore = db.createObjectStore('images', { keyPath: 'key' });
        imageStore.createIndex('by-household', 'householdId');
        imageStore.createIndex('by-timestamp', 'timestamp');
        
        db.createObjectStore('metadata', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
};

/**
 * Compress an image to reduce its size
 * @param file Original image file
 * @param maxWidth Maximum width of compressed image
 * @param quality Compression quality (0-1)
 * @returns Promise resolving to compressed image as Blob
 */
const compressImage = async (
  file: File | Blob,
  maxWidth = 1200,
  quality = 0.7
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // For very small images, skip compression
    if (file.size < 100 * 1024) { // 100KB
      resolve(file);
      return;
    }
    
    // Adjust quality based on image size for better compression of large files
    if (file.size > MAX_COMPRESSION_SIZE) {
      quality = 0.6; // More aggressive compression for large images
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Draw image to canvas with smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }
            console.log(`Image compressed: ${file.size} -> ${blob.size} bytes (${Math.round((blob.size / file.size) * 100)}%)`);
            resolve(blob);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Image loading failed'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('File reading failed'));
    };
  });
};

/**
 * Store an image in the database
 * @param imageData The image file or blob
 * @param messageId Associated message ID
 * @param householdId Associated household ID
 * @returns Promise resolving to a URL for the stored image
 */
export const storeImage = async (
  imageData: File | Blob,
  messageId: number,
  householdId: string
): Promise<string> => {
  try {
    const db = await getDB();
    
    // Generate a unique key for this image
    const key = `img_${messageId}_${Date.now()}`;
    const timestamp = Date.now();
    
    // Compress the image
    const compressedImage = await compressImage(imageData);
    
    // Store in the database
    await db.put('images', {
      key,
      data: compressedImage,
      timestamp,
      messageId,
      householdId,
      size: compressedImage.size,
      originalSize: imageData.size
    });
    
    // Update metadata
    const metadata = await db.get('metadata', 'stats') || {
      key: 'stats',
      totalSize: 0,
      lastCleanup: Date.now()
    };
    
    metadata.totalSize += compressedImage.size;
    await db.put('metadata', metadata);
    
    // Check if cleanup is needed
    if (metadata.totalSize > MAX_STORAGE_SIZE) {
      setTimeout(() => cleanupOldImages(), 100);
    }
    
    // Add to memory cache
    const objectUrl = URL.createObjectURL(compressedImage);
    memoryCache.set(key, { 
      blob: compressedImage, 
      timestamp 
    });
    
    // Maintain memory cache size
    if (memoryCache.size > MEMORY_CACHE_SIZE) {
      // Remove oldest item
      let oldestKey = '';
      let oldestTime = Infinity;
      
      for (const [k, v] of memoryCache.entries()) {
        if (v.timestamp < oldestTime) {
          oldestTime = v.timestamp;
          oldestKey = k;
        }
      }
      
      if (oldestKey) {
        const removed = memoryCache.get(oldestKey);
        if (removed) {
          URL.revokeObjectURL(URL.createObjectURL(removed.blob));
          memoryCache.delete(oldestKey);
        }
      }
    }
    
    return key;
  } catch (error) {
    console.error('Error storing image:', error);
    throw error;
  }
};

/**
 * Add a cache status check function
 * @param key The image key
 * @returns Promise resolving to cache status
 */
export const checkImageStatus = async (key: string): Promise<{
  inMemory: boolean;
  inDatabase: boolean;
  size?: number;
}> => {
  try {
    // Check memory cache
    const inMemory = memoryCache.has(key);
    
    // Check database
    const db = await getDB();
    const image = await db.get('images', key);
    
    return {
      inMemory,
      inDatabase: !!image,
      size: image?.size
    };
  } catch (error) {
    console.error('Error checking image status:', error);
    return {
      inMemory: false,
      inDatabase: false
    };
  }
};

/**
 * Force refresh an image from storage (useful after login/reconnect)
 * @param key The image key
 * @returns Promise resolving to a URL for the refreshed image
 */
export const refreshImage = async (key: string): Promise<string> => {
  try {
    // Remove from memory cache if present
    if (memoryCache.has(key)) {
      const cached = memoryCache.get(key);
      if (cached) {
        try {
          URL.revokeObjectURL(URL.createObjectURL(cached.blob));
        } catch (e) {
          console.log('Error revoking URL, continuing:', e);
        }
        memoryCache.delete(key);
      }
    }
    
    // Try to get fresh from database
    const db = await getDB();
    const image = await db.get('images', key);
    
    if (!image) {
      throw new Error(`Image with key ${key} not found in database during refresh`);
    }
    
    // Add to memory cache with fresh timestamp
    const blobUrl = URL.createObjectURL(image.data);
    memoryCache.set(key, {
      blob: image.data,
      timestamp: Date.now()
    });
    
    console.log(`Successfully refreshed image ${key}, size: ${image.size} bytes`);
    return blobUrl;
  } catch (error) {
    console.error('Error refreshing image:', error);
    throw error;
  }
};

/**
 * Retrieve an image from storage
 * @param key The image key
 * @returns Promise resolving to a URL for the image
 */
export const getImage = async (key: string): Promise<string> => {
  try {
    // Debug logging for image retrieval
    console.log(`Attempting to retrieve image with key: ${key}`);
    
    // Check memory cache first
    const cached = memoryCache.get(key);
    if (cached) {
      // Update timestamp to keep this image in cache longer
      cached.timestamp = Date.now();
      console.log(`Found image ${key} in memory cache, size: ${cached.blob.size} bytes`);
      return URL.createObjectURL(cached.blob);
    }
    
    console.log(`Image ${key} not in memory cache, checking database...`);
    
    // Retrieve from IndexedDB
    const db = await getDB();
    const image = await db.get('images', key);
    
    if (!image) {
      console.error(`Image with key ${key} not found in database`);
      throw new Error(`Image with key ${key} not found`);
    }
    
    console.log(`Found image ${key} in database, size: ${image.size} bytes`);
    
    // Add to memory cache
    const blobUrl = URL.createObjectURL(image.data);
    memoryCache.set(key, {
      blob: image.data,
      timestamp: Date.now()
    });
    
    return blobUrl;
  } catch (error) {
    console.error('Error retrieving image:', error);
    throw error;
  }
};

/**
 * Remove old images to free up storage space
 */
const cleanupOldImages = async (): Promise<void> => {
  try {
    const db = await getDB();
    const tx = db.transaction('images', 'readwrite');
    const index = tx.store.index('by-timestamp');
    
    // Get the stats
    const metadata = await db.get('metadata', 'stats') || {
      key: 'stats',
      totalSize: 0,
      lastCleanup: Date.now()
    };
    
    // Calculate cutoff date for old images
    const cutoffDate = Date.now() - MAX_IMAGE_AGE;
    
    // Find and delete old images
    let cursor = await index.openCursor();
    let freedSpace = 0;
    
    while (cursor) {
      if (cursor.value.timestamp < cutoffDate) {
        freedSpace += cursor.value.size;
        await cursor.delete();
        
        // Remove from memory cache if present
        if (memoryCache.has(cursor.value.key)) {
          memoryCache.delete(cursor.value.key);
        }
      }
      cursor = await cursor.continue();
    }
    
    // Update metadata
    if (freedSpace > 0) {
      metadata.totalSize = Math.max(0, metadata.totalSize - freedSpace);
      metadata.lastCleanup = Date.now();
      await db.put('metadata', metadata);
      
      console.log(`Cleaned up ${(freedSpace / 1024 / 1024).toFixed(2)}MB of old images`);
    }
  } catch (error) {
    console.error('Error cleaning up old images:', error);
  }
};

/**
 * Delete an image from storage
 * @param key The image key
 */
export const deleteImage = async (key: string): Promise<void> => {
  try {
    const db = await getDB();
    
    // Get the image to find its size
    const image = await db.get('images', key);
    if (image) {
      // Delete from database
      await db.delete('images', key);
      
      // Update metadata
      const metadata = await db.get('metadata', 'stats');
      if (metadata) {
        metadata.totalSize = Math.max(0, metadata.totalSize - image.size);
        await db.put('metadata', metadata);
      }
      
      // Remove from memory cache
      if (memoryCache.has(key)) {
        const cached = memoryCache.get(key);
        if (cached) {
          URL.revokeObjectURL(URL.createObjectURL(cached.blob));
        }
        memoryCache.delete(key);
      }
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};

/**
 * Get storage statistics
 * @returns Object with statistics about the storage
 */
export const getStorageStats = async (): Promise<{
  totalImages: number;
  totalSize: number;
  memoryCache: {
    count: number;
    keys: string[];
  };
  db: {
    initialized: boolean;
  };
}> => {
  try {
    // Memory cache information
    const memoryCacheCount = memoryCache.size;
    const memoryCacheKeys = Array.from(memoryCache.keys());
    
    // Try to get database statistics
    let totalImages = 0;
    let totalSize = 0;
    let dbInitialized = false;
    
    try {
      const db = await getDB();
      dbInitialized = true;
      
      // Count all images
      totalImages = await db.count('images');
      
      // Get total size from metadata
      const metadata = await db.get('metadata', 'stats');
      if (metadata) {
        totalSize = metadata.totalSize;
      } else {
        // If metadata doesn't exist, manually calculate
        const allImages = await db.getAll('images');
        totalSize = allImages.reduce((total, img) => total + (img.size || 0), 0);
      }
    } catch (dbError) {
      console.error('Error getting database statistics:', dbError);
    }
    
    return {
      totalImages,
      totalSize,
      memoryCache: {
        count: memoryCacheCount,
        keys: memoryCacheKeys
      },
      db: {
        initialized: dbInitialized
      }
    };
  } catch (error) {
    console.error('Error getting storage statistics:', error);
    return {
      totalImages: 0,
      totalSize: 0,
      memoryCache: {
        count: 0,
        keys: []
      },
      db: {
        initialized: false
      }
    };
  }
};

/**
 * Clears all images from storage (dangerous operation)
 * @returns Promise that resolves when all images are cleared
 */
export const clearAllImages = async (): Promise<void> => {
  try {
    console.log('Clearing all images from storage');
    
    // Clear memory cache
    memoryCache.clear();
    
    // Clear database
    const db = await getDB();
    
    // Clear images table
    await db.clear('images');
    
    // Reset metadata - using correct structure that matches the interface
    await db.put('metadata', {
      key: 'stats',
      totalSize: 0,
      lastCleanup: Date.now()
    });
    
    console.log('All images cleared from storage');
  } catch (error) {
    console.error('Error clearing all images:', error);
    throw error;
  }
};

/**
 * Diagnose image loading issues
 * This attempts to reload a specific image and provides detailed diagnostics
 * @param imageKey The image key to diagnose
 * @returns Promise resolving to a diagnostic report
 */
export const diagnoseImage = async (imageKey: string): Promise<{
  key: string;
  exists: boolean;
  inMemory: boolean;
  inDatabase: boolean;
  refreshResult: 'success' | 'failed';
  size?: number;
  error?: string;
  blob?: Blob;
}> => {
  try {
    console.log(`Diagnosing image: ${imageKey}`);
    
    // Check if key format is valid
    if (!imageKey.startsWith('img_')) {
      return {
        key: imageKey,
        exists: false,
        inMemory: false,
        inDatabase: false,
        refreshResult: 'failed',
        error: 'Invalid image key format. Should start with "img_"'
      };
    }
    
    // Check memory cache
    const inMemory = memoryCache.has(imageKey);
    let cachedBlob = inMemory ? memoryCache.get(imageKey)?.blob : undefined;
    
    // Check database
    let dbResult = { exists: false, blob: null as Blob | null, size: 0 };
    try {
      const db = await getDB();
      const image = await db.get('images', imageKey);
      
      if (image) {
        dbResult = {
          exists: true,
          blob: image.data,
          size: image.size
        };
      }
    } catch (dbError) {
      console.error(`Database error during diagnosis of ${imageKey}:`, dbError);
    }
    
    // Attempt to refresh the image
    let refreshError: string | undefined;
    let refreshSuccess = false;
    
    try {
      if (dbResult.exists) {
        await refreshImage(imageKey);
        refreshSuccess = true;
      } else {
        refreshError = 'Image not found in database, cannot refresh';
      }
    } catch (refreshErr: any) {
      refreshError = refreshErr.message || 'Unknown refresh error';
    }
    
    // Get the updated memory cache status after refresh
    const updatedInMemory = memoryCache.has(imageKey);
    const updatedBlob = updatedInMemory ? memoryCache.get(imageKey)?.blob : undefined;
    
    return {
      key: imageKey,
      exists: dbResult.exists || inMemory,
      inMemory: updatedInMemory,
      inDatabase: dbResult.exists,
      refreshResult: refreshSuccess ? 'success' : 'failed',
      size: dbResult.size,
      error: refreshError,
      blob: updatedBlob || cachedBlob || dbResult.blob || undefined
    };
  } catch (error: any) {
    console.error(`Error diagnosing image ${imageKey}:`, error);
    return {
      key: imageKey,
      exists: false,
      inMemory: false,
      inDatabase: false,
      refreshResult: 'failed',
      error: error.message || 'Unknown diagnostic error'
    };
  }
}; 