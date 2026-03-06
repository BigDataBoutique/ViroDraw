import os
from pathlib import Path

import httpx
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Serve frontend static files in production (Docker)
FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"
if FRONTEND_DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/proxy-image")
async def proxy_image(url: str):
    async with httpx.AsyncClient(follow_redirects=True) as client:
        resp = await client.get(url, timeout=30)
        resp.raise_for_status()
    content_type = resp.headers.get("content-type", "image/png")
    return Response(content=resp.content, media_type=content_type)


@app.post("/api/save")
async def save_image(file: UploadFile = File(...), format: str = Form("webp")):
    import time

    ext = format if format in ("webp", "png", "jpg") else "webp"
    filename = f"hero_{int(time.time())}.{ext}"
    filepath = OUTPUT_DIR / filename
    data = await file.read()
    filepath.write_bytes(data)
    return {"path": str(filepath.resolve())}


# SPA fallback for production
if FRONTEND_DIST.is_dir():
    from fastapi.responses import FileResponse

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")
