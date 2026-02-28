const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  name: String,
  email: String,
  active: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password sebelum save
userSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('password')) return next();
    console.log('🔐 Hashing password for user:', this.username);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('✅ Password hashed successfully');
    next();
  } catch (error) {
    console.error('❌ Error hashing password:', error);
    next(error);
  }
});

// Method compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('🔍 Comparing password for user:', this.username);
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('❌ Error comparing password:', error);
    return false;
  }
};

// PENTING: Pastikan export seperti ini
const User = mongoose.model('User', userSchema);
module.exports = User;