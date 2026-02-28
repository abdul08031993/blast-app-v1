📱 BLAST APP - WhatsApp Blast Application
Aplikasi untuk melakukan broadcast WhatsApp dengan sistem multiple akun dan penghasilan otomatis untuk user.

📋 Daftar Isi
Fitur Utama

Teknologi

Struktur Folder

Persyaratan Sistem

Instalasi di Lokal

Konfigurasi

Menjalankan Aplikasi

Deploy ke VPS

Troubleshooting

Cara Penggunaan

API Documentation

✨ Fitur Utama
Untuk User:
✅ Register & login

✅ Menambahkan multiple akun WhatsApp sendiri

✅ Scan QR code untuk konek WhatsApp

✅ Melihat statistik blast per akun

✅ Melihat total penghasilan (Rp per pesan sukses)

✅ Menarik saldo ke rekening bank

Untuk Admin:
✅ Melihat semua akun user

✅ Filter & pencarian akun

✅ Konfigurasi blast (jumlah kontak, delay, pesan)

✅ Upload kontak via CSV

✅ Monitor progress blast real-time

✅ Proses penarikan saldo user

✅ Statistik global aplikasi

🛠️ Teknologi
Komponen	Teknologi
Backend	Node.js, Express.js
Database	MongoDB, Mongoose
Frontend	HTML5, CSS3, JavaScript
WhatsApp	Baileys Library
QR Code	QRCode
Auth	JWT, Bcrypt
Process Manager	PM2 (production)
Reverse Proxy	Nginx
Server	Ubuntu 20.04/22.04/24.04
blast-app/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── userController.js
│   │   ├── userAccountController.js
│   │   └── earningsController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Account.js
│   │   └── BlastLog.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── admin.js
│   │   └── user.js
│   ├── whatsappClientBaileys.js
│   ├── server.js
│   └── .env
├── frontend/
│   ├── admin/
│   │   └── dashboard.html
│   ├── user/
│   │   ├── index.html
│   │   ├── register.html
│   │   └── dashboard.html
│   └── assets/
│       └── css/
│           └── style.css
├── package.json
└── README.md
💻 Persyaratan Sistem
Lokal / Development
Node.js v18 atau v20

MongoDB v6 atau v7

NPM v9+

Chrome/Chromium (untuk Puppeteer)

VPS / Production
Ubuntu 20.04/22.04/24.04

RAM minimal 2GB

Storage 20GB+

Domain (opsional)

🔧 Instalasi di Lokal
1. Clone Repository
bash
git clone https://github.com/username/blast-app.git
cd blast-app
2. Install MongoDB
bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb
3. Install Node.js Dependencies
bash
cd backend
npm install
4. Install Chrome untuk Puppeteer
bash
npx puppeteer browsers install chrome
5. Setup Environment Variables
bash
cp .env.example .env
nano .env
Isi file .env:

env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/blast_app
JWT_SECRET=your_super_secret_key_change_this
SESSION_SECRET=your_session_secret
NODE_ENV=development
6. Buat User Admin Awal
bash
mongosh
use blast_app
db.users.insert({
  username: "admin",
  password: "admin123",  # Akan diubah nanti
  role: "admin",
  name: "Administrator",
  active: true,
  createdAt: new Date()
})
exit
🚀 Menjalankan Aplikasi
Development Mode
bash
cd backend
npm run dev
# atau
node server.js
Production Mode (dengan PM2)
bash
npm install -g pm2
cd backend
pm2 start server.js --name blast-app
pm2 save
pm2 startup
Akses Aplikasi
Admin: http://localhost:3000/admin

User: http://localhost:3000/user

☁️ Deploy ke VPS
1. Persiapan di VPS
bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
2. Install MongoDB di VPS
bash
# Import GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Tambah repository (Ubuntu 22.04)
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
3. Upload File ke VPS
bash
# Dari komputer lokal
cd ~/blast-app
tar -czf blast-app.tar.gz blast-app/
scp -r blast-app.tar.gz root@IP_VPS:/root/

# Di VPS
ssh root@IP_VPS
cd /root
tar -xzf blast-app.tar.gz
cd blast-app/backend
npm install --production
npx puppeteer browsers install chrome
4. Setup Environment di VPS
bash
cd ~/blast-app/backend
nano .env
env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/blast_app
JWT_SECRET=buat_string_acak_yang_sangat_kuat
SESSION_SECRET=buat_string_acak_lagi
NODE_ENV=production
5. Jalankan dengan PM2
bash
cd ~/blast-app/backend
pm2 start server.js --name blast-app
pm2 startup systemd
pm2 save
6. Konfigurasi Nginx
bash
sudo nano /etc/nginx/sites-available/blast-app
nginx
server {
    listen 80;
    server_name IP_VPS_ANDA atau domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /assets {
        alias /root/blast-app/frontend/assets;
        expires 30d;
    }
}
bash
sudo ln -s /etc/nginx/sites-available/blast-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
7. Setup Firewall
bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
8. Setup SSL (Jika Punya Domain)
bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d domain-anda.com
🔍 Troubleshooting
Error: Cannot find module
bash
cd backend
npm install
Error: MongoDB connection failed
bash
sudo systemctl status mongod
sudo systemctl restart mongod
Error: QR Code tidak muncul
bash
# Cek Chrome installation
npx puppeteer browsers install chrome

# Cek log
pm2 logs blast-app
Error: Port 3000 already in use
bash
sudo lsof -i :3000
sudo kill -9 [PID]
Backup Database
bash
mongodump --db blast_app --out /backup/$(date +%Y%m%d)
Restore Database
bash
mongorestore --db blast_app /backup/20250225/blast_app
📖 Cara Penggunaan
Untuk User:
Register di halaman user

Login dengan username & password

Tambah akun WhatsApp (klik "Tambah Akun Baru")

Scan QR untuk konek WhatsApp

Tunggu admin melakukan blast

Lihat penghasilan di dashboard

Tarik saldo ke rekening

Untuk Admin:
Login di halaman admin

Lihat semua akun user

Filter akun berdasarkan status/user

Pilih akun yang terhubung

Atur blast (jumlah kontak, delay, pesan)

Upload kontak via CSV (opsional)

Monitor progress blast

Proses penarikan saldo user

📡 API Documentation
Auth Endpoints
Method	Endpoint	Deskripsi
POST	/api/auth/register	Register user baru
POST	/api/auth/login	Login user
User Endpoints
Method	Endpoint	Deskripsi
GET	/api/user/accounts	Lihat semua akun user
POST	/api/user/accounts/add	Tambah akun baru
POST	/api/user/accounts/:id/connect	Connect WhatsApp
GET	/api/user/accounts/:id/qr	Ambil QR code
POST	/api/user/accounts/:id/disconnect	Disconnect
GET	/api/user/stats	Lihat statistik
POST	/api/user/withdraw	Request penarikan
Admin Endpoints
Method	Endpoint	Deskripsi
GET	/api/admin/accounts	Lihat semua akun
PUT	/api/admin/accounts/:id	Update akun (blast)
GET	/api/admin/stats	Statistik global
GET	/api/admin/withdrawals	Lihat request WD
PUT	/api/admin/withdrawals/:userId/:wdId	Proses WD
📝 Catatan Penting
Format nomor telepon: Gunakan format internasional tanpa + atau 0 (contoh: 628123456789)

File CSV kontak: Satu nomor per baris, format sama seperti di atas

Session WhatsApp: Tersimpan otomatis, tidak perlu scan ulang

Harga per blast: Default Rp 100, bisa diubah admin

Minimal penarikan: Rp 50.000

Auto refresh: Dashboard refresh setiap 30 detik

🔒 Security Notes
Ganti JWT_SECRET dengan string acak yang kuat

Aktifkan firewall di VPS

Gunakan HTTPS di production

Backup database secara rutin

Monitor log aplikasi dengan PM2

🆘 Support
Jika ada masalah atau pertanyaan:

Buka issue di GitHub

Cek log di pm2 logs

Cek MongoDB status

Pastikan semua dependencies terinstall

📄 License
MIT License - Silakan gunakan dan modifikasi sesuai kebutuhan.

