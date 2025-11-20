document.addEventListener('DOMContentLoaded', function() {
    const detectVideoBtn = document.getElementById('detectVideo');
    const downloadVideoBtn = document.getElementById('downloadVideo');
    const statusDiv = document.getElementById('status');
    const videoInfoDiv = document.getElementById('videoInfo');

    let currentVideoData = null;

    function updateStatus(message, type = 'info') {
        statusDiv.innerHTML = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
    }

    function showVideoInfo(info) {
        if (!info) return;
        
        let statusHtml = `
            <strong>🎯 Video Detection Result:</strong><br>
            Duration: ${info.duration || 'Unknown'}<br>
            Quality: ${info.quality || 'Unknown'}<br>
            Source: ${info.source || 'Unknown'}<br>
        `;
        
        if (info.isBlobUrl) {
            statusHtml += '<span style="color: orange;">⚠ Streamed Video - Use Video DownloadHelper</span>';
        } else {
            statusHtml += '<span style="color: green;">✓ Direct Download Available</span>';
        }
        
        videoInfoDiv.innerHTML = statusHtml;
        videoInfoDiv.style.display = 'block';
    }

    // Detect video
    detectVideoBtn.addEventListener('click', async () => {
        updateStatus('🔍 Searching for video...', 'info');
        detectVideoBtn.disabled = true;
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('twitter.com') && !tab.url.includes('x.com')) {
                updateStatus('❌ Please navigate to X.com or Twitter.com first.', 'error');
                detectVideoBtn.disabled = false;
                return;
            }
            
            const response = await chrome.tabs.sendMessage(tab.id, { 
                action: 'detectVideo'
            });
            
            if (response && response.success) {
                updateStatus('✅ Video detected!', 'success');
                showVideoInfo(response.videoInfo);
                downloadVideoBtn.disabled = false;
                
                currentVideoData = {
                    videoUrl: response.videoUrl,
                    videoInfo: response.videoInfo
                };
                
            } else {
                const errorMessage = response?.error || 'No video found';
                updateStatus('❌ ' + errorMessage, 'error');
            }
        } catch (error) {
            updateStatus('❌ Error detecting video', 'error');
        } finally {
            detectVideoBtn.disabled = false;
        }
    });

    // Download video - Simplified
    downloadVideoBtn.addEventListener('click', async () => {
        if (!currentVideoData) {
            updateStatus('❌ Please detect video first.', 'error');
            return;
        }

        const videoInfo = currentVideoData.videoInfo;
        
        if (videoInfo.isBlobUrl) {
            updateStatus(`
                <strong>🔒 Streamed Video Detected</strong><br><br>
                <strong>Recommended Solution:</strong><br>
                ✅ <strong>Video DownloadHelper</strong> (already installed)<br><br>
                <strong>How to use:</strong><br>
                1. The Video DownloadHelper icon should appear when video plays<br>
                2. Click the icon and select download quality<br>
                3. Save the video<br><br>
                <em>This extension specializes in streamed videos.</em>
            `, 'info');
        } else {
            // Direct download for non-streamed videos
            updateStatus('Attempting direct download...', 'info');
            
            chrome.runtime.sendMessage({
                action: 'downloadVideo',
                videoUrl: currentVideoData.videoUrl,
                filename: `x_video_${Date.now()}.mp4`
            }, (response) => {
                if (response && response.success) {
                    updateStatus('✅ Download started!', 'success');
                } else {
                    updateStatus('❌ Direct download failed. Try Video DownloadHelper.', 'error');
                }
            });
        }
    });

    // Initial setup
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs.length === 0) return;
        
        const url = tabs[0].url;
        if (!url.includes('twitter.com') && !url.includes('x.com')) {
            updateStatus('Please navigate to X.com to use this extension.', 'error');
            detectVideoBtn.disabled = true;
        } else {
            updateStatus('✅ On X.com - ready to detect video!', 'info');
        }
    });
});
