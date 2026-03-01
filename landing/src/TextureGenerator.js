import * as THREE from 'three';

// Create a texture that mimics the faceted Plumbob look from the image
export const createPlumbobTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Fill base color
  ctx.fillStyle = '#65a30d'; // Base green
  ctx.fillRect(0, 0, 512, 512);

  // Draw angular facets (mimicking the low-poly style from the image)
  
  // Left light facet
  ctx.fillStyle = '#84cc16';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.lineTo(0, 256);
  ctx.fill();

  // Top/right highlight facet
  ctx.fillStyle = '#bef264';
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(512, 0);
  ctx.lineTo(512, 256);
  ctx.lineTo(256, 256);
  ctx.fill();

  // Very bright white/light-green highlight facet
  ctx.fillStyle = '#d9f99d';
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.lineTo(384, 128);
  ctx.lineTo(384, 256);
  ctx.lineTo(128, 256);
  ctx.fill();

  // Darkest facet
  ctx.fillStyle = '#3f6212';
  ctx.beginPath();
  ctx.moveTo(256, 256);
  ctx.lineTo(512, 256);
  ctx.lineTo(512, 512);
  ctx.lineTo(256, 512);
  ctx.fill();
  
  // Bottom left dark facet
  ctx.fillStyle = '#4d7c0f';
  ctx.beginPath();
  ctx.moveTo(0, 256);
  ctx.lineTo(256, 256);
  ctx.lineTo(256, 512);
  ctx.lineTo(0, 512);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};
