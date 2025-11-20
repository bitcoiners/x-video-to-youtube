// content-script.js - Simple video detection
console.log("X Video Detector loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'detectVideo') {
        detectVideo().then(sendResponse);
        return true;
    }
});

async function detectVideo() {
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const videos = Array.from(document.querySelectorAll('video'));
        if (videos.length === 0) {
            return { success: false, error: 'No videos found' };
        }

        const mainVideo = document.querySelector('[data-testid="tweet"] video') || videos[0];
        const videoUrl = mainVideo.src || mainVideo.currentSrc || '';
        
        const isBlobUrl = videoUrl.startsWith('blob:');
        
        const videoInfo = {
            duration: mainVideo.duration > 0 ? Math.round(mainVideo.duration) + 's' : 'Unknown',
            quality: mainVideo.videoWidth > 0 ? `${mainVideo.videoWidth}x${mainVideo.videoHeight}` : 'Unknown',
            source: isBlobUrl ? 'Streamed Video' : 'Direct URL',
            isBlobUrl: isBlobUrl,
            isDirect: !isBlobUrl
        };
        
        return {
            success: true,
            videoUrl: videoUrl,
            videoInfo: videoInfo
        };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}
