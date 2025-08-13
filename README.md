# SideMarks

A Chrome extension that adds color-coded dots to AI chat conversations for easy organization.

## Features

- **Context Menu Integration**: Adds a "SideMarks" context menu when right-clicking on links within AI chat platforms
- **Keyboard Shortcuts**: Quick bookmark toggling with **Ctrl+Shift+.** (Windows/Linux) or **Cmd+Shift+.** (Mac)
- **Color-Coded Dots**: Categorize conversations with different colored dots for easy organization
- **Quick Actions**: Toggle bookmarks on/off with a single click or keyboard shortcut
- **Persistent Storage**: Bookmarks persist across page refreshes and browser sessions
- **Multiple Colors**: Choose from 7 different color options
- **Extension Popup**: View bookmark statistics through the extension icon
- **Visual Feedback**: See confirmation messages when bookmarks are added/removed

## Installation

1. **Load the extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked"
   - Select the folder containing this extension

2. **Verify installation:**
   - The extension should appear in your extensions list
   - You should see "SideMarks" listed

## Usage

### Basic Bookmarking
1. Navigate to [ChatGPT](https://chat.openai.com) or [chatgpt.com](https://chatgpt.com)
2. Right-click on any conversation link in the sidebar
3. Select "SideMarks" → "Toggle Bookmark"
4. A blue dot will appear next to the conversation

### Keyboard Shortcuts (New!)
1. **Open any conversation** on a supported platform (ChatGPT, Claude, or Grok)
2. **Press the keyboard shortcut**:
   - **Windows/Linux**: `Ctrl+Shift+.`
   - **Mac**: `Cmd+Shift+.`
3. **The extension automatically**:
   - Detects the current conversation
   - Toggles the bookmark (adds blue dot if not bookmarked, removes if already bookmarked)
   - Shows visual feedback in the top-right corner
4. **Perfect for quick bookmarking** without using the mouse!

### Color-Coded Bookmarking
1. Right-click on a conversation link
2. Select "SideMarks" → "Color Bookmarks"
3. Choose from the available colors:
   - 🔴 **Red** - For important conversations
   - 🟠 **Orange** - For work-related topics
   - 🟡 **Yellow** - For personal matters
   - 🟢 **Green** - For ideas and inspiration
   - 🔵 **Blue** - For research topics
   - 🟣 **Purple** - For creative projects
   - ⚫ **Gray** - For archived conversations

### Extension Info
1. **Click the extension icon** in your Chrome toolbar
2. **View bookmark count** and extension information
3. **See version info** and data storage details

## How It Works

- **Conversation ID Extraction**: Extracts unique IDs from chat URLs
- **Color Mapping**: Maps each color option to a specific hex color
- **Persistent Storage**: Saves bookmark data to Chrome's local storage
- **Dynamic Updates**: Automatically restores bookmarks when navigating
- **SPA Support**: Works with single-page application navigation

## File Structure

- `manifest.json` - Extension configuration and permissions
- `background.js` - Service worker for context menu creation and event handling
- `content.js` - Content script that runs on chat pages
- `popup.html` - Extension popup interface for info
- `popup.js` - Popup functionality
- `README.md` - This documentation file

## Technical Details

- **Manifest V3**: Uses the latest Chrome extension manifest format
- **Service Worker**: Background script handles context menu events
- **Content Scripts**: Runs on chat pages to manage bookmarks
- **Storage API**: Uses Chrome's local storage for persistence
- **Mutation Observer**: Watches for DOM changes to restore bookmarks

## Customization

### Adding New Color Categories
1. Update `BOOKMARK_COLORS` in `content.js`
2. Add new menu items in `background.js`
3. Handle the new actions in the message listener

### Modifying Dot Appearance
1. Edit the CSS styles in `addColorBookmark()` function
2. Adjust dot size, position, or add additional visual elements

## Troubleshooting

- **Extension not loading**: Check for JSON syntax errors in manifest
- **Context menu not appearing**: Ensure you're on a supported chat page
- **Bookmarks not persisting**: Check if storage permission is granted
- **Colors not updating**: Reload the extension after making changes

## Browser Compatibility

- **Chrome**: Full support (tested)
- **Edge**: Full support (Chromium-based)
- **Other Chromium browsers**: Should work with minor modifications

## Future Enhancements

- **Multi-platform support**: Add support for more AI chat platforms
- **Bookmark folders**: Organize conversations into groups
- **Search functionality**: Find conversations by color or category
- **Export/Import**: Backup and restore bookmark data
- **Custom keyboard shortcuts**: Allow users to customize shortcut keys
- **Bookmark sync**: Sync bookmarks across devices
