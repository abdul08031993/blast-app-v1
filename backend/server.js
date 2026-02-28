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

// List semua file di root untuk debugging
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

// Cari folder frontend dengan berbagai kemungkinan
let frontendPath = null;
const possiblePaths = [
  path.join(process.cwd(), 'frontend'),                    // /app/frontend
  path.join(__dirname, 'frontend'),                         // /app/backend/frontend
  path.join(__dirname, '../frontend'),                      // /app/frontend
  '/app/frontend',                                          // Hardcoded
  '/frontend',                                              // /frontend
  path.join(process.cwd(), 'blast-app-v1', 'frontend'),    // /app/blast-app-v1/frontend
  path.join('/app', 'blast-app-v1', 'frontend'),
  path.join('/home', 'harmed', 'blast-app', 'frontend'),   // Path lokal
];

for (const p of possiblePaths) {
  console.log(`\n🔍 Checking path: ${p}`);
  const exists = fs.existsSync(p);
  console.log(`  Exists: ${exists}`);
  
  if (exists) {
    try {
      const contents = fs.readdirSync(p);
      console.log(`  Contents:`, contents);
      
      // Cek apakah ada folder admin
      const adminPath = path.join(p, 'admin');
      if (fs.existsSync(adminPath)) {
        console.log(`  ✅ Admin folder ditemukan di ${adminPath}`);
        console.log(`  Admin contents:`, fs.readdirSync(adminPath));
        frontendPath = p;
        break;
      }
      
      // Cek apakah ada folder user
      const userPath = path.join(p, 'user');
      if (fs.existsSync(userPath)) {
        console.log(`  ✅ User folder ditemukan di ${userPath}`);
        console.log(`  User contents:`, fs.readdirSync(userPath));
        frontendPath = p;
        break;
      }
    } catch (err) {
      console.log(`  ❌ Error reading: ${err.message}`);
    }
  }
}

// Jika masih null, gunakan fallback
if (!frontendPath) {
  console.log('\n⚠️ Frontend path tidak ditemukan, menggunakan fallback');
  frontendPath = '/app/frontend';
  console.log(`Menggunakan fallback path: ${frontendPath}`);
  
  // Buat direktori virtual untuk testing
  console.log('Catatan: Path ini mungkin tidak ada, akan menggunakan alternatif');
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
// Serve assets (jika ada)
try {
  const assetsPath = path.join(frontendPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    app.use('/assets', express.static(assetsPath));
    console.log('✅ Assets static middleware - serving from:', assetsPath);
  } else {
    // Coba cari assets di lokasi lain
    const altAssetsPath = path.join(process.cwd(), 'frontend', 'assets');
    if (fs.existsSync(altAssetsPath)) {
      app.use('/assets', express.static(altAssetsPath));
      console.log('✅ Assets found at alternative path:', altAssetsPath);
    } else {
      console.log('⚠️ Assets folder not found');
    }
  }
} catch (err) {
  console.error('❌ Error setting up assets:', err);
}

// ========== ROUTES MANUAL UNTUK HTML ==========
// Fungsi helper untuk serve file dengan fallback
function serveHTML(res, filePath, altPaths = []) {
  console.log(`📄 Trying to serve: ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  
  // Coba alternative paths
  for (const altPath of altPaths) {
    console.log(`📄 Trying alternative: ${altPath}`);
    if (fs.existsSync(altPath)) {
      return res.sendFile(altPath);
    }
  }
  
  // Kirim halaman error
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>404 - File Not Found</title>
        <style>
          body { font-family: Arial; padding: 40px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #e74c3c; }
          pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
          .path { color: #2980b9; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ 404 - File Not Found</h1>
          <p>Tried to serve:</p>
          <pre class="path">${filePath}</pre>
          
          <h3>Alternative paths tried:</h3>
          <ul>
            ${altPaths.map(p => `<li><pre>${p}</pre></li>`).join('')}
          </ul>
          
          <h3>Debug Info:</h3>
          <pre>
frontendPath: ${frontendPath}
__dirname: ${__dirname}
cwd: ${process.cwd()}
          </pre>
          
          <p>Please check your file structure and try again.</p>
        </div>
      </body>
    </html>
  `);
}

// Halaman Admin
app.get('/admin', (req, res) => {
  try {
    if (!frontendPath) {
      throw new Error('frontendPath is null');
    }
    
    const filePath = path.join(frontendPath, 'admin', 'index.html');
    const altPaths = [
      path.join(process.cwd(), 'frontend', 'admin', 'index.html'),
      path.join('/app', 'frontend', 'admin', 'index.html'),
      path.join(__dirname, '../frontend/admin/index.html')
    ];
    
    serveHTML(res, filePath, altPaths);
  } catch (err) {
    console.error('❌ Error serving /admin:', err);
    res.status(500).send(`
      <html>
        <head><title>500 Internal Error</title></head>
        <body>
          <h1>500 - Internal Server Error</h1>
          <p>Error: ${err.message}</p>
          <pre>${err.stack}</pre>
        </body>
      </html>
    `);
  }
});

app.get('/admin/dashboard', (req, res) => {
  try {
    if (!frontendPath) {
      throw new Error('frontendPath is null');
    }
    
    const filePath = path.join(frontendPath, 'admin', 'dashboard.html');
    const altPaths = [
      path.join(process.cwd(), 'frontend', 'admin', 'dashboard.html'),
      path.join('/app', 'frontend', 'admin', 'dashboard.html'),
      path.join(__dirname, '../frontend/admin/dashboard.html')
    ];
    
    serveHTML(res, filePath, altPaths);
  } catch (err) {
    console.error('❌ Error serving /admin/dashboard:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Halaman User
app.get('/user', (req, res) => {
  try {
    if (!frontendPath) {
      throw new Error('frontendPath is null');
    }
    
    const filePath = path.join(frontendPath, 'user', 'index.html');
    const altPaths = [
      path.join(process.cwd(), 'frontend', 'user', 'index.html'),
      path.join('/app', 'frontend', 'user', 'index.html'),
      path.join(__dirname, '../frontend/user/index.html')
    ];
    
    serveHTML(res, filePath, altPaths);
  } catch (err) {
    console.error('❌ Error serving /user:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/user/dashboard', (req, res) => {
  try {
    if (!frontendPath) {
      throw new Error('frontendPath is null');
    }
    
    const filePath = path.join(frontendPath, 'user', 'dashboard.html');
    const altPaths = [
      path.join(process.cwd(), 'frontend', 'user', 'dashboard.html'),
      path.join('/app', 'frontend', 'user', 'dashboard.html'),
      path.join(__dirname, '../frontend/user/dashboard.html')
    ];
    
    serveHTML(res, filePath, altPaths);
  } catch (err) {
    console.error('❌ Error serving /user/dashboard:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/user/register', (req, res) => {
  try {
    if (!frontendPath) {
      throw new Error('frontendPath is null');
    }
    
    const filePath = path.join(frontendPath, 'user', 'register.html');
    const altPaths = [
      path.join(process.cwd(), 'frontend', 'user', 'register.html'),
      path.join('/app', 'frontend', 'user', 'register.html'),
      path.join(__dirname, '../frontend/user/register.html')
    ];
    
    serveHTML(res, filePath, altPaths);
  } catch (err) {
    console.error('❌ Error serving /user/register:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Test route untuk cek server
app.get('/test', (req, res) => {
  console.log('✅ Test route accessed');
  
  // Kumpulkan info debug
  const debug = {
    message: 'Server is working!',
    frontendPath: frontendPath,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    mongodbConnected: mongoose.connection.readyState === 1,
    currentDir: process.cwd(),
    dirname: __dirname,
    files: {}
  };
  
  // Coba baca beberapa direktori
  try {
    debug.files.currentDir = fs.readdirSync(process.cwd());
  } catch (e) {}
  
  try {
    debug.files.appDir = fs.readdirSync('/app');
  } catch (e) {}
  
  res.json(debug);
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
    // Coba cari file di berbagai lokasi
    const possibleLocations = [
      path.join(frontendPath, req.url),
      path.join(process.cwd(), 'frontend', req.url),
      path.join('/app', 'frontend', req.url),
      path.join(__dirname, '../frontend', req.url)
    ];
    
    for (const loc of possibleLocations) {
      if (fs.existsSync(loc)) {
        console.log(`📄 File found at: ${loc}`);
        return res.sendFile(loc);
      }
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
