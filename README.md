# Vehicle Specials Widget

A standalone, plug-and-play JavaScript widget that displays vehicle specials from a Google Sheet.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Tailwind CSS

Build the optimized CSS file:

```bash
npm run build:css
```

This will:
- Read `src/input.css` (contains Tailwind directives and custom styles)
- Scan `sitescript.js` and `test.html` for Tailwind classes
- Generate `dist/output.css` with only the classes you actually use
- Minify the output for production

### 3. Watch Mode (Development)

For development, use watch mode to automatically rebuild when you change classes:

```bash
npm run watch:css
```

## File Structure

```
├── src/
│   └── input.css          # Tailwind directives + custom CSS
├── dist/
│   └── output.css         # Built CSS file (committed to repo)
├── sitescript.js          # Main widget script
├── tailwind.config.js     # Tailwind configuration
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## How It Works

1. **Build Process**: Tailwind scans your JavaScript/HTML files and generates only the CSS classes you use
2. **GitHub Hosting**: The `dist/output.css` file is committed to the repo
3. **CDN Loading**: The script loads `output.css` from GitHub via jsDelivr CDN
4. **Performance**: Instead of loading 400KB+ of Tailwind, you only load ~10-50KB of actual CSS

## Updating Styles

When you add or change Tailwind classes in `sitescript.js`:

1. Run `npm run build:css` to rebuild
2. Commit the updated `dist/output.css` to GitHub
3. The widget will automatically use the new styles

## CDN URL

The script loads CSS from:
```
https://cdn.jsdelivr.net/gh/rayvu02/jsRepoTest@main/dist/output.css
```

Update the URL in `sitescript.js` if your GitHub username/repo changes.

