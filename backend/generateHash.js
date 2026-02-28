const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'admin123'; // Ganti dengan password yang Anda inginkan
  const hash = await bcrypt.hash(password, 10);
  console.log('Password yang dimasukkan:', password);
  console.log('Hash password:', hash);
  console.log('\nCopy hash di atas untuk update MongoDB');
}

generateHash();
