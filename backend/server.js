const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
try {
  dotenv.config();
  console.log('✅ Environment variables loaded');
} catch (err) {
  console.error('❌ Error loading .env:', err);
}

console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 PORT:', process.env.PORT);
console.log('🔍 MONGO_URL exists:', !!process.env.MONGO_URL);
console.log('🔍 JWT_SECRET exists:', !!process.env.JWT_SECRET);

// Import dengan try-catch
let connectDB, authRoutes, adminRoutes, userRoutes;
try {
  connectDB = require('./config/database');
  authRoutes = require('./routes/auth');
  adminRoutes = require('./routes/admin');
  userRoutes = require('./routes/user');
  console.log('✅ All routes imported successfully');
} catch (err) {
  console.error('❌ Error importing routes:', err);
  process.exit(1);
}

const app = express();
console.log('✅ Express app created');

// ========== DEBUG PATH ==========
console.log('\n========== DEBUG PATH ==========');
console.log('__dirname:', __dirname);
console.log('Current working directory:', process.cwd());

const possiblePaths = [
  path.join(__dirname, '../frontend'),
  path.join(__dirname, 'frontend'),
  '/app/frontend',
  path.join(process.cwd(), 'frontend'),
  path.join(process.cwd(), '../frontend')
];

let frontendPath = null;
possiblePaths.forEach((p, i) => {
  console.log(`\nPath ${i+1}: ${p}`);
  const exists = fs.existsSync(p);
  console.log(`  Exists: ${exists}`);
  
  if (exists) {
    try {
      const contents = fs.readdirSync(p);
      console.log(`  Contents:`, contents);
      
      // Cek isi folder admin dan user
      const adminPath = path.join(p, 'admin');
      const userPath = path.join(p, 'user');
      const assetsPath = path.join(p, 'assets');
      
      if (fs.existsSync(adminPath)) {
        console.log(`  ✅ Admin folder found`);
        console.log(`  Admin contents:`, fs.readdirSync(adminPath));
        if (!frontendPath) frontendPath = p;
      }
      if (fs.existsSync(userPath)) {
        console.log(`  ✅ User folder found`);
        console.log(`  User contents:`, fs.readdirSync(userPath));
        if (!frontendPath) frontendPath = p;
      }
      if (fs.existsSync(assetsPath)) {
        console.log(`  ✅ Assets folder found`);
      }
    } catch (err) {
      console.error(`  ❌ Error reading directory:`, err.message);
    }
  }
});

// Fallback
if (!frontendPath) {
  frontendPath = path.join(__dirname, '../frontend');
  console.log(`\n⚠️ Using fallback frontend path: ${frontendPath}`);
  
  // Cek apakah fallback path ada
  if (fs.existsSync(frontendPath)) {
    console.log(`✅ Fallback path exists`);
    console.log(`Contents:`, fs.readdirSync(frontendPath));
  } else {
    console.error(`❌ Fallback path DOES NOT EXIST!`);
  }
}
console.log('========== END DEBUG ==========\n');

// Middleware
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.url}`);
  next();
});

app.use(cors());
console.log('✅ CORS middleware');

app.use(express.json());
console.log('✅ JSON middleware');

app.use(express.urlencoded({ extended: true }));
console.log('✅ URL encoded middleware');

// ========== STATIC FILES ==========
try {
  if (frontendPath && fs.existsSync(frontendPath)) {
    const assetsPath = path.join(frontendPath, 'assets');
    if (fs.existsSync(assetsPath)) {
      app.use('/assets', express.static(assetsPath));
      console.log('✅ Assets static middleware');
    } else {
      console.log('⚠️ Assets folder not found');
    }
  } else {
    console.log('⚠️ Frontend path not valid, skipping static files');
  }
} catch (err) {
  console.error('❌ Error setting up static files:', err);
}

// ========== ROUTES MANUAL DENGAN ERROR HANDLING ==========
// Halaman Admin
app.get('/admin', (req, res) => {
  try {
    const filePath = path.join(frontendPath, 'admin', 'index.html');
    console.log(`📄 Trying to serve: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.error(`❌ File not found: ${filePath}`);
      res.status(404).send('Admin login page not found');
    }
  } catch (err) {
    console.error('❌ Error serving /admin:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/admin/dashboard', (req, res) => {
  try {
    const filePath = path.join(frontendPath, 'admin', 'dashboard.html');
    console.log(`📄 Trying to serve: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.error(`❌ File not found: ${filePath}`);
      res.status(404).send('Admin dashboard not found');
    }
  } catch (err) {
    console.error('❌ Error serving /admin/dashboard:', err);
    res.status(500).json({ error: err.message });
  }
});

// Halaman User
app.get('/user', (req, res) => {
  try {
    const filePath = path.join(frontendPath, 'user', 'index.html');
    console.log(`📄 Trying to serve: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.error(`❌ File not found: ${filePath}`);
      res.status(404).send('User login page not found');
    }
  } catch (err) {
    console.error('❌ Error serving /user:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/user/dashboard', (req, res) => {
  try {
    const filePath = path.join(frontendPath, 'user', 'dashboard.html');
    console.log(`📄 Trying to serve: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.error(`❌ File not found: ${filePath}`);
      res.status(404).send('User dashboard not found');
    }
  } catch (err) {
    console.error('❌ Error serving /user/dashboard:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/user/register', (req, res) => {
  try {
    const filePath = path.join(frontendPath, 'user', 'register.html');
    console.log(`📄 Trying to serve: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.error(`❌ File not found: ${filePath}`);
      res.status(404).send('User register page not found');
    }
  } catch (err) {
    console.error('❌ Error serving /user/register:', err);
    res.status(500).json({ error: err.message });
  }
});

// Test route
app.get('/test', (req, res) => {
  console.log('✅ Test route accessed');
  res.json({ 
    message: 'Server is working!',
    frontendPath: frontendPath,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT
  });
});

// API Routes dengan error handling
try {
  console.log('\n📌 Registering API routes...');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes registered');
  
  app.use('/api/admin', adminRoutes);
  console.log('✅ Admin routes registered');
  
  app.use('/api/user', userRoutes);
  console.log('✅ User routes registered');
} catch (err) {
  console.error('❌ Error registering API routes:', err);
}

// ========== 404 HANDLER ==========
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url} not found`);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.url,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  console.error('❌ Stack:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Connect to database
console.log('\n📌 Connecting to database...');
if (connectDB) {
  connectDB().catch(err => {
    console.error('❌ Database connection failed:', err);
  });
} else {
  console.error('❌ connectDB function not available');
}

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`\n🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📊 Admin login: https://blast-app-v1-production.up.railway.app/admin`);
  console.log(`📊 Admin dashboard: https://blast-app-v1-production.up.railway.app/admin/dashboard`);
  console.log(`👤 User login: https://blast-app-v1-production.up.railway.app/user`);
  console.log(`👤 User dashboard: https://blast-app-v1-production.up.railway.app/user/dashboard`);
  console.log(`👤 User register: https://blast-app-v1-production.up.railway.app/user/register`);
  console.log(`📅 ${new Date().toLocaleString()}\n`);
  console.log('✅ Server ready to accept requests');
});
