const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Route untuk halaman admin
app.get('/admin', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'admin.html');
    console.log('Mencoba baca:', filePath);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.send('File admin.html tidak ditemukan');
    }
});

// Route untuk halaman user
app.get('/user', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'user.html');
    console.log('Mencoba baca:', filePath);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.send('File user.html tidak ditemukan');
    }
});

// Route test
app.get('/test', (req, res) => {
    res.json({ message: 'Server OK!' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Admin: http://localhost:${PORT}/admin`);
    console.log(`👤 User: http://localhost:${PORT}/user`);
});
