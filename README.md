# Blog Code

A modern, lightweight blog system built with Preact and vanilla JavaScript that stores posts in Markdown and renders them to HTML for display.

<img width="1918" height="862" alt="image" src="https://github.com/user-attachments/assets/8b165212-cfe0-4779-bbd5-ca9e2244cc48" />


## Features

- **Advanced Markdown Editor**: Monaco Editor with syntax highlighting, autocomplete, and live preview
- **Multi-tab Management in editor**: Automatic persistence in localStorage with unsaved change detection
- **Smart List Continuation in editor**: Automatic pattern detection for ordered and unordered lists
- **Multiple Themes**: Dark, Light, and Dark Blue themes with system preference detection  
- **Advanced Search**: Real-time search through blog entries with fuzzy matching
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Code Syntax Highlighting**: Powered by PrismJS with VS Code-style themes
- **SVG Pan & Zoom**: Interactive SVG support with zoom controls
- **Lottie Animations**: Bodymovin/Lottie animation support with play/pause/reset controls
- **Visual Creation Tools**: Grid Creator Modal with Simple, Responsive, and Visual modes
- **Advanced Link System**: Internal anchors, header navigation, text search, and custom selectors

## Architecture

### Frontend Framework
- **Preact** (~3KB) - Lightweight React alternative
- **HTM** - JSX-like syntax without build step
- **ES Modules** - Native browser module system

### Core Technologies
- **Monaco Editor** - VS Code's editor for Markdown editing
- **Marked** - Fast Markdown parser and compiler
- **PrismJS** - Syntax highlighting for code blocks
- **SVG Pan & Zoom** - Interactive SVG manipulation
- **Lottie/Bodymovin** - Animation rendering

## Project Structure

```
├── index.html              # Main blog listing page
├── editor.html            # Markdown editor interface  
├── post.html              # Individual blog post viewer
├── search.json            # Blog entries metadata
├── compile.bat            # Build and minification script
│
├── components/
│   ├── Header.js           # Navigation and theme controls
│   ├── Sidebar.js          # Search and navigation sidebar
│   └── markdownProcessor.js # Custom Markdown renderer
│
├── styles/
│   ├── global-styles.css   # Core theming and layout
│   ├── editor-styles.css   # Editor-specific styles
│   └── post-styles.css     # Blog post styling
│
├── posts/                  # Markdown blog entries
├── public/                 # Static assets
├── cdn/                    # Third-party libraries
└── docs/                   # Compiled/minified output
```

## Key Technical Features

### Theme System
- **CSS Custom Properties**: Dynamic theme switching
- **System Detection**: Automatic dark/light mode based on `prefers-color-scheme`
- **LocalStorage Persistence**: Theme preference saved across sessions
- **Monaco Integration**: Editor themes sync with site themes

```css
:root,
[data-theme="dark"] {
    --primary-color: #a5c14f;
    --bg-color: #040506;
    --text-color: #fafafa;
    /* ... */
}
```

### Custom Markdown Processor
Enhanced Markdown parsing with custom extensions:

- **Balanced Delimiter Processing**: Smart handling of nested syntax
- **Interactive Elements**: Copy buttons, expandable sections
- **SVG Support**: Pan and zoom functionality
- **Code Highlighting**: Language-aware syntax highlighting
- **Iframe Integration**: Safe external content embedding

### Search Implementation
- **Fuzzy Search**: Intelligent matching algorithm
- **Real-time Results**: Instant search as you type
- **Content Indexing**: Full-text search through blog metadata
- **Navigation Controls**: Previous/Next result traversal

### Markdown Processing Pipeline

The custom processor `renderMarkdown()` follows a multi-stage pipeline in `components/markdownProcessor.js`:

1. **Code Block Extraction**: `processCodeBlocksAndTitles()` extracts and protects blocks with placeholders (`CODE_BLOCK_N_BLOCK_CODE`)
2. **Inline Code Processing**: `processInlineCodeBlocks()` handles inline code with language prefixes (`INLINE_CODE_N_CODE_INLINE`)
3. **Custom Blocks**: `processMarkdownBlocks()` converts extended syntax (`:::note`, `:::grid`, `:::iframe`) into structured HTML
4. **Markdown Parsing**: Passes content through `marked.parse()` with custom renderers
5. **Interactive JavaScript Generation**: Produces dynamic scripts for SVG viewers, Lottie animations, and collapsible blocks

### Build System
Automated compilation pipeline using `compile.bat`:

```bat
# Minification using tdewolff/minify
# Source: . → Destination: docs/
# Selective processing of components, styles, and assets
```

## Extended Markdown Syntax

The blog supports enhanced Markdown syntax beyond standard formatting:

### Custom Blocks
```markdown
# Note blocks with styling
:::note
This is a custom note block with special styling
:::

# Responsive grid layouts
:::grid cols-3 gap-4
---
Item 1
---
Item 2
---
Item 3
:::

# Embedded iframe content
:::iframe
https://example.com
:::
```

### Interactive SVG
```markdown
# SVG with pan/zoom controls
```svg style="height:15em;"
<svg>...</svg>
```⠀
```

### Lottie Animations
```markdown
# Embedded Lottie animations with controls
```animation
	public/bodymovin.json
```⠀
```

### Advanced Link System
- **Header Navigation**: `[Link Text](#h2=title2)` (jump to heading level 2 with text contains title2)
- **Text Search**: `[Link Text](#text=Text to search)` (find and highlight text)
- **Custom Selectors**: `[Link Text](#query=document.querySelector(".entry-content > p > a"))` (target specific elements)

## Getting Started

### Prerequisites
- Modern web browser with ES modules support
- Local web server (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/S4mC/Blog-Code.git
   cd Blog-Code
   ```

2. **Serve locally**

3. **Access the application**
   - Main blog: `http://localhost:3000/index.html`
   - Editor: `http://localhost:3000/editor.html`
   - Individual posts: `http://localhost:3000/post.html?path=./posts/example.md`

### Development Workflow

1. **Add new blog posts**: Create `.md` files in the `posts/` directory
2. **Update metadata**: Modify `search.json` with new entry information
3. **Build for production**: Run `compile.bat` to generate minified output in `docs/`

## Writing Blog Posts

### Creating a New Post

1. Create a new `.md` file in the `posts/` directory
2. Add entry to `search.json`:

```json
{
  "title": "Your Post Title",
  "summary": "Brief description of your post",
  "path": "./posts/your-post.md",
  "date": "2025-01-01",
  "tags": ["tag1", "tag2"]
}
```

## Configuration

### Theme Customization
Modify CSS custom properties in `styles/global-styles.css`:

```css
[data-theme="custom"] {
    --primary-color: #your-color;
    --bg-color: #your-bg;
    /* ... */
}
```

Modify const themes in `components/Header.js`:
```js
const themes = [
        ...
        { value: 'theme-id', label: 'Icon in svg or emoji', title: 'Theme tittle' , monacoTheme: 'vs-dark (dark) or vs (light)' }
    ];
```

### Visual Creation Tools
The editor includes several advanced creation tools:

- **Grid Creator Modal**: Three modes for different layout needs
  - Simple Mode: Basic grid layouts
  - Responsive Mode: Mobile-first responsive grids
  - Visual Mode: Interactive grid builder
- **CSS Selector Helper**: Copy CSS selectors for styling
- **Contextual Assistant**: Help with custom markdown blocks
- **Full Toolbar**: Formatting, links, images, callouts, and more

## Build Process

### Manual Build
```bash
# Run the compilation script
.\compile.bat
```

### What gets processed:
- **HTML**: Minified and optimized
- **CSS**: Compressed with vendor prefixes
- **JavaScript**: Minified ES modules
- **Assets**: Copied

## Deployment

### GitHub Pages
1. Ensure `docs/` folder is built
2. Configure repository settings:
   - Settings → Pages
   - Source: Deploy from branch
   - Branch: main / docs
3. Changue https://s4mc.github.io/Files/Blog-Code for your url 

### Static Hosting
Deploy the `docs/` folder to any static hosting service:
- Netlify
- Vercel  
- AWS S3
- Azure Static Web Apps

## Browser Support

### Minimum Requirements:
- **ES Modules**: Chrome 61+, Firefox 60+, Safari 10.1+
- **CSS Custom Properties**: Chrome 49+, Firefox 31+, Safari 9.1+
- **Import Maps**: Chrome 89+, Firefox 108+, Safari 16.4+

### Polyfill Support:
For older browsers, consider adding:
- ES Module shims
- CSS Custom Properties polyfill
- Import Maps polyfill

## Dependencies

### Runtime Dependencies:
- **Preact** (~3KB) - Component framework
- **HTM** (~2KB) - JSX alternative
- **Monaco Editor** (~1.7MB) - Code editor
- **Marked** (~46KB) - Markdown parser
- **PrismJS** (~12KB) - Syntax highlighting
- **Lottie** (~150KB) - Animation library
- **SVG Pan & Zoom** (~18KB) - SVG interaction

### Build Dependencies:
- **tdewolff/minify** - Asset minification

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Guidelines:
- Follow ES6+ standards
- Use semantic HTML
- Maintain accessibility standards
- Write comments in English
- Test across different browsers

## License

This project is open source and available under the [BSD-3-Clause license](LICENSE).

## Links

- **Demo**: [Live Demo](https://s4mc.github.io/Blog-Code)
- **Repository**: [GitHub](https://github.com/S4mC/Blog-Code)
- **Issues**: [Bug Reports](https://github.com/S4mC/Blog-Code/issues)
