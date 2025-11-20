// Background service worker for X Video to YouTube extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('X Video to YouTube extension installed');
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);
    
    if (request.action === 'downloadVideo') {
        handleVideoDownload(request, sender, sendResponse);
        return true;
    }
    
    sendResponse({ success: false, error: 'Unknown action' });
});

// Handle video download
async function handleVideoDownload(request, sender, sendResponse) {
    try {
        const { videoUrl, filename } = request;
        
        if (!videoUrl) {
            throw new Error('No video URL provided');
        }

        console.log('Downloading video:', videoUrl);
        
        // Use the downloads API
        const downloadId = await chrome.downloads.download({
            url: videoUrl,
            filename: filename || `x_video_${Date.now()}.mp4`,
            saveAs: true,
            conflictAction: 'uniquify'
        });

        console.log('Download initiated with ID:', downloadId);

        sendResponse({ 
            success: true, 
            downloadId: downloadId, 
            filename: filename 
        });
        
    } catch (error) {
        console.error('Download error:', error);
        sendResponse({ 
            success: false, 
            error: error.message 
        });
    }
}

console.log('X Video to YouTube background service worker started');
