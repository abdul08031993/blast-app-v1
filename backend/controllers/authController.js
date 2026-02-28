const User = require('../models/User');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  console.log('\n========== REGISTER FUNCTION CALLED ==========');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request headers:', req.headers['content-type']);
  
  try {
    const { username, password, name, email } = req.body;

    // Validasi input
    if (!username || !password) {
      console.log('❌ Missing username or password');
      return res.status(400).json({ error: 'Username and password required' });
    }

    console.log('✅ Input valid, username:', username);

    // Cek user exist
    console.log('🔍 Checking if user exists...');
    const existingUser = await User.findOne({ username });
    
    if (existingUser) {
      console.log('❌ User already exists:', username);
      return res.status(400).json({ error: 'Username already exists' });
    }
    console.log('✅ Username available');

    // Buat user baru
    console.log('🆕 Creating new user object...');
    const user = new User({
      username,
      password, // Akan di-hash oleh pre-save hook
      name: name || username,
      email: email || '',
      role: 'user'
    });

    console.log('💾 Saving user to database...');
    const savedUser = await user.save();
    console.log('✅ User saved with ID:', savedUser._id);

    // Generate token
    console.log('🔑 Generating JWT token...');
    const token = jwt.sign(
      { userId: savedUser._id, role: savedUser.role },
      process.env.JWT_SECRET || 'fallback_secret_for_testing',
      { expiresIn: '7d' }
    );
    console.log('✅ Token generated');

    // Kirim response
    console.log('📤 Sending success response...');
    return res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: savedUser._id,
        username: savedUser.username,
        role: savedUser.role,
        name: savedUser.name
      }
    });

  } catch (error) {
    console.error('\n❌❌❌ ERROR IN REGISTER ❌❌❌');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Handle validation error
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

const login = async (req, res) => {
  console.log('\n========== LOGIN FUNCTION CALLED ==========');
  
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret_for_testing',
      { expiresIn: '7d' }
    );

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
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { register, login };