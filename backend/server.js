const express = require('express');
const path = require('path');
const app = express();

// Route untuk test
app.get('/test', (req, res) => {
  res.json({ message: 'Server jalan!' });
});

// Serve file static dari frontend
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin')));
app.use('/user', express.static(path.join(__dirname, '../frontend/user')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Admin: http://localhost:${PORT}/admin`);
  console.log(`👤 User: http://localhost:${PORT}/user`);
});
