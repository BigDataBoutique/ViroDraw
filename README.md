# ViroDraw

A browser-based tool to simplify image and slides creation. Built as an open-source, vibe-coded project by [BigData Boutique](https://bigdataboutique.com/).

ViroDraw runs entirely in the browser with a lightweight Python backend for image proxying and saving. Design hero images, social cards, presentation slides, and more -- all from a visual canvas editor.

![ViroDraw Screenshot](assets/screenshot.png)

## Features

### Canvas Editor
- Visual canvas powered by [Konva.js](https://konvajs.org/) (react-konva) with drag-and-drop element positioning
- Configurable canvas dimensions (default 1200x675)
- Auto-scaling viewport that fits the canvas to your screen
- Click-to-select and transform elements with resize handles
- Keyboard shortcuts: arrow keys to nudge elements (hold Shift for larger steps), Delete/Backspace to remove, Escape to deselect

### Text
- Add multiple text elements with live editing
- Font picker with searchable dropdown (popular fonts, Google Web Fonts, system fonts)
- Load any Google Font by name on the fly
- Font style options: regular, bold, italic, bold italic
- Text alignment: left, center, right
- Color picker with preset palette and custom color support
- Advanced text styling: opacity, rotation, drop shadow (color, blur, offset, opacity), text outline/stroke, letter spacing, line height
- Auto font-size calculation based on canvas and text length

### Images
- Add images from URL or file upload
- Drag-and-drop images directly onto the canvas
- Paste images from clipboard (Ctrl+V)
- Persistent image library stored in browser localStorage (drag-and-drop to library)
- Image styling: opacity, rotation, corner radius (with circle preset), drop shadow, border/stroke, horizontal/vertical flip, brightness adjustment
- Resize and reposition with transform handles

### Background
- Set background from URL or file upload
- Auto cover-scale to fill the canvas
- Recently used backgrounds stored in localStorage for quick reuse
- Clear background with one click

### Configuration (YAML)
- Save your current canvas state as a YAML configuration file (copy to clipboard or download)
- Load configurations from a URL or YAML file upload
- Configurations include canvas size, background, text elements (with defaults), images, fonts, and export format
- Great for creating reusable templates

### Export
- Download canvas as WebP, PNG, or JPG
- Server-side save to disk (when running with the backend)
- Clean export with selection handles automatically hidden

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + react-konva + Tailwind CSS 4
- **Backend**: Python FastAPI (image proxy, save-to-disk, health check)
- **Docker**: Multi-stage build for production deployment

## Getting Started

### Prerequisites

- Node.js 22+
- Python 3.12+ (for the backend)

### Running Locally (Development)

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server starts at `http://localhost:5173` and proxies `/api` requests to the backend.

**Backend:**

```bash
cd backend
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

The backend runs at `http://localhost:8000`.

### Running with Docker

```bash
docker build -t virodraw .
docker run -p 8000:8000 virodraw
```

Open `http://localhost:8000` in your browser. Exported images are saved to `/app/backend/output` inside the container -- mount a volume if you want to persist them:

```bash
docker run -p 8000:8000 -v $(pwd)/output:/app/backend/output virodraw
```

## Project Structure

```
frontend/               # React + Vite application
  src/
    components/
      Canvas/           # Konva canvas stage, background, text, image, bounding box
      Sidebar/          # Sidebar panels (background, text, images, export, settings)
      common/           # Shared components (image uploader, tooltip)
    hooks/              # useCanvasState, useFonts, useImageLoader
    utils/              # Auto layout, config loader (YAML), image library, API client
backend/
  main.py              # FastAPI server (proxy-image, save, health, SPA serving)
  output/              # Exported images saved here
Dockerfile             # Multi-stage build (Node.js build + Python runtime)
```

## License

Open source. Contributions welcome.
