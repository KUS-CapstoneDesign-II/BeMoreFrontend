// Minimal worker to draw landmarks using OffscreenCanvas
// Messages:
// { type: 'init', canvas: OffscreenCanvas }
// { type: 'draw', width: number, height: number, points: Array<{x:number,y:number}> }

let ctx: OffscreenCanvasRenderingContext2D | null = null;

self.onmessage = (e: MessageEvent) => {
  const data = e.data as { type: 'init' | 'draw'; canvas?: OffscreenCanvas; width?: number; height?: number; points?: Array<{ x: number; y: number }> };
  if (data?.type === 'init' && data.canvas) {
    try {
      const off = data.canvas as OffscreenCanvas;
      ctx = off.getContext('2d');
    } catch {
      // ignore
    }
    return;
  }
  if (data?.type === 'draw' && ctx) {
    const { width = 0, height = 0, points = [] } = data;
    ctx.canvas.width = width;
    ctx.canvas.height = height;

    // Apply horizontal flip to match video element
    ctx.scale(-1, 1);
    ctx.translate(-width, 0);

    ctx.clearRect(0, 0, width, height);

    if (!points || points.length === 0) return;

    // draw points
    ctx.fillStyle = '#00FF00';
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (!p) continue;

      const x = p.x * width;
      const y = p.y * height;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // optional face oval polyline (indices subset)
    const faceOval = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < faceOval.length; i++) {
      const idx = faceOval[i];
      if (idx === undefined) continue;

      const p = points[idx];
      if (!p) continue;
      const x = p.x * width;
      const y = p.y * height;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
};


