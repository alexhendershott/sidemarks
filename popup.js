// Popup script for SideMarks Extension
document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const bookmarkCount = document.getElementById('bookmarkCount');
  const bookmarksList = document.getElementById('bookmarksList');
  const bookmarksContainer = document.getElementById('bookmarksContainer');
  const searchContainer = document.getElementById('searchContainer');
  const searchInput = document.getElementById('searchInput');

  // Store all bookmarks for filtering
  let allBookmarks = {};

  // Initialize popup
  updateBookmarkCount();
  loadBookmarksList();
  setupSearch();

  function updateBookmarkCount() {
    chrome.storage.local.get(['chatgpt-bookmarked-conversations'], (result) => {
      const bookmarked = result['chatgpt-bookmarked-conversations'] || {};
      const count = Object.values(bookmarked).filter(Boolean).length;
      bookmarkCount.textContent = count;
      
      // Show/hide bookmarks list and search based on count
      if (count > 0) {
        bookmarksList.style.display = 'block';
        searchContainer.style.display = 'block';
      } else {
        bookmarksList.style.display = 'none';
        searchContainer.style.display = 'none';
      }
    });
  }

  function setupSearch() {
    searchInput.addEventListener('input', function() {
      filterBookmarks(this.value.trim().toLowerCase());
    });
    
    // Clear search when popup is opened
    searchInput.value = '';
  }

  function filterBookmarks(searchTerm) {
    const bookmarkItems = document.querySelectorAll('.bookmark-item');
    const platformHeaders = document.querySelectorAll('.platform-header');
    const noResultsElement = document.querySelector('.no-results');
    
    // Remove existing no-results element
    if (noResultsElement) {
      noResultsElement.remove();
    }
    
    let visibleCount = 0;
    let hasVisibleBookmarks = false;
    
    // Filter bookmark items
    bookmarkItems.forEach(item => {
      const title = item.querySelector('.bookmark-title').textContent.toLowerCase();
      const platform = item.querySelector('.bookmark-platform').textContent.toLowerCase();
      
      const matchesSearch = !searchTerm || 
        title.includes(searchTerm) || 
        platform.includes(searchTerm);
      
      if (matchesSearch) {
        item.classList.remove('hidden');
        visibleCount++;
      } else {
        item.classList.add('hidden');
      }
    });
    
    // Show/hide platform headers based on visible bookmarks
    platformHeaders.forEach(header => {
      const platformName = header.textContent;
      const nextElements = [];
      let element = header.nextElementSibling;
      
      // Collect all bookmark items until the next platform header
      while (element && !element.classList.contains('platform-header')) {
        if (element.classList.contains('bookmark-item')) {
          nextElements.push(element);
        }
        element = element.nextElementSibling;
      }
      
      // Check if any bookmarks in this platform are visible
      const hasVisibleInPlatform = nextElements.some(item => !item.classList.contains('hidden'));
      
      if (hasVisibleInPlatform) {
        header.classList.remove('hidden');
        hasVisibleBookmarks = true;
      } else {
        header.classList.add('hidden');
      }
    });
    
    // Show no results message if no bookmarks match
    if (visibleCount === 0 && searchTerm) {
      const noResults = document.createElement('div');
      noResults.className = 'no-results';
      noResults.textContent = `No bookmarks found for "${searchTerm}"`;
      bookmarksContainer.appendChild(noResults);
    }
  }

  function loadBookmarksList() {
    chrome.storage.local.get(['chatgpt-bookmarked-conversations'], (result) => {
      const bookmarked = result['chatgpt-bookmarked-conversations'] || {};
      allBookmarks = bookmarked; // Store for filtering
      console.log('SideMarks Popup: All bookmarks:', bookmarked);
      
      bookmarksContainer.innerHTML = '';
      
      // Group bookmarks by platform
      const groupedBookmarks = {};
      
      Object.keys(bookmarked).forEach(conversationId => {
        if (bookmarked[conversationId] && bookmarked[conversationId].color) {
          const bookmark = bookmarked[conversationId];
          const platform = bookmark.platform || getPlatformFromId(conversationId);
          
          if (!groupedBookmarks[platform]) {
            groupedBookmarks[platform] = [];
          }
          
          groupedBookmarks[platform].push({
            conversationId,
            bookmark
          });
        }
      });
      
      // Display bookmarks grouped by platform
      const platformOrder = ['chatgpt', 'claude', 'grok'];
      
      platformOrder.forEach(platform => {
        if (groupedBookmarks[platform] && groupedBookmarks[platform].length > 0) {
          // Add platform header
          const platformHeader = document.createElement('div');
          platformHeader.className = 'platform-header';
          platformHeader.textContent = getPlatformDisplayName(platform);
          bookmarksContainer.appendChild(platformHeader);
          
          // Add bookmarks for this platform
          groupedBookmarks[platform].forEach(({ conversationId, bookmark }) => {
            console.log('SideMarks Popup: Processing bookmark:', conversationId, bookmark);
            const bookmarkElement = createBookmarkElement(conversationId, bookmark);
            bookmarksContainer.appendChild(bookmarkElement);
          });
        }
      });
    });
  }

  function createBookmarkElement(conversationId, bookmark) {
    const item = document.createElement('a');
    item.className = 'bookmark-item';
    item.href = '#';
    
    // Use stored platform and title info
    const platform = bookmark.platform || getPlatformFromId(conversationId);
    const url = getUrlForConversation(conversationId, platform);
    
    item.addEventListener('click', (e) => {
      e.preventDefault();
      openConversation(url);
    });

    const dot = document.createElement('div');
    dot.className = 'bookmark-dot';
    dot.style.background = `radial-gradient(circle, ${bookmark.color} 0 36%, transparent 36% 52%, ${bookmark.color} 52% 100%)`;

    const title = document.createElement('div');
    title.className = 'bookmark-title';
    title.textContent = bookmark.title || getConversationTitle(conversationId, platform);

    const platformLabel = document.createElement('div');
    platformLabel.className = 'bookmark-platform';
    platformLabel.textContent = getPlatformDisplayName(platform);

    item.appendChild(dot);
    item.appendChild(title);
    item.appendChild(platformLabel);

    return item;
  }

  function getPlatformFromId(conversationId) {
    // Fallback method if platform info is not stored
    if (conversationId.includes('-')) {
      // UUID format - likely Claude or Grok
      return 'claude';
    } else {
      // Short ID format - likely ChatGPT
      return 'chatgpt';
    }
  }

  function getUrlForConversation(conversationId, platform) {
    if (platform === 'chatgpt') {
      return `https://chat.openai.com/c/${conversationId}`;
    } else if (platform === 'claude') {
      return `https://claude.ai/chat/${conversationId}`;
    } else if (platform === 'grok') {
      return `https://grok.com/chat/${conversationId}`;
    } else {
      // Fallback to ChatGPT
      return `https://chat.openai.com/c/${conversationId}`;
    }
  }

  function getConversationTitle(conversationId, platform) {
    // Fallback method if title is not stored
    return `Conversation ${conversationId.substring(0, 8)}...`;
  }

  function getPlatformDisplayName(platform) {
    const platformNames = {
      'chatgpt': 'ChatGPT',
      'claude': 'Claude',
      'grok': 'Grok'
    };
    return platformNames[platform] || platform;
  }

  function openConversation(url) {
    chrome.tabs.create({ url: url });
  }
});
