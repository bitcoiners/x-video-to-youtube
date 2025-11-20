// Background service worker for X Video to YouTube extension

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('X Video to YouTube extension installed successfully');
    
    // Set default storage values
    chrome.storage.local.set({
        extensionVersion: '1.0',
        lastUsed: new Date().toISOString()
    });
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('X Video to YouTube background received message:', request);
    
    if (request.action === 'downloadVideo') {
        handleXVideoDownload(request, sender, sendResponse);
        return true; // Keep message channel open for async response
    }
    
    // Add other action handlers here as needed
});

// Handle X video download
async function handleXVideoDownload(request, sender, sendResponse) {
    try {
        const { videoUrl, filename } = request;
        
        console.log(`Starting X video download: ${filename}`);
        
        // Use the downloads API to download the X video
        const downloadId = await chrome.downloads.download({
            url: videoUrl,
            filename: `x_videos/${filename}`,
            saveAs: true,
            conflictAction: 'uniquify'
        });
        
        console.log(`X video download started with ID: ${downloadId}`);
        
        sendResponse({ 
            success: true, 
            downloadId: downloadId, 
            filename: filename 
        });
        
    } catch (error) {
        console.error('X video download error:', error);
        sendResponse({ 
            success: false, 
            error: error.message 
        });
    }
}

// Monitor X video download progress
chrome.downloads.onChanged.addListener((downloadDelta) => {
    if (downloadDelta.state && downloadDelta.state.current === 'complete') {
        console.log('X video download completed:', downloadDelta.id);
        
        // Update storage with download completion info
        chrome.storage.local.set({
            lastDownload: new Date().toISOString(),
            lastDownloadId: downloadDelta.id
        });
    }
    
    if (downloadDelta.state && downloadDelta.state.current === 'interrupted') {
        console.log('X video download interrupted:', downloadDelta.id);
    }
});

// Handle tab updates to detect X pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        if (tab.url.includes('twitter.com') || tab.url.includes('x.com')) {
            console.log('X page loaded, content script should be active:', tab.url);
            
            // Update badge or icon to show X page is active
            chrome.action.setBadgeText({
                tabId: tabId,
                text: 'X'
            });
            chrome.action.setBadgeBackgroundColor({
                tabId: tabId,
                color: '#000000'
            });
        } else {
            // Remove badge on non-X pages
            chrome.action.setBadgeText({
                tabId: tabId,
                text: ''
            });
        }
    }
});

// Handle tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab.url && (tab.url.includes('twitter.com') || tab.url.includes('x.com'))) {
            console.log('Active tab is X:', tab.url);
        }
    });
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    if (tab.url && (tab.url.includes('twitter.com') || tab.url.includes('x.com'))) {
        console.log('X Video to YouTube icon clicked on X page');
        // You could open the popup programmatically or show a notification
    }
});

// Clean up storage periodically
chrome.alarms.create('storageCleanup', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'storageCleanup') {
        cleanupOldStorage();
    }
});

// Clean up old storage data
function cleanupOldStorage() {
    chrome.storage.local.get(['lastUsed'], (data) => {
        const lastUsed = new Date(data.lastUsed);
        const daysSinceUse = (new Date() - lastUsed) / (1000 * 60 * 60 * 24);
        
        if (daysSinceUse > 30) {
            // Clean up old data if not used for 30 days
            chrome.storage.local.remove(['videoUrl', 'videoInfo', 'downloadedFile']);
        }
    });
}

console.log('X Video to YouTube background service worker started');
