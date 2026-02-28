const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Informasi Akun WhatsApp
  accountName: {
    type: String,
    required: true,
    default: function() {
      return `Akun ${this.phoneNumber}`;
    }
  },
  phoneNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'scanning'],
    default: 'disconnected'
  },
  
  // Informasi Session
  qrCode: String,
  sessionData: String,
  
  // KONFIGURASI BLAST PER AKUN
  blastConfig: {
    isActive: {
      type: Boolean,
      default: false
    },
    contactsCount: {
      type: Number,
      default: 0
    },
    delay: {
      type: Number,
      default: 5
    },
    message: String,
    // Harga per blast (bisa berbeda tiap akun)
    pricePerBlast: {
      type: Number,
      default: 100 // Rupiah per pesan terkirim
    }
  },
  
  // STATISTIK BLAST PER AKUN
  stats: {
    totalBlasted: {
      type: Number,
      default: 0
    },
    successCount: {
      type: Number,
      default: 0
    },
    failedCount: {
      type: Number,
      default: 0
    },
    lastBlast: Date,
    
    // Untuk perhitungan penghasilan
    todayBlasted: {
      type: Number,
      default: 0
    },
    todayEarnings: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    }
  },
  
  // Riwayat penghasilan (untuk pencairan)
  earnings: [{
    date: Date,
    amount: Number,
    blastCount: Number,
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending'
    }
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual field untuk menghitung potensi penghasilan
accountSchema.virtual('potentialEarnings').get(function() {
  return (this.stats.successCount || 0) * (this.blastConfig.pricePerBlast || 100);
});

module.exports = mongoose.model('Account', accountSchema);
