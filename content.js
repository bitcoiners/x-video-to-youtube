// Content script to detect and extract videos from X (Twitter)
console.log("X Video to YouTube content script loaded");

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("X Video content script received message:", request);
  
  if (request.action === 'detectVideo') {
    try {
      const videoInfo = detectMainPostVideo();
      console.log("Main post video detection result:", videoInfo);
      sendResponse(videoInfo);
    } catch (error) {
      console.error("Error in video detection:", error);
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    }
  }
  
  return true;
});

// Main function to detect ONLY the main post video
function detectMainPostVideo() {
  console.log("🔍 Starting main post video detection...");
  
  if (!isTweetPage()) {
    return { 
      success: false, 
      error: 'Please navigate to a specific tweet page (URL should contain /status/).' 
    };
  }

  const mainVideo = findMainVideoWithMultipleStrategies();
  
  if (mainVideo && mainVideo.videoElement) {
    const videoUrl = extractDirectVideoUrl(mainVideo.videoElement);
    
    if (videoUrl) {
      return {
        success: true,
        videoUrl: videoUrl,
        videoInfo: {
          duration: formatDuration(mainVideo.videoElement.duration),
          quality: `${mainVideo.videoElement.videoWidth}x${mainVideo.videoElement.videoHeight}`,
          type: 'MP4',
          source: mainVideo.source,
          isDirect: true,
          requiresManual: false,
          confidence: mainVideo.confidence,
          isBlobUrl: false
        }
      };
    } else {
      // Return blob URL with manual flag
      const blobUrl = mainVideo.videoElement.src || mainVideo.videoElement.currentSrc;
      return {
        success: true,
        videoUrl: blobUrl,
        videoInfo: {
          duration: formatDuration(mainVideo.videoElement.duration),
          quality: `${mainVideo.videoElement.videoWidth}x${mainVideo.videoElement.videoHeight}`,
          type: 'Video',
          source: mainVideo.source + '_blob',
          isDirect: false,
          requiresManual: true,
          confidence: mainVideo.confidence,
          isBlobUrl: true
        }
      };
    }
  }

  return { 
    success: false, 
    error: 'No video found on this tweet page.' 
  };
}

// Check if we're on a tweet page
function isTweetPage() {
  const url = window.location.href;
  return url.includes('/status/') || url.includes('/i/status/');
}

// Use multiple strategies to find the main video
function findMainVideoWithMultipleStrategies() {
  const strategies = [
    { name: 'timeline_article', method: findVideoInTimelineArticle },
    { name: 'tweet_testid', method: findVideoInTweetTestId },
    { name: 'primary_column', method: findVideoInPrimaryColumn },
    { name: 'largest_video', method: findLargestVideo }
  ];

  for (const strategy of strategies) {
    try {
      const result = strategy.method();
      if (result && result.videoElement) {
        console.log(`✅ Strategy ${strategy.name} found video`);
        return result;
      }
    } catch (error) {
      console.log(`Strategy ${strategy.name} failed:`, error);
    }
  }

  return null;
}

// Strategy 1: Look for timeline article
function findVideoInTimelineArticle() {
  const articles = document.querySelectorAll('article');
  
  for (const article of articles) {
    const rect = article.getBoundingClientRect();
    if (rect.top < 500 && rect.width > 500) {
      const video = article.querySelector('video');
      if (video && isVideoValid(video)) {
        return {
          videoElement: video,
          source: 'timeline_article',
          confidence: 'high'
        };
      }
    }
  }
  return null;
}

// Strategy 2: Look for tweet with data-testid
function findVideoInTweetTestId() {
  const tweetContainers = document.querySelectorAll('[data-testid="tweet"]');
  
  for (const container of tweetContainers) {
    const rect = container.getBoundingClientRect();
    if (rect.top < 600) {
      const video = container.querySelector('video');
      if (video && isVideoValid(video)) {
        return {
          videoElement: video,
          source: 'tweet_testid',
          confidence: 'high'
        };
      }
    }
  }
  return null;
}

// Strategy 3: Look in primary column
function findVideoInPrimaryColumn() {
  const primaryColumn = document.querySelector('[data-testid="primaryColumn"]');
  if (primaryColumn) {
    const videos = primaryColumn.querySelectorAll('video');
    
    for (const video of videos) {
      if (isVideoValid(video)) {
        const rect = video.getBoundingClientRect();
        if (rect.top < 800) {
          return {
            videoElement: video,
            source: 'primary_column',
            confidence: 'medium'
          };
        }
      }
    }
  }
  return null;
}

// Strategy 4: Find largest visible video
function findLargestVideo() {
  const videos = Array.from(document.querySelectorAll('video'));
  
  let bestVideo = null;
  let bestSize = 0;
  
  for (const video of videos) {
    if (isVideoValid(video)) {
      const rect = video.getBoundingClientRect();
      const size = rect.width * rect.height;
      
      if (size > 10000 && isElementInViewport(video)) {
        if (size > bestSize) {
          bestSize = size;
          bestVideo = video;
        }
      }
    }
  }
  
  if (bestVideo) {
    return {
      videoElement: bestVideo,
      source: 'largest_visible',
      confidence: 'low'
    };
  }
  
  return null;
}

// Check if video element is valid
function isVideoValid(video) {
  return video && 
         typeof video.videoWidth === 'number' && 
         typeof video.videoHeight === 'number' &&
         video.videoWidth > 0 && 
         video.videoHeight > 0;
}

// Check if element is in viewport
function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Extract direct video URL
function extractDirectVideoUrl(video) {
  if (video.src && isDirectVideoUrl(video.src)) {
    return video.src;
  }
  
  if (video.currentSrc && video.currentSrc !== video.src && isDirectVideoUrl(video.currentSrc)) {
    return video.currentSrc;
  }
  
  const sources = video.querySelectorAll('source');
  for (const source of sources) {
    if (source.src && isDirectVideoUrl(source.src)) {
      return source.src;
    }
  }
  
  return null;
}

// Check if URL is a direct video URL
function isDirectVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  return (
    (url.includes('.mp4') || 
     url.includes('video.twimg.com') ||
     url.includes('.m3u8')) &&
    (url.startsWith('http') && !url.startsWith('blob:'))
  );
}

// Format duration
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return 'Unknown';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

console.log("X Video to YouTube content script initialized");
