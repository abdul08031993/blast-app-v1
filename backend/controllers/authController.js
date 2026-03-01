const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
// Register
const register = async (req, res) => {
  try {
    console.log('\n========== REGISTER ATTEMPT ==========');
    console.log('Request body:', req.body);
    
    const { username, password, name, email } = req.body;

    if (!username || !password) {
      console.log('❌ Missing username or password');
      return res.status(400).json({ error: 'Username and password required' });
    }

    console.log('🔍 Checking if user exists:', username);
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('❌ User already exists');
      return res.status(400).json({ error: 'Username already exists' });
    }

    console.log('✅ Username available, creating user...');
    const user = new User({
      username,
      password,
      name: name || username,
      email: email || '',
      role: 'user'
    });

    await user.save();
    console.log('✅ User saved with ID:', user._id);

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Register successful');
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name
      }
    });

  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Login dengan Debug Detail
const login = async (req, res) => {
  try {
    console.log('\n========== LOGIN ATTEMPT ==========');
    console.log('Time:', new Date().toISOString());
    console.log('Request body:', req.body);
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('MongoDB connection state:', mongoose.connection.readyState);
    
    const { username, password } = req.body;

    // Validasi input
    if (!username || !password) {
      console.log('❌ Missing username or password');
      return res.status(400).json({ error: 'Username and password required' });
    }

    console.log('🔍 Searching for user:', username);
    
    // Cari user
    const user = await User.findOne({ username });
    
    if (!user) {
      console.log('❌ User not found in database');
      console.log('Available users:', await User.find().select('username'));
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ User found:', {
      id: user._id,
      username: user.username,
      role: user.role,
      hasPassword: !!user.password
    });

    // Cek password
    console.log('🔐 Comparing password...');
    const isMatch = await user.comparePassword(password);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Password does not match');
      
      // Debug: cek panjang password (jangan tampilkan isinya)
      console.log('Stored password hash length:', user.password.length);
      console.log('Input password length:', password.length);
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Password correct');

    // Generate token
    console.log('🔑 Generating JWT token...');
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('✅ Token generated');

    // Response sukses
    console.log('📤 Sending success response');
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login };
