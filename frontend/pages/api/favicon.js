const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  try {
    const logoPath = path.join(process.cwd(), '..', 'logo.png');
    const imageBuffer = fs.readFileSync(logoPath);
    const base64 = imageBuffer.toString('base64');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <clipPath id="clip">
      <rect x="0" y="0" width="64" height="64" rx="10" ry="10" />
    </clipPath>
  </defs>
  <rect width="64" height="64" fill="white" />
  <image
    href="data:image/png;base64,${base64}"
    x="0"
    y="0"
    width="64"
    height="64"
    preserveAspectRatio="xMidYMid slice"
    clip-path="url(#clip)"
  />
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.status(200).send(svg);
  } catch (err) {
    res.status(404).json({ message: 'Favicon not found' });
  }
};
