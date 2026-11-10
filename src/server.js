const express = require('express');
const basicAuth = require('basic-auth');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const open = require('child_process');

const app = express();
const PORT = 8443;
const USERNAME = 'admin';
const PASSWORD = 'oxvox2026';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Autentikasi Sederhana
const auth = (req, res, next) => {
    const user = basicAuth(req);
    if (!user || user.name !== USERNAME || user.pass !== PASSWORD) {
        res.set('WWW-Authenticate', 'Basic realm="OXVOX"');
        return res.status(401).send('Akses Ditolak. Gunakan admin:oxvox2026');
    }
    next();
};

app.use(auth);

// API Info Sistem
app.get('/api/system', (req, res) => {
    res.json({
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: os.uptime(),
        totalmem: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        freemem: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        cpus: os.cpus().length,
        user: os.userInfo().username
    });
});

// API Eksekusi Perintah (Hanya untuk mesin lokal sendiri)
app.post('/api/exec', (req, res) => {
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: 'Command required' });
    
    exec(command, (error, stdout, stderr) => {
        if (error) return res.json({ output: stderr || error.message });
        res.json({ output: stdout });
    });
});

// API Manajemen File
app.get('/api/files', (req, res) => {
    const targetPath = req.query.path || os.homedir();
    try {
        const files = fs.readdirSync(targetPath).map(file => {
            const stat = fs.statSync(path.join(targetPath, file));
            return { name: file, isDir: stat.isDirectory(), size: stat.size };
        });
        res.json({ path: targetPath, files });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`[OXVOX] Aplikasi berjalan di http://localhost:${PORT}`);
    console.log(`[OXVOX] Login: admin | Password: oxvox2026`);
    
    // Buka browser otomatis (Windows/Mac/Linux)
    const url = `http://localhost:${PORT}`;
    const start = os.platform() === 'win32' ? 'start' : os.platform() === 'darwin' ? 'open' : 'xdg-open';
    open.exec(`${start} ${url}`);
});
