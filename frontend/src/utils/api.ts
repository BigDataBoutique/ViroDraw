export async function proxyImage(url: string): Promise<string> {
  const resp = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
  if (!resp.ok) throw new Error('Failed to proxy image');
  const blob = await resp.blob();
  return URL.createObjectURL(blob);
}

export async function saveImage(blob: Blob, format: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', blob, `hero.${format}`);
  formData.append('format', format);
  const resp = await fetch('/api/save', { method: 'POST', body: formData });
  if (!resp.ok) throw new Error('Failed to save image');
  const data = await resp.json();
  return data.path;
}
