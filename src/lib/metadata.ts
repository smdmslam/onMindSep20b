/**
 * Functions for fetching metadata from URLs
 */

type MetadataResult = {
  title?: string;
  description?: string;
  tags?: string[];
  success: boolean;
  error?: string;
  channelName?: string;
};

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // Handle various YouTube URL formats including live streams
  const regexPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/watch\?.*v=)([^&?/]+)/,
    /youtube\.com\/shorts\/([^&?/]+)/,
    /youtube\.com\/live\/([^&?/]+)/ // Added support for live stream URLs
  ];

  for (const pattern of regexPatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract Vimeo video ID from various Vimeo URL formats
 */
export function extractVimeoVideoId(url: string): string | null {
  if (!url) return null;
  
  // Handle various Vimeo URL formats
  const regexPatterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/
  ];

  for (const pattern of regexPatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Determine video platform from URL
 */
export function getVideoPlatform(url: string): 'youtube' | 'vimeo' | 'unknown' {
  if (!url) return 'unknown';
  
  if (extractYouTubeVideoId(url)) return 'youtube';
  if (extractVimeoVideoId(url)) return 'vimeo';
  
  return 'unknown';
}

/**
 * Fetch metadata from a YouTube video
 */
export async function fetchYouTubeMetadata(videoId: string): Promise<MetadataResult> {
  try {
    console.log(`Fetching metadata for YouTube video ID: ${videoId}`);
    
    // Use YouTube's oEmbed API to get video information
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (!response.ok) {
      const errorResult = {
        success: false,
        error: `YouTube API returned status: ${response.status}`
      };
      console.log('YouTube API error response:', errorResult);
      return errorResult;
    }
    
    try {
      const data = await response.json();
      
      // Log the raw response for debugging
      console.log('YouTube API raw response:', data);
      
      // Validate that we have the expected data
      if (!data || typeof data !== 'object') {
        const errorResult = {
          success: false,
          error: 'Invalid response from YouTube API'
        };
        console.log('Invalid YouTube API response:', errorResult);
        return errorResult;
      }
      
      const result = {
        title: data.title || '',
        description: data.author_name ? `Video by ${data.author_name}` : '',
        tags: [],
        success: true,
        channelName: data.author_name || ''
      };
      
      console.log('Processed YouTube metadata:', result);
      return result;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return {
        success: false,
        error: 'Failed to parse YouTube API response'
      };
    }
  } catch (error) {
    console.error('Error fetching YouTube metadata:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error fetching YouTube metadata'
    };
  }
}

/**
 * Fetch metadata from any URL using Microlink API
 */
export async function fetchUrlMetadata(url: string): Promise<MetadataResult> {
  if (!url) {
    return {
      success: false,
      error: 'No URL provided'
    };
  }
  
  try {
    console.log(`Attempting to fetch metadata for URL: ${url}`);
    
    // Check if it's a YouTube URL first
    const youtubeVideoId = extractYouTubeVideoId(url);
    if (youtubeVideoId) {
      console.log(`Detected YouTube video ID: ${youtubeVideoId}`);
      return await fetchYouTubeMetadata(youtubeVideoId);
    }
    
    // For non-YouTube URLs, use Microlink API
    const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
    
    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch metadata: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    console.log('Microlink API response:', data);
    
    if (!data.data) {
      return {
        success: false,
        error: 'Invalid response from Microlink API'
      };
    }
    
    return {
      title: data.data.title || '',
      description: data.data.description || '',
      tags: [],
      success: true
    };
  } catch (error) {
    console.error('Error fetching URL metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error fetching URL metadata'
    };
  }
}