const express = require('express');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use memory storage to stream files directly to Cloudinary safely
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const originalName = req.file.originalname;
    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'WebsiteNgIniwan',
        resource_type: 'auto', // Automatically detects images, videos, or documents
        public_id: baseName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now()
      },
      (error, result) => {
        if (error) {
          return res.status(500).json({ error: error.message });
        }
        res.json({ message: 'Upload complete', url: result.secure_url, public_id: result.public_id });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/files', async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'WebsiteNgIniwan/',
      max_results: 50
    });
    
    const files = result.resources.map(file => {
      const rawName = file.public_id.split('/').pop();
      const cleanBase = rawName.replace(/_[0-9]+$/, '').replace(/_/g, ' ');
      const displayName = cleanBase + (file.format ? '.' + file.format : '');
      return {
        name: displayName,
        url: file.secure_url,
        created_at: file.created_at
      };
    });
      
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`AURORA active on port ${PORT}`);
});
