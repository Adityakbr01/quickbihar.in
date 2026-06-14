import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { WebView } from "react-native-webview";

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #000514;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  </style>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
</head>
<body>
  <canvas id="pixelCanvas"></canvas>
  <script>
    const canvas = document.getElementById("pixelCanvas");
    const ctx = canvas.getContext("2d");

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    let time = 0;

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const hash = (x, y) => {
      return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123) % 1;
    };

    const noise = (x, y) => {
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

    const fbm = (x, y, octaves = 3) => {
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

    const animate = () => {
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

          ctx.fillStyle = "rgb(" + r + ", " + g + ", " + b + ")";
          ctx.fillRect(x, y, resolution - 1, resolution - 1);
        }
      }

      requestAnimationFrame(animate);
    };

    animate();
  </script>
</body>
</html>
`;

const LivingPixelOcean: React.FC = () => {
  if (Platform.OS !== "web") {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <WebView
          originWhitelist={["*"]}
          source={{ html: htmlContent }}
          style={styles.webView}
          scrollEnabled={false}
          overScrollMode="never"
          pointerEvents="none"
        />
      </View>
    );
  }

  // Web implementation (original canvas)
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
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
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

  const canvasStyles: React.CSSProperties = {
    display: "block",
    touchAction: "none",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "#000",
    zIndex: -1,
  };

  return <canvas ref={canvasRef} style={canvasStyles} />;
};

const styles = StyleSheet.create({
  webView: {
    flex: 1,
    backgroundColor: "#000514",
  },
});

export default LivingPixelOcean;
