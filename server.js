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
  fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: uploadDir });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file selected for upload.' });
    }

    const originalName = req.file.originalname;
    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const safeName = baseName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now();

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'WebsiteNgIniwan',
      resource_type: 'auto',
      public_id: safeName,
      chunk_size: 6000000 // Enable chunking for smooth video uploads
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({ 
      success: true, 
      message: 'Upload complete!', 
      url: result.secure_url,
      name: originalName
    });
  } catch (err) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: err.message || 'Upload failed due to server error.' });
  }
});

app.get('/api/files', async (req, res) => {
  try {
    // Use Cloudinary Search API to fetch all files across all types instantly
    const searchResult = await cloudinary.search
      .expression('folder:WebsiteNgIniwan')
      .sort_by('created_at', 'desc')
      .max_results(50)
      .execute();
    
    const files = searchResult.resources.map(file => {
      const rawName = file.public_id.split('/').pop();
      const cleanBase = rawName.replace(/_[0-9]+$/, '').replace(/_/g, ' ');
      const displayName = cleanBase + (file.format ? '.' + file.format : '');
      return {
        name: displayName,
        url: file.secure_url,
        created_at: file.created_at,
        format: file.format || file.resource_type
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
