const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  try {
    const logoPath = path.join(process.cwd(), '..', 'logo.png');
    const image = fs.readFileSync(logoPath);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.status(200).send(image);
  } catch (err) {
    res.status(404).json({ message: 'Logo not found' });
  }
};
