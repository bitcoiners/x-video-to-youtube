// Content script to detect and extract videos from X (Twitter)
console.log("X Video to YouTube content script loaded");

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("X Video content script received message:", request);
  
  if (request.action === 'detectVideo') {
    try {
      const videoInfo = detectXVideo();
      console.log("X video detection result:", videoInfo);
      sendResponse(videoInfo);
    } catch (error) {
      console.error("Error in X video detection:", error);
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    }
  }
  
  return true; // Keep message channel open for async response
});

// Improved X video detection function
function detectXVideo() {
  console.log("Starting X video detection...");
  
  // Method 1: Look for video elements directly
  const videos = document.querySelectorAll('video');
  console.log(`Found ${videos.length} video elements on X page`);
  
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    console.log(`X Video ${i}:`, {
      src: video.src,
      currentSrc: video.currentSrc,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      duration: video.duration
    });
    
    // Check if this is a main X post video (not background/small)
    if (isMainXVideo(video)) {
      const videoUrl = extractXVideoUrl(video);
      if (videoUrl) {
        return {
          success: true,
          videoUrl: videoUrl,
          videoInfo: {
            duration: formatDuration(video.duration),
            quality: `${video.videoWidth}x${video.videoHeight}`,
            type: 'MP4',
            source: 'direct',
            platform: 'X (Twitter)'
          }
        };
      }
    }
  }
  
  // Method 2: Look for X's specific video containers
  const containerVideo = findVideoInXContainers();
  if (containerVideo) {
    return containerVideo;
  }
  
  // Method 3: Try to find video in article containers (main X posts)
  const articleVideo = findVideoInXArticles();
  if (articleVideo) {
    return articleVideo;
  }
  
  return { 
    success: false, 
    error: 'No suitable X video found. Make sure you are on an X post with a video and the video is fully loaded.',
    debug: {
      videoCount: videos.length,
      videoDetails: Array.from(videos).map(v => ({
        src: v.src,
        dimensions: `${v.videoWidth}x${v.videoHeight}`,
        duration: v.duration
      }))
    }
  };
}

// Check if video is likely the main X post video
function isMainXVideo(video) {
  // Look for videos that are actually visible and have reasonable size
  const rect = video.getBoundingClientRect();
  const isVisible = rect.width > 200 && rect.height > 100;
  const hasContent = video.videoWidth > 0 && video.videoHeight > 0;
  
  // Check if video is within an X post container
  const inXPost = video.closest('[data-testid="tweet"]') || 
                  video.closest('article') ||
                  video.closest('[data-testid="cellInnerDiv"]') ||
                  video.closest('[data-testid="primaryColumn"]');
  
  return isVisible && hasContent && inXPost;
}

// Extract X video URL from video element
function extractXVideoUrl(video) {
  // Try different sources in priority order
  if (video.src && video.src.startsWith('blob:')) {
    // For blob URLs, try to find the actual MP4 source
    return findXVideoMp4Source(video);
  } else if (video.src && (video.src.includes('.mp4') || video.src.includes('video.twimg.com'))) {
    return video.src;
  } else if (video.currentSrc && video.currentSrc !== video.src) {
    return video.currentSrc;
  }
  
  return null;
}

// Find MP4 source for blob URLs on X
function findXVideoMp4Source(videoElement) {
  // Look for source elements or track network requests in parent
  const sources = videoElement.querySelectorAll('source');
  for (const source of sources) {
    if (source.src && source.src.includes('.mp4')) {
      return source.src;
    }
  }
  
  // Look in parent elements for data attributes
  const parent = videoElement.closest('div');
  if (parent) {
    const dataUrl = parent.getAttribute('data-video-url') || 
                    parent.getAttribute('data-src') ||
                    parent.getAttribute('data-video-src');
    if (dataUrl && dataUrl.includes('.mp4')) {
      return dataUrl;
    }
  }
  
  return null;
}

// Look for videos in X-specific containers
function findVideoInXContainers() {
  const selectors = [
    '[data-testid="videoComponent"] video',
    '[data-testid="videoPlayer"] video',
    'article video',
    '[role="article"] video',
    '.css-1dbjc4n video', // X's common class
    '[data-testid="tweetVideo"] video'
  ];
  
  for (const selector of selectors) {
    const video = document.querySelector(selector);
    if (video && video.src) {
      const videoUrl = extractXVideoUrl(video);
      if (videoUrl) {
        return {
          success: true,
          videoUrl: videoUrl,
          videoInfo: {
            duration: formatDuration(video.duration),
            quality: `${video.videoWidth}x${video.videoHeight}`,
            type: 'MP4',
            source: 'x-container',
            platform: 'X (Twitter)'
          }
        };
      }
    }
  }
  
  return null;
}

// Look for videos in X article elements (main posts)
function findVideoInXArticles() {
  const articles = document.querySelectorAll('article, [role="article"]');
  console.log(`Found ${articles.length} X articles on page`);
  
  for (const article of articles) {
    const video = article.querySelector('video');
    if (video && isMainXVideo(video)) {
      const videoUrl = extractXVideoUrl(video);
      if (videoUrl) {
        return {
          success: true,
          videoUrl: videoUrl,
          videoInfo: {
            duration: formatDuration(video.duration),
            quality: `${video.videoWidth}x${video.videoHeight}`,
            type: 'MP4',
            source: 'x-article',
            platform: 'X (Twitter)'
          }
        };
      }
    }
  }
  return null;
}

// Format video duration
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return 'Unknown';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Monitor for new X videos loaded dynamically
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) { // Element node
        if (node.querySelector && node.querySelector('video')) {
          console.log('New X video content detected on page');
        }
      }
    });
  });
});

// Start observing when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  });
} else {
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
}

// Log when content script is loaded
console.log("X Video to YouTube content script initialized successfully");
