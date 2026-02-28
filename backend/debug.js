const fs = require('fs');
const path = require('path');

// Buat folder logs jika belum ada
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

class Debugger {
  constructor(moduleName) {
    this.moduleName = moduleName;
    this.logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);
  }

  // Log dengan timestamp
  log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.moduleName}] ${message}`;
    
    // Tampilkan di console dengan warna
    console.log('\x1b[36m%s\x1b[0m', logMessage); // Cyan
    
    // Jika ada data, tampilkan juga
    if (data) {
      if (typeof data === 'object') {
        console.log('\x1b[33m%s\x1b[0m', JSON.stringify(data, null, 2)); // Yellow
      } else {
        console.log('\x1b[33m%s\x1b[0m', data); // Yellow
      }
    }
    
    // Simpan ke file
    fs.appendFileSync(this.logFile, logMessage + '\n');
    if (data) {
      fs.appendFileSync(this.logFile, JSON.stringify(data, null, 2) + '\n');
    }
  }

  // Log error
  error(message, error = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.moduleName}] ❌ ERROR: ${message}`;
    
    // Tampilkan di console dengan warna merah
    console.log('\x1b[31m%s\x1b[0m', logMessage);
    
    if (error) {
      if (error.stack) {
        console.log('\x1b[31m%s\x1b[0m', error.stack);
        fs.appendFileSync(this.logFile, error.stack + '\n');
      } else {
        console.log('\x1b[31m%s\x1b[0m', error);
        fs.appendFileSync(this.logFile, error + '\n');
      }
    }
    
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  // Log sukses
  success(message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.moduleName}] ✅ ${message}`;
    
    console.log('\x1b[32m%s\x1b[0m', logMessage); // Hijau
    if (data) {
      console.log('\x1b[32m%s\x1b[0m', JSON.stringify(data, null, 2));
    }
    
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  // Log warning
  warn(message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.moduleName}] ⚠️ ${message}`;
    
    console.log('\x1b[33m%s\x1b[0m', logMessage); // Kuning
    if (data) {
      console.log('\x1b[33m%s\x1b[0m', JSON.stringify(data, null, 2));
    }
    
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }
}

module.exports = Debugger;
