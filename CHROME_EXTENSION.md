# On Mind Chrome Extension

Create a Chrome extension that seamlessly integrates with On Mind, maintaining the same beautiful design language and allowing quick capture of web content directly to your knowledge base.

## Core Features

### Quick Note Capture
- Capture selected text and page metadata with a single click
- Context menu integration for right-click saving
- Keyboard shortcut support (e.g., Ctrl/Cmd + Shift + S)
- Automatic metadata extraction from the current page:
  - Page title
  - Description
  - Featured image
  - Author information
  - Publication date
  - Site name
  - Favicon

### User Interface
- Popup interface matching On Mind's design:
  - Dark theme with gradient backgrounds
  - Same color scheme (#2d9edb, white text)
  - Consistent typography and spacing
- Quick note form with:
  - Pre-filled title from page metadata
  - Selected text as content
  - URL automatically included
  - Tag suggestions based on page content
  - Category selection (defaulting to "Quick Note")

### Technical Requirements

#### Authentication
- Use Supabase authentication
- Store auth state securely in extension storage
- Handle token refresh automatically
- Provide login/logout functionality

#### Data Storage
- Save notes directly to Supabase
- Match existing On Mind database schema
- Handle offline functionality with sync queue

#### Manifest (manifest.json)
```json
{
  "manifest_version": 3,
  "name": "On Mind",
  "version": "1.0.0",
  "description": "Quick capture for On Mind knowledge base",
  "permissions": [
    "activeTab",
    "storage",
    "contextMenus",
    "scripting"
  ],
  "host_permissions": [
    "https://*.supabase.co/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Shift+S",
        "mac": "Command+Shift+S"
      },
      "description": "Save to On Mind"
    }
  }
}
```

#### Project Structure
```
src/
  ├── popup/
  │   ├── popup.html
  │   ├── popup.css
  │   └── popup.ts
  ├── background/
  │   └── background.ts
  ├── content/
  │   └── content.ts
  ├── lib/
  │   ├── supabase.ts
  │   ├── metadata.ts
  │   └── storage.ts
  ├── components/
  │   ├── QuickNoteForm.ts
  │   └── TagInput.ts
  └── types/
      └── index.ts
```

### Metadata Extraction
Use Chrome extension APIs for enhanced metadata access:
```typescript
// Example metadata extraction
async function getPageMetadata() {
  const metadata = {
    title: document.title,
    url: window.location.href,
    description: '',
    selectedText: window.getSelection()?.toString() || '',
    favicon: '',
    siteName: '',
    author: '',
    publishDate: '',
  };

  // Get meta tags
  const metaTags = document.getElementsByTagName('meta');
  for (const meta of metaTags) {
    const name = meta.getAttribute('name')?.toLowerCase();
    const property = meta.getAttribute('property')?.toLowerCase();
    const content = meta.getAttribute('content');

    if (!content) continue;

    if (name === 'description' || property === 'og:description') {
      metadata.description = content;
    }
    if (property === 'og:site_name') {
      metadata.siteName = content;
    }
    if (name === 'author' || property === 'article:author') {
      metadata.author = content;
    }
    if (property === 'article:published_time') {
      metadata.publishDate = content;
    }
  }

  // Get favicon
  const faviconLink = document.querySelector('link[rel="icon"]') ||
                      document.querySelector('link[rel="shortcut icon"]');
  if (faviconLink) {
    metadata.favicon = faviconLink.getAttribute('href') || '';
  }

  return metadata;
}
```

### Quick Note Form Component
```typescript
// Example QuickNoteForm component
class QuickNoteForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    const metadata = await getPageMetadata();
    
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          --primary-color: #2d9edb;
          --bg-gradient: linear-gradient(135deg, #2d1b69 0%, #1a1a1a 100%);
          display: block;
          width: 400px;
          padding: 16px;
          background: var(--bg-gradient);
          color: white;
        }
        /* Add more styles matching On Mind design */
      </style>
      
      <form id="quickNoteForm">
        <div class="form-group">
          <input 
            type="text" 
            id="title" 
            value="${metadata.title}"
            placeholder="Title"
          >
        </div>
        <div class="form-group">
          <textarea 
            id="content"
            placeholder="Content"
          >${metadata.selectedText}</textarea>
        </div>
        <tag-input></tag-input>
        <button type="submit">Save to On Mind</button>
      </form>
    `;
    
    this.setupFormHandling();
  }

  private setupFormHandling() {
    const form = this.shadowRoot!.querySelector('#quickNoteForm');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      // Handle form submission to Supabase
    });
  }
}

customElements.define('quick-note-form', QuickNoteForm);
```

## Design Guidelines

### Colors
- Primary: #2d9edb
- Background: linear-gradient(135deg, #2d1b69 0%, #1a1a1a 100%)
- Text: white
- Borders: rgba(255, 255, 255, 0.1)

### Typography
- System font stack
- Font sizes matching On Mind web app
- Same text colors and opacity values

### Components
- Match existing On Mind components:
  - Form inputs
  - Buttons
  - Tag input
  - Loading states
  - Toast notifications

### Animations
- Smooth transitions
- Loading indicators
- Save confirmation animations

## Development Guidelines

1. Use TypeScript for type safety
2. Follow Chrome extension best practices
3. Implement proper error handling
4. Add offline support
5. Ensure secure authentication
6. Match On Mind's code style
7. Add comprehensive testing

## Security Considerations

1. Secure storage of auth tokens
2. Safe handling of user data
3. Content script isolation
4. XSS prevention
5. CSP implementation
6. Regular security audits

This extension should feel like a natural extension of On Mind, providing a seamless experience for quickly capturing web content into your knowledge base.