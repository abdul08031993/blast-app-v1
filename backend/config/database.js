const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Gunakan MONGODB_URI dari environment variable
    const mongoURI = process.env.MONGODB_URI;
    
    console.log('🔍 Mencoba konek ke MongoDB...');
    console.log('📍 URI exists:', !!mongoURI);
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB Connected...');
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    // Jangan exit, biarkan server tetap jalan
    console.log('⚠️ Server tetap jalan tanpa database');
  }
};

module.exports = connectDB;
