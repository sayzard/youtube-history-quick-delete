# YouTube History Quick Delete

A Chrome extension that adds quick delete buttons to YouTube watch history items, allowing you to easily remove unwanted videos and shorts from your history.

## 📸 Demo Screenshot

*The extension adds red trash can delete buttons to the top-left corner of all video thumbnails in your YouTube watch history.*

**What you'll see:**
- ✅ Delete buttons on YouTube Shorts (top-left corner of thumbnails)
- ✅ Delete buttons on regular videos 
- ✅ Dark theme compatibility
- ✅ Korean interface support
- ✅ Seamless integration with YouTube's UI

*Note: Screenshot shows the extension working on YouTube's watch history page with both Shorts and regular videos displaying delete overlay buttons.*

## Features

- **Quick Delete Buttons**: Adds delete overlay buttons to all video thumbnails in your YouTube watch history
- **Works with All Content**: Supports both regular videos and YouTube Shorts
- **Auto-Detection**: Automatically detects and adds buttons to newly loaded content (infinite scroll)
- **One-Click Deletion**: Click the delete button to instantly remove items from your watch history
- **Dark/Light Theme Support**: Adapts to YouTube's theme automatically
- **No Permissions Required**: Works without any special permissions

## Installation

### From Chrome Web Store
*Coming soon...*

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will be installed and ready to use

## Usage

1. Go to your YouTube watch history: `https://www.youtube.com/feed/history`
2. You'll see red delete buttons (🗑️) on the top-left corner of each video thumbnail
3. Click any delete button to instantly remove that item from your watch history
4. The extension works with both regular videos and YouTube Shorts
5. New content loaded via infinite scroll will automatically get delete buttons

## How It Works

The extension:
1. **Detects History Items**: Automatically finds video containers in your watch history
2. **Adds Delete Buttons**: Injects overlay buttons on each video thumbnail
3. **Automates Deletion**: When clicked, automatically opens the context menu and clicks "Remove from watch history"
4. **Handles Dynamic Content**: Uses MutationObserver to detect new content and add buttons automatically

## Supported Content Types

- ✅ Regular YouTube videos
- ✅ YouTube Shorts
- ✅ Live streams
- ✅ Music videos
- ✅ Podcasts

## Browser Compatibility

- ✅ Chrome (Manifest V3)
- ✅ Chromium-based browsers (Edge, Brave, etc.)

## Privacy

This extension:
- **No Data Collection**: Doesn't collect or store any personal data
- **No External Requests**: All functionality runs locally in your browser
- **No Permissions**: Requires no special permissions beyond basic content script access
- **Open Source**: Full source code is available for review

## Development

### Project Structure
```
youtube-history-quick-delete/
├── manifest.json              # Extension manifest
├── content/
│   ├── contentScript.js       # Main extension logic
│   └── contentStyles.css      # Button styling
├── assets/
│   └── icon.svg               # Extension icon
├── README.md                  # This file
└── DEVELOPMENT.md            # Technical documentation
```

### Key Technologies
- **Manifest V3**: Latest Chrome extension standard
- **Content Scripts**: JavaScript injection into YouTube pages
- **DOM Manipulation**: Element detection and overlay injection
- **MutationObserver**: Dynamic content detection
- **Event Simulation**: Automated UI interaction

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup
1. Clone the repository
2. Load the extension in Chrome developer mode
3. Make your changes
4. Test on YouTube watch history page
5. Submit a pull request

## Troubleshooting

### Delete buttons not appearing?
- Make sure you're on the YouTube watch history page (`/feed/history`)
- Try refreshing the page
- Check if the extension is enabled in `chrome://extensions/`

### Buttons not working?
- Check the browser console for any error messages
- Try clicking the menu button manually first to ensure YouTube's menu works
- Make sure you're logged into YouTube

### Performance issues?
- The extension is designed to be lightweight
- If you notice slowdowns, try disabling other extensions temporarily

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for YouTube users who want to quickly manage their watch history
- Inspired by the need for efficient content management
- Thanks to the Chrome Extensions API for making this possible

## Changelog

### v1.0.0
- Initial release
- Basic delete functionality for videos and shorts
- Dark/light theme support
- Infinite scroll support
- Auto-detection of new content

---

**Note**: This extension is not affiliated with YouTube or Google. It's an independent tool created to improve user experience.