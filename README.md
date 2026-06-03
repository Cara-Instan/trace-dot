# Trace.

Document manipulation utility for splitting and merging PDF files.

Built with Electrobun, Vue 3, Vite, and Tailwind CSS.

## Features

- Split PDF documents into separate files
- Merge multiple PDFs into a single document
- Vue 3 with Composition API
- Vite with HMR (Hot Module Replacement)
- Tailwind CSS v4

## Routes

- `/` - Home
- `/merge` - Merge PDFs
- `/split` - Split PDF
- `/history` - History
- `/settings` - Settings

## Commands

```bash
# Development with HMR
bun run dev

# Full dev (Vite + Electrobun)
bun run dev:hmr

# Production build
bun run build

# Canary build
bun run build:canary
```

## Tech Stack

- **Runtime:** Electrobun 1.18.1
- **Frontend:** Vue 3.5, Vue Router 5
- **Build:** Vite 6, Tailwind CSS 4
- **Language:** TypeScript, Bun

## Roadmap

### Planned Features

- [ ] PDF page selection (split specific pages)
- [ ] Drag-and-drop file ordering
- [ ] Preview thumbnails before merge/split
- [ ] Batch processing multiple files
- [ ] Output format options (PDF version compatibility)
- [ ] Dark mode support
- [ ] Keyboard shortcuts
- [ ] Recent files quick access

### Future Enhancements

- [ ] Additional document format support (images, DOCX)
- [ ] PDF compression
- [ ] PDF metadata editing
- [ ] Cloud storage integration (This can be configured by the user in the settings, allowing them to connect their preferred cloud storage service for saving and retrieving files.)
- [ ] File encryption/decryption