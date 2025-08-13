// Background service worker for the Chrome extension
chrome.runtime.onInstalled.addListener(() => {
  // Create the context menu when the extension is installed
  chrome.contextMenus.create({
    id: "chatgpt-context-menu",
    title: "SideMarks",
    contexts: ["link"],
    documentUrlPatterns: ["*://chat.openai.com/*", "*://chatgpt.com/*", "*://claude.ai/*", "*://grok.com/*"]
  });

  // Create submenu items
  chrome.contextMenus.create({
    id: "chatgpt-action-1",
    parentId: "chatgpt-context-menu",
    title: "Toggle Bookmark",
    contexts: ["link"],
    documentUrlPatterns: ["*://chat.openai.com/*", "*://chatgpt.com/*", "*://claude.ai/*", "*://grok.com/*"]
  });

  // Create color-coded bookmark submenu
  chrome.contextMenus.create({
    id: "chatgpt-color-bookmarks",
    parentId: "chatgpt-context-menu",
    title: "Color Bookmarks",
    contexts: ["link"],
    documentUrlPatterns: ["*://chat.openai.com/*", "*://chatgpt.com/*", "*://claude.ai/*", "*://grok.com/*"]
  });

  // Create individual color options
  chrome.contextMenus.create({
    id: "chatgpt-red",
    parentId: "chatgpt-color-bookmarks",
    title: "🔴 Red",
    contexts: ["link"],
    documentUrlPatterns: ["*://chat.openai.com/*", "*://chatgpt.com/*", "*://claude.ai/*", "*://grok.com/*"]
  });

  chrome.contextMenus.create({
    id: "chatgpt-orange",
    parentId: "chatgpt-color-bookmarks",
    title: "🟠 Orange",
    contexts: ["link"],
    documentUrlPatterns: ["*://chat.openai.com/*", "*://chatgpt.com/*", "*://claude.ai/*", "*://grok.com/*"]
  });

  chrome.contextMenus.create({
    id: "chatgpt-yellow",
    parentId: "chatgpt-color-bookmarks",
    title: "🟡 Yellow",
    contexts: ["link"],
    documentUrlPatterns: ["*://chat.openai.com/*", "*://chatgpt.com/*", "*://claude.ai/*", "*://grok.com/*"]
  });

  chrome.contextMenus.create({
    id: "chatgpt-green",
    parentId: "chatgpt-color-bookmarks",
    title: "🟢 Green",
    contexts: ["link"],
    documentUrlPatterns: ["*://chat.openai.com/*", "*://chatgpt.com/*", "*://claude.ai/*", "*://grok.com/*"]
  });

  chrome.contextMenus.create({
    id: "chatgpt-blue",
    parentId: "chatgpt-color-bookmarks",
    title: "🔵 Blue",
    contexts: ["link"],
    documentUrlPatterns: ["*://chat.openai.com/*", "*://chatgpt.com/*", "*://claude.ai/*", "*://grok.com/*"]
  });

  chrome.contextMenus.create({
    id: "chatgpt-purple",
    parentId: "chatgpt-color-bookmarks",
    title: "🟣 Purple",
    contexts: ["link"],
    documentUrlPatterns: ["*://chat.openai.com/*", "*://chatgpt.com/*", "*://claude.ai/*", "*://grok.com/*"]
  });

  chrome.contextMenus.create({
    id: "chatgpt-gray",
    parentId: "chatgpt-color-bookmarks",
    title: "⚫ Gray",
    contexts: ["link"],
    documentUrlPatterns: ["*://chat.openai.com/*", "*://chatgpt.com/*", "*://claude.ai/*", "*://grok.com/*"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId.startsWith("chatgpt-action-") || info.menuItemId.startsWith("chatgpt-")) {
    // Get the clicked link URL
    const linkUrl = info.linkUrl;
    
    try {
      // First check if the content script is ready
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
      
      // If we get here, content script is ready, send the actual message
      chrome.tabs.sendMessage(tab.id, {
        action: info.menuItemId,
        linkUrl: linkUrl
      });
    } catch (error) {
              console.log('SideMarks: Content script not ready, attempting to inject and retry...');
      
      // Try to inject the content script and then send the message
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        // Wait a moment for the script to initialize
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, {
            action: info.menuItemId,
            linkUrl: linkUrl
          }).catch(err => {
            console.log('SideMarks: Still could not send message after injection:', err.message);
          });
        }, 100);
      } catch (injectionError) {
        console.log('SideMarks: Could not inject content script:', injectionError.message);
      }
    }
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === 'toggle-bookmark') {
    console.log('SideMarks: Keyboard shortcut triggered for toggle bookmark');
    
    try {
      // Check if the content script is ready
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
      
      // Send the toggle bookmark command for the current page
      chrome.tabs.sendMessage(tab.id, {
        action: 'keyboard-toggle-bookmark'
      });
    } catch (error) {
              console.log('SideMarks: Content script not ready for keyboard command, attempting to inject...');
      
      // Try to inject the content script and then send the message
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        // Wait a moment for the script to initialize
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'keyboard-toggle-bookmark'
          }).catch(err => {
            console.log('SideMarks: Still could not send keyboard command after injection:', err.message);
          });
        }, 100);
      } catch (injectionError) {
        console.log('SideMarks: Could not inject content script for keyboard command:', injectionError.message);
      }
    }
  }
});
