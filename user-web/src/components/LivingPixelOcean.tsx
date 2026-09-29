import React, { useEffect, useRef } from "react";

const LivingPixelOcean: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width: number;
    let height: number;
    let time = 0;
    let animationFrameId: number;

    const resize = (): void => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
      } else {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
    };

    window.addEventListener("resize", resize);
    resize();

    const hash = (x: number, y: number): number => {
      return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123) % 1;
    };

    const noise = (x: number, y: number): number => {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const fx = x - ix;
      const fy = y - iy;

      const a = hash(ix, iy);
      const b = hash(ix + 1, iy);
      const c = hash(ix, iy + 1);
      const d = hash(ix + 1, iy + 1);

      const ux = fx * fx * (3 - 2 * fx);
      const uy = fy * fy * (3 - 2 * fy);

      return (
        (1 - ux) * (1 - uy) * a +
        ux * (1 - uy) * b +
        (1 - ux) * uy * c +
        ux * uy * d
      );
    };

    const fbm = (x: number, y: number, octaves = 3): number => {
      let value = 0;
      let amp = 0.5;
      let freq = 1.0;
      for (let i = 0; i < octaves; i++) {
        value += amp * noise(x * freq, y * freq);
        freq *= 2.1;
        amp *= 0.5;
      }
      return value;
    };

    const animate = (): void => {
      ctx.fillStyle = "rgba(0, 5, 20, 0.2)";
      ctx.fillRect(0, 0, width, height);

      const resolution = 15;
      const cols = Math.ceil(width / resolution);
      const rows = Math.ceil(height / resolution);

      time += 0.005;

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = i * resolution;
          const y = j * resolution;

          const wave = fbm(i * 0.1 + time, j * 0.1 + time);
          const intensity = wave * 255;

          const r = 0;
          const g = Math.floor(intensity * 0.6);
          const b = Math.floor(intensity * 1.5 + 50);

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(x, y, resolution - 1, resolution - 1);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 block h-full w-full bg-black"
      style={{ touchAction: "none", zIndex: -1 }}
    />
  );
};

export default LivingPixelOcean;
