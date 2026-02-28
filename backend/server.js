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

// Import routes dengan error handling
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

// ========== PATH DEBUG UNTUK RAILWAY ==========
console.log('\n========== RAILWAY PATH DEBUG ==========');
console.log('__dirname:', __dirname);
console.log('Current working directory:', process.cwd());

// List semua file di current directory
console.log('\n📁 Files in current directory:');
try {
  const files = fs.readdirSync(process.cwd());
  console.log(files);
} catch (err) {
  console.error('Error reading current dir:', err);
}

// List semua file di root /app
console.log('\n📁 Files in /app directory:');
try {
  const files = fs.readdirSync('/app');
  console.log(files);
} catch (err) {
  console.error('Error reading /app dir:', err);
}

// Path yang mungkin benar
const possiblePaths = [
  path.join(__dirname, '../frontend'),                    // /app/backend/../frontend
  path.join(process.cwd(), 'frontend'),                   // /app/frontend
  '/app/frontend',
  path.join('/app', 'frontend'),
  path.join(__dirname, '../../frontend'),                  // /frontend
  '/frontend',
];

let frontendPath = null;

for (const p of possiblePaths) {
  console.log(`\n🔍 Checking path: ${p}`);
  const exists = fs.existsSync(p);
  console.log(`  Exists: ${exists}`);
  
  if (exists) {
    try {
      const contents = fs.readdirSync(p);
      console.log(`  Contents:`, contents);
      
      // Cek folder admin dan user
      const adminPath = path.join(p, 'admin');
      const userPath = path.join(p, 'user');
      
      if (fs.existsSync(adminPath)) {
        console.log(`  ✅ Admin folder FOUND at ${adminPath}`);
        console.log(`  Admin files:`, fs.readdirSync(adminPath));
        frontendPath = p;
      } else {
        console.log(`  ❌ Admin folder NOT found at ${adminPath}`);
      }
      
      if (fs.existsSync(userPath)) {
        console.log(`  ✅ User folder FOUND at ${userPath}`);
        console.log(`  User files:`, fs.readdirSync(userPath));
        frontendPath = p;
      } else {
        console.log(`  ❌ User folder NOT found at ${userPath}`);
      }
    } catch (err) {
      console.error(`  ❌ Error reading directory:`, err.message);
    }
  }
}

console.log(`\n✅ FINAL FRONTEND PATH: ${frontendPath}`);
console.log('========== END PATH DEBUG ==========\n');
// Middleware dengan logging
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

// ========== SERVE STATIC FILES ==========
// Serve assets
try {
  const assetsPath = path.join(frontendPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    app.use('/assets', express.static(assetsPath));
    console.log('✅ Assets static middleware - serving from:', assetsPath);
  } else {
    console.log('⚠️ Assets folder not found at:', assetsPath);
  }
} catch (err) {
  console.error('❌ Error setting up assets:', err);
}

// ========== ROUTES MANUAL UNTUK HTML ==========
// Halaman Admin
app.get('/admin', (req, res) => {
  try {
    const filePath = path.join(frontendPath, 'admin', 'index.html');
    console.log(`📄 Trying to serve admin login: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.error(`❌ Admin login file not found at: ${filePath}`);
      res.status(404).send(`
        <html>
          <head><title>404 Not Found</title></head>
          <body>
            <h1>404 - Admin Login Page Not Found</h1>
            <p>Looking for: ${filePath}</p>
            <p>Frontend path: ${frontendPath}</p>
            <p>Please check your file structure.</p>
          </body>
        </html>
      `);
    }
  } catch (err) {
    console.error('❌ Error serving /admin:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/admin/dashboard', (req, res) => {
  try {
    const filePath = path.join(frontendPath, 'admin', 'dashboard.html');
    console.log(`📄 Trying to serve admin dashboard: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.error(`❌ Admin dashboard file not found at: ${filePath}`);
      res.status(404).send('Admin dashboard not found');
    }
  } catch (err) {
    console.error('❌ Error serving /admin/dashboard:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Halaman User
app.get('/user', (req, res) => {
  try {
    const filePath = path.join(frontendPath, 'user', 'index.html');
    console.log(`📄 Trying to serve user login: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.error(`❌ User login file not found at: ${filePath}`);
      res.status(404).send('User login page not found');
    }
  } catch (err) {
    console.error('❌ Error serving /user:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/user/dashboard', (req, res) => {
  try {
    const filePath = path.join(frontendPath, 'user', 'dashboard.html');
    console.log(`📄 Trying to serve user dashboard: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.error(`❌ User dashboard file not found at: ${filePath}`);
      res.status(404).send('User dashboard not found');
    }
  } catch (err) {
    console.error('❌ Error serving /user/dashboard:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/user/register', (req, res) => {
  try {
    const filePath = path.join(frontendPath, 'user', 'register.html');
    console.log(`📄 Trying to serve user register: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.error(`❌ User register file not found at: ${filePath}`);
      res.status(404).send('User register page not found');
    }
  } catch (err) {
    console.error('❌ Error serving /user/register:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Test route untuk cek server
app.get('/test', (req, res) => {
  console.log('✅ Test route accessed');
  res.json({ 
    message: 'Server is working!',
    frontendPath: frontendPath,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    mongodbConnected: mongoose.connection.readyState === 1
  });
});

// API Routes
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
  
  // Cek apakah ini request untuk file HTML statis
  if (req.url.endsWith('.html')) {
    const possibleFile = path.join(frontendPath, req.url);
    if (fs.existsSync(possibleFile)) {
      console.log(`📄 File exists tapi tidak terdaftar: ${possibleFile}`);
      return res.sendFile(possibleFile);
    }
  }
  
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
  console.log('✅ Server ready to accept requests from Railway proxy');
});
