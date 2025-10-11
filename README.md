# Blog Code

A modern, lightweight blog system built with Preact and vanilla JavaScript. Supports Markdown posts with live preview editor and advanced rendering features.

<img width="1915" alt="image" src="https://github.com/user-attachments/assets/ff1e38e6-eb21-4cce-a150-b3906825950a" />



## Features

- **Monaco Editor** with syntax highlighting and live preview
- **Multi-tab Management** with localStorage persistence
- **Multiple Themes** (Dark, Light, Dark Blue) with system preference detection
- **Real-time Search** with fuzzy matching
- **Code Highlighting** powered by PrismJS
- **Interactive SVG** with pan & zoom
- **Lottie Animations** support
- **Security**: Domain whitelist and strict mode
- **Centralized Config** in `config.js`

## Quick Start

### Testing Locally
```bash
git clone https://github.com/S4mC/Blog-Code.git
cd Blog-Code
# Serve with any local server
```

Uses demo content from `https://s4mc.github.io/Files/Blog-Code` by default.

### Your Own Blog
1. Clone this repo
2. Create content repository with `search.json` and `posts/`
3. Edit `config.js` with your content URL
4. Run `compile.bat`
5. Deploy both repositories

## Architecture

### Split Architecture
- **App Repository** (this repo): HTML, JS, CSS, components
- **Content Repository** (external): `search.json` + `posts/*.md`

**Why?**
- ✅ Update content without rebuilding
- ✅ Share engine across multiple blogs
- ✅ Better version control separation

**Example:**
- App: `https://username.github.io/Blog-Code/`
- Content: `https://username.github.io/Files/Blog-Code/`

## Configuration

### config.js

All settings in one place:

```javascript
const CONFIG = {
    // Content location
    contentUrl: ".",  // Use "." for same origin, or full URL for external

    // Security
    security: {
        allowedDomains: ["https://s4mc.github.io"],  // Whitelist
        strictMode: false,  // Only allow posts in search.json
    },

    // App metadata
    app: {
        name: "Blog Code",
        copyright: "© 2025 Blog Code",
        version: "1.0.0",
    }
};
```

**After editing `config.js`, run:**
```bash
.\compile.bat
```

### contentUrl Options

- **Same origin**: `contentUrl: "."`  
  Posts served from same domain as app

- **External**: `contentUrl: "https://example.com/blog-content"`  
  Posts served from different domain

### Security Features

**Domain Whitelist**  
Only domains in `allowedDomains` can serve content. Prevents XSS attacks.

**Strict Mode**  
When enabled, only posts listed in `search.json` can be loaded. Prevents direct file access.

## Writing Posts

### search.json Structure

```json
{
  "entries": [
    {
      "title": "Post Title",
      "summary": "Brief description",
      "path": "./posts/my-post.md",
      "date": "2025-01-01",
      "tags": ["tutorial", "guide"]
    }
  ]
}
```

**Fields:**
- `title`: Post title (required)
- `summary`: Short description (required)
- `path`: File path - relative or absolute (required)
- `date`: ISO date YYYY-MM-DD
- `tags`: Array of tags

### Path Resolution

**Relative paths** (recommended):
```json
"path": "./posts/hello.md"
```
Automatically resolved to: `${CONFIG.contentUrl}/posts/hello.md`

**Absolute URLs**:
```json
"path": "https://example.com/posts/hello.md"
```
Used as-is.

### Creating a Post

1. **Create Markdown file** in `posts/`:
   ```markdown
   # My Post Title
   
   Your content here...
   ```

2. **Add to search.json**:
   ```json
   {
     "title": "My Post Title",
     "summary": "Description",
     "path": "./posts/my-post.md",
     "date": "2025-01-01",
     "tags": ["example"]
   }
   ```

3. **Deploy** your content repository

## Extended Markdown

### Custom Blocks

**Notes:**
```markdown
:::note
Special note with styling
:::
```

**Grids:**
```markdown
:::grid cols-3 gap-4
---
Item 1
---
Item 2
---
Item 3
:::
```

**Iframes:**
```markdown
:::iframe
https://example.com
:::
```

### Interactive Elements

**SVG with pan/zoom:**
```markdown
```svg style="height:15em;"
<svg>...</svg>
```⠀
```

**Lottie animations:**
```markdown
```animation
public/animation.json
```⠀
```

### Advanced Links

- **Headers**: `[Link](#h2=Section Title)`
- **Text search**: `[Link](#text=find this)`
- **Custom selector**: `[Link](#query=.class-name)`

## Creating a New Theme

Follow these steps to add a custom theme to the blog:

### 1. Add Theme Variables

Edit `styles/global-styles.css` to define your theme's CSS variables:

```css
[data-theme="new-theme"] {
    /* New theme style */
    --bg: #your-color;
    --text-color: #your-color;
    /* Add all required CSS variables */
}
```

### 2. Register Theme in Header

Edit `components/Header.js` and add your theme to the `themes` array:

```javascript
const themes = [
    // ... existing themes
    { 
        value: 'new-theme', 
        label: '<svg>...</svg>', 
        title: 'New Theme Title', 
        monacoTheme: 'vs-dark' // or 'vs' for light themes
    }
];
```

**Parameters:**
- `value`: Theme identifier (must match CSS `data-theme`)
- `label`: SVG icon for theme selector
- `title`: Display name shown on hover
- `monacoTheme`: Monaco editor theme (`'vs-dark'` or `'vs'`)

### 3. Customize Syntax Highlighting (Optional)

Edit `cdn/prism/prism_vsc.css` to customize code syntax colors:

```css
[data-theme="new-theme"] {
    /* Prism syntax highlighting colors for New Theme */
    /* If not set, defaults to dark mode colors */
    --prism-background: #your-color;
    --prism-text: #your-color;
    /* Add other Prism color variables */
}
```

## Adding Custom Markdown Blocks

This blog supports custom Markdown blocks (like `:::note`, `:::grid`, etc.). Follow these steps to add your own custom block type:

### 1. Add Block Processing Logic

Edit `components/MarkdownProcessor.js` and add the rendering behavior for your custom block. The best place is usually in the `processMarkdownBlocks` function

### 2. Configure Editor Detection (if needed)

If you want the Monaco editor to recognize and provide UI configuration for your custom block:

#### 2.1 Add Regex Detection

In `editor.html`, add a regex pattern to detect your block in the `checkForConfigurableBlock` function

#### 2.2 Configure Block Parameters

Add your block configuration to the `blockConfigurations` object

#### 2.3 Add Configuration UI (if configurable)

If your block has configurable parameters, implement the UI in the `generateConfigContent` function

#### 2.4 Handle Configuration Application (if needed)

If your block requires complex logic when applying configuration, add it to the `applyConfiguration` function

## Development

### Project Structure

```
├── index.html              # Blog listing
├── editor.html            # Markdown editor
├── post.html              # Post viewer
├── config.js              # Configuration
├── compile.bat            # Build script
│
├── components/
│   ├── Header.js
│   ├── Sidebar.js
│   └── MarkdownProcessor.js
│
├── styles/
│   ├── global-styles.css
│   ├── editor-styles.css
│   └── post-styles.css
│
├── cdn/                   # Third-party libs
├── public/                # Static assets
└── docs/                  # Build output
```

### Build System

```bash
.\compile.bat
```

Minifies and copies files from root to `docs/` using [tdewolff/minify](https://github.com/tdewolff/minify).

### Workflow

1. Edit `config.js` if needed
2. Create posts in content repo
3. Update `search.json`
4. Run `compile.bat`
5. Deploy `docs/` folder

## Tech Stack

- **Preact** (~3KB) - Lightweight React alternative
- **HTM** - JSX without build step
- **Monaco Editor** - VS Code editor component
- **Marked** - Markdown parser
- **PrismJS** - Syntax highlighting
- **SVG Pan & Zoom** - Interactive SVGs
- **Lottie** - Animation rendering

## Troubleshooting

### Posts not loading
- Check `CONFIG.contentUrl` is correct
- Verify `search.json` is accessible
- Check browser console for errors
- Ensure domain is in `allowedDomains`

### Strict mode blocking posts
- Verify post path exists in `search.json`
- Check paths match exactly (case-sensitive)
- Disable strict mode for testing: `strictMode: false`

### Build issues
- Ensure `minify.exe` is present
- Run `compile.bat` from project root
- Check file permissions

### CORS errors
- Serve via proper web server (not `file://`)
- Check CORS headers on content domain
- Use same origin with `contentUrl: "."`

## License

This project is open source and available under the [BSD-3-Clause license](LICENSE).
