const express = require('express');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file selected.' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'WebsiteNgIniwan',
      resource_type: 'auto'
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({ 
      success: true, 
      message: 'Upload complete!', 
      url: result.secure_url,
      name: req.file.originalname,
      created_at: new Date().toISOString(),
      format: result.format || result.resource_type
    });
  } catch (err) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: err.message || 'Upload failed' });
  }
});

app.get('/api/files', async (req, res) => {
  try {
    const [images, videos, raws] = await Promise.all([
      cloudinary.api.resources({ type: 'upload', resource_type: 'image', prefix: 'WebsiteNgIniwan/', max_results: 100 }).catch(() => ({ resources: [] })),
      cloudinary.api.resources({ type: 'upload', resource_type: 'video', prefix: 'WebsiteNgIniwan/', max_results: 100 }).catch(() => ({ resources: [] })),
      cloudinary.api.resources({ type: 'upload', resource_type: 'raw', prefix: 'WebsiteNgIniwan/', max_results: 100 }).catch(() => ({ resources: [] }))
    ]);

    const allResources = [...images.resources, ...videos.resources, ...raws.resources];
    
    const files = allResources.map(file => {
      const rawName = file.public_id.split('/').pop();
      const displayName = rawName.replace(/_[0-9]+$/, '').replace(/_/g, ' ') + (file.format ? '.' + file.format : '');
      return {
        name: displayName,
        url: file.secure_url,
        created_at: file.created_at,
        format: file.format || file.resource_type
      };
    });

    files.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`AURORA active on port ${PORT}`);
});
