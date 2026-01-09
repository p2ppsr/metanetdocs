# Metanet Docs

A modern, Google Docs-style document editor with blockchain-powered storage on the BSV blockchain. Documents are encrypted and stored using the Metanet protocol, ensuring true data ownership and portability.

## 🌟 Features

- **Rich Text Editor** - Full WYSIWYG editing with TipTap
  - Multiple heading levels (H1-H3)
  - Bold, italic, strikethrough formatting
  - Bullet and numbered lists
  - Code blocks with syntax highlighting
  - 20+ professional fonts (serif, sans-serif, monospace)
  - Blockquotes

- **Document Management**
  - Create, edit, rename, and delete documents
  - Grid and list view modes
  - Search documents by title or content
  - Auto-save with 3-second debounce

- **Export Options**
  - Export to PDF
  - Export to Microsoft Word (.docx)

- **Blockchain Storage**
  - Documents encrypted and stored on BSV blockchain
  - True data ownership - you control your data
  - Data portability across any compatible app

- **Modern UI/UX**
  - Google Docs-inspired interface
  - Dark/light theme support
  - Responsive design (mobile & desktop)
  - Document outline sidebar

## 🚀 Getting Started

### Prerequisites

1. Install [Metanet Desktop](https://metanet.bsvb.tech) - the wallet client that enables blockchain features
2. Create or import a wallet in Metanet Desktop

### Running the App

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 🔗 Data Portability & Protocol Specification

Metanet Docs uses the [@bsv/sdk](https://github.com/bitcoin-sv/ts-sdk) `LocalKVStore` for storing documents. This ensures your data is truly portable and can be accessed by any compatible application.

### Storage Protocol

Documents are stored using `LocalKVStore` from the BSV SDK with the following configuration:

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Store Name** | `notes` | The namespace for all documents |
| **Index Key** | `__wallet_index__` | Key storing the list of all document paths |

### Document Format

Each document is stored as a JSON object with the following structure:

```typescript
interface NoteData {
  title: string;          // Document title
  contents: string;       // HTML content (for rich text) or markdown
  tags?: string[];        // Optional tags array
  isRichText?: boolean;   // true for rich text, false for markdown
  lastModified?: number;  // Unix timestamp in milliseconds
  format?: 'markdown' | 'richtext';  // Editor format used
}
```

### File Naming Convention

Documents are stored with `.md` extension keys (e.g., `My Document.md`). The index at `__wallet_index__` contains a JSON array of all document paths.

### Retrieving Your Data

If this app becomes unavailable, you can retrieve your documents using any application that implements the BSV SDK `LocalKVStore`:

```typescript
import { LocalKVStore, WalletClient } from '@bsv/sdk';

// Initialize with your authenticated wallet
const wallet = new WalletClient();
await wallet.waitForAuthentication();

const store = new LocalKVStore(wallet, 'notes');

// Read the index to get all document paths
const indexRaw = await store.get('__wallet_index__');
const paths = JSON.parse(indexRaw);

// Read each document
for (const path of paths) {
  const content = await store.get(path);
  const document = JSON.parse(content);
  console.log(document.title, document.contents);
}
```

## 🏗️ Architecture

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Rich Text Editor | TipTap |
| Blockchain | BSV via @bsv/sdk |
| Build Tool | Vite |

### Project Structure

```
src/
├── components/
│   ├── docs/              # Google Docs-style components
│   │   ├── DocumentCard.tsx      # Document preview card
│   │   ├── DocumentEditor.tsx    # Main editor view
│   │   ├── DocumentGrid.tsx      # Homepage with document grid
│   │   ├── DocumentOutline.tsx   # Sidebar with headings outline
│   │   ├── EditorMenuBar.tsx     # Top menu bar with export
│   │   └── AIAssistantButtons.tsx # AI feature buttons (placeholder)
│   │
│   ├── notes/             # Shared utilities and editor
│   │   ├── RichTextEditor.tsx    # TipTap editor component
│   │   ├── types.ts              # TypeScript interfaces
│   │   └── utils.ts              # Parsing/serialization helpers
│   │
│   ├── ui/                # shadcn/ui components
│   └── NotesApp.tsx       # Main application component
│
├── hooks/
│   └── useAutoSave.ts     # Debounced auto-save hook
│
├── lib/
│   └── exportUtils.ts     # PDF/DOCX export utilities
│
└── pages/
    └── Index.tsx          # Entry point
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `NotesApp` | Main orchestrator - handles wallet initialization, document CRUD, state management |
| `DocumentGrid` | Homepage showing all documents in grid/list view with search |
| `DocumentEditor` | Full editor view with menu bar, save status, and outline |
| `RichTextEditor` | TipTap-based WYSIWYG editor with toolbar |
| `useAutoSave` | Hook for debounced auto-saving with status tracking |

## 🔐 Security & Privacy

- **End-to-end encryption**: Documents are encrypted before storing on-chain
- **Self-sovereign**: Only you (with your wallet keys) can access your documents
- **No central server**: Data lives on the BSV blockchain, not on any company's servers
- **Portable**: Your data moves with you - export or access via any compatible app

## 🛣️ Roadmap

- [ ] **Folders & Organization** - Organize documents into folders
- [ ] **Templates** - Pre-made document templates (meeting notes, project plans)
- [ ] **Collaboration** - Real-time collaborative editing
- [ ] **Comments** - Add comments and suggestions
- [ ] **Version History** - Track document changes over time
- [ ] **Tables** - Insert and edit tables
- [ ] **Images** - Embed images in documents

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
