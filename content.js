// Content script that runs on ChatGPT and Claude pages
console.log("SideMarks loaded");

// Storage key for bookmarked conversations
const STORAGE_KEY = 'chatgpt-bookmarked-conversations';

// Color mapping for different bookmark types
const BOOKMARK_COLORS = {
  'chatgpt-red': '#ff3b30',      // Red
  'chatgpt-orange': '#ff9500',   // Orange
  'chatgpt-yellow': '#ffcc00',   // Yellow
  'chatgpt-green': '#34c759',    // Green
  'chatgpt-blue': '#007aff',     // Blue
  'chatgpt-purple': '#5856d6',   // Purple
  'chatgpt-gray': '#8e8e93'      // Gray
};

// Platform detection
function getPlatform() {
  const hostname = window.location.hostname;
  console.log('SideMarks: Current hostname:', hostname);
  
  if (hostname.includes('claude.ai')) {
    console.log('SideMarks: Platform detected as claude');
    return 'claude';
  } else if (hostname.includes('grok.com')) {
    console.log('SideMarks: Platform detected as grok');
    return 'grok';
  } else if (hostname.includes('chat.openai.com') || hostname.includes('chatgpt.com')) {
    console.log('SideMarks: Platform detected as chatgpt');
    return 'chatgpt';
  }
  
      console.log('SideMarks: Platform detected as unknown');
  return 'unknown';
}

// Setup SPA navigation support
function setupSPASupport() {
  const platform = getPlatform();
  console.log('SideMarks: Setting up SPA support for', platform);
  
  // Track URL changes
  let lastUrl = location.href;
  
  // URL change observer for all platforms
  const urlObserver = new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      console.log('SideMarks: URL changed from', lastUrl, 'to', currentUrl);
      lastUrl = currentUrl;
      
      // URL changed, restore bookmarks with delays to ensure DOM is ready
      setTimeout(restoreBookmarks, 100);
      setTimeout(restoreBookmarks, 500);
      setTimeout(restoreBookmarks, 1000);
    }
  });
  
  // Observe document for URL changes (works for all SPAs)
  urlObserver.observe(document, { 
    subtree: true, 
    childList: true 
  });
  
  // DOM mutation observer to detect when conversation links are added
  const domObserver = new MutationObserver((mutations) => {
    let shouldRestore = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if conversation links were added
            if (node.querySelector) {
              const hasConversationLinks = 
                node.querySelector('a[href*="/c/"]') || // ChatGPT
                node.querySelector('a[href*="/chat/"]'); // Claude/Grok
              
              if (hasConversationLinks) {
                shouldRestore = true;
              }
            }
            
            // Also check if the node itself is a conversation link
            if (node.tagName === 'A' && 
                (node.href.includes('/c/') || node.href.includes('/chat/'))) {
              shouldRestore = true;
            }
          }
        });
      }
    });
    
    if (shouldRestore) {
      console.log('SideMarks: Conversation links detected, restoring bookmarks');
      setTimeout(restoreBookmarks, 100);
      setTimeout(restoreBookmarks, 500);
    }
  });
  
  // Observe the entire document for DOM changes
  domObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Additional periodic check for missing bookmarks (backup)
  setInterval(() => {
    try {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const bookmarked = result[STORAGE_KEY] || {};
        let restoredCount = 0;
        
        Object.keys(bookmarked).forEach(conversationId => {
          if (bookmarked[conversationId] && bookmarked[conversationId].color) {
            // Check if bookmark exists, if not restore it
            const links = getConversationLinks();
            let bookmarkExists = false;
            
            links.forEach(link => {
              if (link.href.includes(conversationId)) {
                const existingBookmark = link.querySelector('.chatgpt-bookmark');
                if (existingBookmark) {
                  bookmarkExists = true;
                }
              }
            });
            
            if (!bookmarkExists) {
              console.log(`SideMarks: Restoring missing bookmark for ${conversationId} on ${platform}`);
              addColorBookmark(conversationId, bookmarked[conversationId].color, bookmarked[conversationId].type);
              restoredCount++;
            }
          }
        });
        
        if (restoredCount > 0) {
          console.log(`SideMarks: Restored ${restoredCount} missing bookmarks on ${platform}`);
        }
      });
    } catch (e) {
      // Silently fail if storage is not available
    }
  }, 5000); // Check every 5 seconds
  
  console.log('SideMarks: SPA support initialized for', platform);
}

// Get conversation links based on platform
function getConversationLinks() {
  const platform = getPlatform();
  console.log('SideMarks: Getting conversation links for platform:', platform);
  
  let links;
  if (platform === 'claude') {
    // Claude uses different selectors - look for conversation links in the sidebar
    links = document.querySelectorAll('a[href*="/chat/"]');
  } else if (platform === 'grok') {
    // Grok uses /chat/ pattern similar to Claude
    links = document.querySelectorAll('a[href*="/chat/"]');
  } else if (platform === 'chatgpt') {
    // ChatGPT uses /c/ pattern
    links = document.querySelectorAll('a[href*="/c/"]');
  } else {
    links = [];
  }
  
  console.log('SideMarks: Found', links.length, 'conversation links');
  return links;
}

// Extract conversation ID based on platform
function extractConversationId(url) {
  const platform = getPlatform();
  
  if (platform === 'claude') {
    // Claude URLs: https://claude.ai/chat/abc123-def456-ghi789
    const match = url.match(/\/chat\/([a-f0-9-]+)/);
    return match ? match[1] : null;
  } else if (platform === 'grok') {
    // Grok URLs: https://grok.com/chat/abc123-def456-ghi789
    const match = url.match(/\/chat\/([a-f0-9-]+)/);
    return match ? match[1] : null;
  } else if (platform === 'chatgpt') {
    // ChatGPT URLs: https://chat.openai.com/c/abc123-def456-ghi789
    const match = url.match(/\/c\/([a-f0-9-]+)/);
    return match ? match[1] : null;
  }
  
  return null;
}

// Get text container based on platform
function getTextContainer(link) {
  const platform = getPlatform();
  
  if (platform === 'claude') {
    // Claude uses <a> tags with Tailwind classes - text is directly in the link
    // From the screenshot, we can see the link has classes like 'inline-flex items-center'
    return link;
  } else if (platform === 'grok') {
    // Grok uses <span> elements for conversation titles
    return link.querySelector('span') || link;
  } else if (platform === 'chatgpt') {
    // ChatGPT uses .truncate or span:last-child
    return link.querySelector('.truncate') || link.querySelector('span:last-child');
  }
  
  return link;
}

// Get conversation title for a given conversation ID
function getConversationTitle(conversationId) {
  try {
    const links = getConversationLinks();
    
    for (const link of links) {
      if (link.href.includes(conversationId)) {
        const textContainer = getTextContainer(link);
        if (textContainer) {
          return textContainer.textContent.trim() || `Conversation ${conversationId.substring(0, 8)}...`;
        }
      }
    }
  } catch (e) {
    // Silently fail if DOM manipulation fails
  }
  
  return `Conversation ${conversationId.substring(0, 8)}...`;
}

// Simple error-free message listener
try {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('SideMarks: Received message:', message);
    
    if (!message || !message.action) {
              console.log('SideMarks: Invalid message or missing action');
      return;
    }
    
    if (message.linkUrl) {
              console.log('SideMarks: Handling context menu action:', message.action, 'for URL:', message.linkUrl);
      
      // Handle context menu actions
      switch (message.action) {
        case "chatgpt-action-1":
          console.log('SideMarks: Calling handleAction1');
          handleAction1(message.linkUrl);
          break;
        case "chatgpt-red":
        case "chatgpt-orange":
        case "chatgpt-yellow":
        case "chatgpt-green":
        case "chatgpt-blue":
        case "chatgpt-purple":
        case "chatgpt-gray":
          console.log('SideMarks: Calling handleColorBookmark');
          handleColorBookmark(message.action, message.linkUrl);
          break;
        default:
          console.log('SideMarks: Unknown action:', message.action);
      }
    } else {
              console.log('SideMarks: Handling popup message:', message.action);
      
      // Handle popup messages
      switch (message.action) {
        case "ping":
          // Respond to background script ping to confirm content script is ready
          sendResponse({ status: 'ready' });
          break;
        case "keyboard-toggle-bookmark":
          // Handle keyboard shortcut for toggling bookmark on current conversation
          console.log('SideMarks: Handling keyboard toggle bookmark command');
          handleKeyboardToggleBookmark();
          break;
        case "updateBookmarkColor":
          updateAllBookmarkColors(message.color);
          break;
        case "clearAllBookmarks":
          clearAllBookmarks();
          break;
        case "removeBookmark":
          removeBookmark(message.conversationId);
          break;
        case "refreshBookmarks":
          restoreBookmarks();
          break;
        default:
          console.log('SideMarks: Unknown popup action:', message.action);
      }
    }
  });
} catch (e) {
      console.error('SideMarks: Error in message listener:', e);
}

// Action handlers
function handleAction1(linkUrl) {
  console.log('SideMarks: handleAction1 called with URL:', linkUrl);
  toggleBookmark(linkUrl);
}

function handleColorBookmark(action, linkUrl) {
  console.log('SideMarks: handleColorBookmark called with action:', action, 'URL:', linkUrl);
  const color = BOOKMARK_COLORS[action];
  if (color) {
    console.log('SideMarks: Setting color bookmark with color:', color);
    setColorBookmark(linkUrl, color, action);
  } else {
    console.log('SideMarks: No color found for action:', action);
  }
}

// Handle keyboard shortcut for toggling bookmark on current conversation
function handleKeyboardToggleBookmark() {
  const platform = getPlatform();
  const currentUrl = window.location.href;
  
  console.log('SideMarks: Keyboard shortcut triggered on', platform, 'for URL:', currentUrl);
  
  // Extract conversation ID from current URL
  const conversationId = extractConversationId(currentUrl);
  
  if (!conversationId) {
    console.log('SideMarks: No conversation ID found in current URL');
    showKeyboardFeedback('No conversation found', 'error');
    return;
  }
  
      console.log('SideMarks: Found conversation ID:', conversationId, 'toggling bookmark...');
  
  // Check current bookmark status first
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const bookmarked = result[STORAGE_KEY] || {};
    const currentlyBookmarked = bookmarked[conversationId] && bookmarked[conversationId].color;
    
    // Toggle bookmark for the current conversation
    toggleBookmark(currentUrl);
    
    // Show visual feedback based on what will happen
    if (currentlyBookmarked) {
      showKeyboardFeedback('Bookmark removed!', 'removed');
    } else {
      showKeyboardFeedback('Bookmark added!', 'added');
    }
  });
}

// Show visual feedback for keyboard actions
function showKeyboardFeedback(message, type = 'info') {
  // Remove any existing feedback
      const existingFeedback = document.querySelector('.sidemarks-keyboard-feedback');
  if (existingFeedback) {
    existingFeedback.remove();
  }
  
  // Create feedback element
  const feedback = document.createElement('div');
      feedback.className = 'sidemarks-keyboard-feedback';
  feedback.textContent = message;
  
  // Style the feedback
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    transform: translateX(100%);
    opacity: 0;
  `;
  
  // Set color based on type
  if (type === 'success') {
    feedback.style.background = '#34c759'; // Green
  } else if (type === 'error') {
    feedback.style.background = '#ff3b30'; // Red
  } else if (type === 'added') {
    feedback.style.background = '#007aff'; // Blue
  } else if (type === 'removed') {
    feedback.style.background = '#8e8e93'; // Grey
  } else {
    feedback.style.background = '#007aff'; // Blue (default)
  }
  
  // Add to page
  document.body.appendChild(feedback);
  
  // Animate in
  setTimeout(() => {
    feedback.style.transform = 'translateX(0)';
    feedback.style.opacity = '1';
  }, 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    feedback.style.transform = 'translateX(100%)';
    feedback.style.opacity = '0';
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.remove();
      }
    }, 300);
  }, 3000);
}

// Set a specific color bookmark
function setColorBookmark(linkUrl, color, colorType) {
  const conversationId = extractConversationId(linkUrl);
  if (!conversationId) return;

  try {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const bookmarked = result[STORAGE_KEY] || {};
      
      if (bookmarked[conversationId] && bookmarked[conversationId].color === color) {
        // Remove bookmark if same color
        removeBookmark(conversationId);
        bookmarked[conversationId] = false;
      } else {
        // Remove existing bookmark first (if any) to ensure clean update
        removeBookmark(conversationId);
        // Add or change bookmark color
        addColorBookmark(conversationId, color, colorType);
        
        // Get conversation title and platform info
        const title = getConversationTitle(conversationId);
        const platform = getPlatform();
        
        bookmarked[conversationId] = { 
          color: color, 
          type: colorType,
          title: title,
          platform: platform,
          timestamp: Date.now()
        };
        
        console.log(`SideMarks: Storing bookmark for ${conversationId} on ${platform}:`, bookmarked[conversationId]);
      }
      
      // Save state
      chrome.storage.local.set({ [STORAGE_KEY]: bookmarked });
    });
  } catch (e) {
    // Silently fail if storage is not available
  }
}

// Toggle bookmark (add/remove default blue dot)
function toggleBookmark(linkUrl) {
  const conversationId = extractConversationId(linkUrl);
  if (!conversationId) return false;

  try {
    let wasBookmarked = false;
    
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const bookmarked = result[STORAGE_KEY] || {};
      
      if (bookmarked[conversationId]) {
        // Remove bookmark
        removeBookmark(conversationId);
        bookmarked[conversationId] = false;
        wasBookmarked = false;
        console.log(`SideMarks: Removed bookmark for ${conversationId}`);
      } else {
        // Add bookmark with default color
        addColorBookmark(conversationId, '#007aff', 'default');
        
        // Get conversation title and platform info
        const title = getConversationTitle(conversationId);
        const platform = getPlatform();
        
        bookmarked[conversationId] = { 
          color: '#007aff', 
          type: 'default',
          title: title,
          platform: platform,
          timestamp: Date.now()
        };
        
        wasBookmarked = true;
        console.log(`SideMarks: Added toggle bookmark for ${conversationId} on ${platform}:`, bookmarked[conversationId]);
      }
      
      // Save state
      chrome.storage.local.set({ [STORAGE_KEY]: bookmarked });
      
      // Return the bookmark state for feedback
      return wasBookmarked;
    });
    
    return wasBookmarked;
  } catch (e) {
    // Silently fail if storage is not available
    return false;
  }
}

// Add color bookmark to conversation
function addColorBookmark(conversationId, color, colorType) {
  try {
    const links = getConversationLinks();
    const platform = getPlatform();
    
    console.log(`SideMarks: Adding bookmark for ${conversationId} on ${platform}, found ${links.length} links`);
    
    links.forEach(link => {
      if (link.href.includes(conversationId)) {
        console.log(`SideMarks: Found matching link for ${conversationId}`);
        
        // Remove any existing bookmark first
        const existingBookmark = link.querySelector('.chatgpt-bookmark');
        if (existingBookmark && existingBookmark.parentNode) {
          existingBookmark.remove();
        }
        
        // Find the text container
        const textContainer = getTextContainer(link);
        if (textContainer) {
          // Create the bookmark dot
          const bookmark = document.createElement('span');
          bookmark.className = 'chatgpt-bookmark';
          bookmark.style.cssText = `
            position: absolute;
            left: ${getPlatform() === 'claude' ? '7px' : '0px'};
            top: 50%;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: radial-gradient(circle, ${color} 0 36%, transparent 36% 52%, ${color} 52% 100%);
            transform: translateY(-50%);
            content: '';
            display: block;
            pointer-events: none;
            z-index: 1000;
          `;
          
          // Make the container relative positioned if it isn't already
          if (textContainer.style.position !== 'relative') {
            textContainer.style.position = 'relative';
          }
          
          // Always ensure platform-specific padding is set
          if (platform === 'claude') {
            textContainer.style.paddingLeft = '32px'; // More padding for Claude
          } else if (platform === 'grok') {
            textContainer.style.paddingLeft = '20px'; // Perfect padding for Grok from DOM testing
          } else {
            textContainer.style.paddingLeft = '19px'; // ChatGPT padding - perfect alignment from DOM testing
          }
          
          // Insert the bookmark at the beginning
          textContainer.insertBefore(bookmark, textContainer.firstChild);
          console.log(`SideMarks: Successfully added bookmark for ${conversationId}`);
        }
      }
    });
  } catch (e) {
    console.error('SideMarks: Error adding bookmark:', e);
  }
}

// Remove bookmark from conversation
function removeBookmark(conversationId) {
  try {
    const links = getConversationLinks();
    
    links.forEach(link => {
      if (link.href.includes(conversationId)) {
        const bookmark = link.querySelector('.chatgpt-bookmark');
        if (bookmark && bookmark.parentNode) {
          bookmark.remove();
          
          // Remove padding from the text container
          const textContainer = getTextContainer(link);
          if (textContainer) {
            // Check if there are any other bookmarks in this container
            const otherBookmarks = textContainer.querySelectorAll('.chatgpt-bookmark');
            if (otherBookmarks.length === 0) {
              // No more bookmarks, remove the padding
              textContainer.style.paddingLeft = '';
            }
          }
        }
      }
    });
  } catch (e) {
    // Silently fail if DOM manipulation fails
  }
}

// Restore bookmarks when page loads
function restoreBookmarks() {
  try {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const bookmarked = result[STORAGE_KEY] || {};
      const platform = getPlatform();
      
      console.log(`SideMarks: Restoring ${Object.keys(bookmarked).length} bookmarks on ${platform}`);
      
      Object.keys(bookmarked).forEach(conversationId => {
        if (bookmarked[conversationId] && bookmarked[conversationId].color) {
          addColorBookmark(conversationId, bookmarked[conversationId].color, bookmarked[conversationId].type);
        }
      });
    });
  } catch (e) {
    // Silently fail if storage is not available
  }
}

// Robust initialization that handles all platforms
function initializeBookmarks() {
  const platform = getPlatform();
  
  // Set up SPA navigation support for all platforms
  setupSPASupport();
  
  if (platform === 'claude' || platform === 'grok') {
    // Claude and Grok might need more time for their dynamic content to load
    // Try multiple times with increasing delays
    setTimeout(restoreBookmarks, 100);
    setTimeout(restoreBookmarks, 500);
    setTimeout(restoreBookmarks, 1000);
    setTimeout(restoreBookmarks, 2000);
  } else {
    // ChatGPT loads faster
    restoreBookmarks();
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBookmarks);
} else {
  initializeBookmarks();
}

// Update all existing bookmark colors
function updateAllBookmarkColors(newColor) {
  try {
    const bookmarks = document.querySelectorAll('.chatgpt-bookmark');
    bookmarks.forEach(bookmark => {
      if (bookmark && bookmark.style) {
        bookmark.style.background = newColor;
      }
    });
  } catch (e) {
    // Silently fail if DOM manipulation fails
  }
}

// Clear all bookmarks from the page
function clearAllBookmarks() {
  try {
    const bookmarks = document.querySelectorAll('.chatgpt-bookmark');
    bookmarks.forEach(bookmark => {
      if (bookmark && bookmark.parentNode) {
        bookmark.remove();
      }
    });
    
    // Reset padding on containers
    const platform = getPlatform();
    let containers;
    
    if (platform === 'claude') {
      containers = document.querySelectorAll('a[href*="/chat/"] [data-testid="conversation-title"], a[href*="/chat/"] .conversation-title, a[href*="/chat/"] span');
    } else if (platform === 'grok') {
      containers = document.querySelectorAll('a[href*="/chat/"] span');
    } else if (platform === 'chatgpt') {
      containers = document.querySelectorAll('a[href*="/c/"] .truncate, a[href*="/c/"] span:last-child');
    }
    
    if (containers) {
      containers.forEach(container => {
        if (container && container.style) {
          // Reset padding for all platforms
          if (container.style.paddingLeft === '19px' || container.style.paddingLeft === '20px' || container.style.paddingLeft === '32px') {
            container.style.paddingLeft = '';
            container.style.position = '';
          }
        }
      });
    }
  } catch (e) {
    // Silently fail if DOM manipulation fails
  }
}
