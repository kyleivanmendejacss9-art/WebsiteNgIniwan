const express = require('express');
const session = require('express-session');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.set('trust proxy', 1);

app.use(session({
    secret: process.env.SESSION_SECRET || 'aurora_secret_key_change_me',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'aurora_web_hub',
        resource_type: 'auto'
    }
});
const upload = multer({ storage: storage });

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'Kyle') {
        req.session.admin = true;
        return res.json({ success: true, message: 'Logged in successfully' });
    }
    res.status(401).json({ success: false, message: 'Invalid credentials' });
});

const requireAdmin = (req, res, next) => {
    if (req.session && req.session.admin) {
        return next();
    }
    return res.status(401).json({ error: 'Admin session expired. Please re-login.' });
};

app.post('/api/upload', requireAdmin, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        res.json({ 
            success: true, 
            url: req.file.path,
            public_id: req.file.filename 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`AURORA active on port ${PORT}`);
});
