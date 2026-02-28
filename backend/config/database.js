const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔍 MONGODB_URI exists:', !!process.env.MONGO_URL);
    console.log('🔍 MONGODB_URI value starts with:', process.env.MONGO_URL?.substring(0, 20));
    
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 5000, // Timeout 5 detik
    });
    console.log('✅ MongoDB Connected...');
  } catch (err) {
    console.error('❌ Database connection error details:');
    console.error('Name:', err.name);
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    process.exit(1);
  }
};

module.exports = connectDB;
