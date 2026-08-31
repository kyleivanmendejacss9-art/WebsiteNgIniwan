const express = require('express');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'WebsiteNgIniwan',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'pdf', 'mp4', 'webp']
  }
});

const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ message: 'Upload complete', url: req.file.path, public_id: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/files', async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'WebsiteNgIniwan',
      max_results: 50
    });
    const files = result.resources.map(file => ({
      name: file.public_id.split('/').pop(),
      url: file.secure_url,
      created_at: file.created_at
    }));
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`AURORA active on port ${PORT}`);
});
