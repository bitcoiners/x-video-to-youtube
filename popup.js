document.addEventListener('DOMContentLoaded', function() {
    const detectVideoBtn = document.getElementById('detectVideo');
    const downloadVideoBtn = document.getElementById('downloadVideo');
    const uploadYouTubeBtn = document.getElementById('uploadYouTube');
    const statusDiv = document.getElementById('status');
    const videoInfoDiv = document.getElementById('videoInfo');

    // Update status message
    function updateStatus(message, type = 'info') {
        statusDiv.innerHTML = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
    }

    // Show video information
    function showVideoInfo(info) {
        videoInfoDiv.innerHTML = `
            <strong>Video Found:</strong><br>
            Duration: ${info.duration || 'Unknown'}<br>
            Quality: ${info.quality || 'Unknown'}<br>
            Type: ${info.type || 'Unknown'}
        `;
        videoInfoDiv.style.display = 'block';
    }

    // Detect video on current X page
    detectVideoBtn.addEventListener('click', async () => {
        updateStatus('Searching for video on this X page...', 'info');
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            console.log("Current tab:", tab.url);
            
            // Check if we're on X/Twitter
            if (!tab.url.includes('twitter.com') && !tab.url.includes('x.com')) {
                updateStatus('Please navigate to X.com or Twitter.com to use this extension.', 'error');
                return;
            }
            
            // Send message to content script with error handling
            try {
                const response = await chrome.tabs.sendMessage(tab.id, { 
                    action: 'detectVideo'
                });
                
                console.log("Response from content script:", response);
                
                if (response && response.success) {
                    updateStatus('X video detected successfully!', 'success');
                    showVideoInfo(response.videoInfo);
                    downloadVideoBtn.disabled = false;
                    
                    // Store video URL for download
                    await chrome.storage.local.set({ 
                        videoUrl: response.videoUrl,
                        videoInfo: response.videoInfo
                    });
                    
                    console.log("X video URL stored:", response.videoUrl);
                } else {
                    const errorMsg = response?.error || 'No video found';
                    const debugInfo = response?.debug ? `<br><small>Debug: ${JSON.stringify(response.debug)}</small>` : '';
                    updateStatus(`No X video found: ${errorMsg}${debugInfo}`, 'error');
                }
            } catch (sendError) {
                console.error("Message sending error:", sendError);
                updateStatus(
                    'Content script not loaded. Try refreshing the X page and try again. Error: ' + sendError.message, 
                    'error'
                );
            }
        } catch (error) {
            console.error("General error:", error);
            updateStatus('Error detecting X video: ' + error.message, 'error');
        }
    });

    // Download video
    downloadVideoBtn.addEventListener('click', async () => {
        updateStatus('Downloading X video...', 'info');
        
        try {
            const data = await chrome.storage.local.get(['videoUrl']);
            console.log("Retrieved X video URL:", data.videoUrl);
            
            if (data.videoUrl) {
                // Send download request to background script
                chrome.runtime.sendMessage({
                    action: 'downloadVideo',
                    videoUrl: data.videoUrl,
                    filename: `x_video_${Date.now()}.mp4`
                }, (response) => {
                    if (response && response.success) {
                        updateStatus('X video downloaded successfully!', 'success');
                        uploadYouTubeBtn.disabled = false;
                        
                        // Store downloaded file info
                        chrome.storage.local.set({ 
                            downloadedFile: response.filename 
                        });
                    } else {
                        const errorMsg = response?.error || 'Unknown error';
                        updateStatus('X video download failed: ' + errorMsg, 'error');
                    }
                });
            } else {
                updateStatus('No X video URL found. Please detect video first.', 'error');
            }
        } catch (error) {
            updateStatus('X video download error: ' + error.message, 'error');
        }
    });

    // Upload to YouTube
    uploadYouTubeBtn.addEventListener('click', async () => {
        updateStatus('Preparing to upload X video to YouTube...', 'info');
        
        try {
            const data = await chrome.storage.local.get(['downloadedFile', 'videoInfo']);
            if (data.downloadedFile) {
                updateStatus('X video ready for YouTube upload. This feature requires YouTube API setup.', 'info');
                alert('X Video to YouTube: Upload feature would connect to YouTube API here.\n\nFor now, the video has been downloaded to your computer.');
            } else {
                updateStatus('Please download an X video first before uploading to YouTube.', 'error');
            }
        } catch (error) {
            updateStatus('YouTube upload error: ' + error.message, 'error');
        }
    });

    // Check if we're on an X page when popup opens
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0].url;
        if (!url.includes('twitter.com') && !url.includes('x.com')) {
            updateStatus('Please navigate to X.com to use this extension.', 'error');
            detectVideoBtn.disabled = true;
        } else {
            updateStatus('Ready! Click "Detect X Video" to find videos on this X page.', 'info');
        }
    });

    // Load any previously detected video info
    chrome.storage.local.get(['videoInfo'], (data) => {
        if (data.videoInfo) {
            showVideoInfo(data.videoInfo);
            downloadVideoBtn.disabled = false;
            updateStatus('Previous X video detected. Ready to download.', 'info');
        }
    });
});
