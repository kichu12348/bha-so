const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');

// GET /register - Show registration form
router.get('/register', (req, res) => {
  res.render('auth/register');
});

// POST /register - Handle registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insert new user
    const result = await db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'student']
    );

    // Get the newly created user
    const user = await db.get('SELECT * FROM users WHERE user_id = ?', [result.insertId]);

    // Save user to session
    req.session.user = user;
    res.redirect('/clubs');
  } catch (err) {
    console.error('Error in registration:', err.message);
    return res.redirect('/register');
  }
});

// GET /login - Show login form
router.get('/login', (req, res) => {
  res.render('auth/login');
});

// POST /login - Handle login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.redirect('/login');
    }

    // Compare password
    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.redirect('/login');
    }

    // Save user to session
    req.session.user = user;
    res.redirect('/clubs');
  } catch (err) {
    console.error('Error in login:', err.message);
    return res.redirect('/login');
  }
});

// POST /logout - Handle logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err.message);
    }
    res.redirect('/login');
  });
});

module.exports = router;
