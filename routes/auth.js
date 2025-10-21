const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');

// GET /register - Show registration form
router.get('/register', (req, res) => {
  res.render('auth/register');
});

// POST /register - Handle registration
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  // Hash password
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Insert new user
  db.run(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, hashedPassword, 'student'],
    function(err) {
      if (err) {
        console.error('Error creating user:', err.message);
        return res.redirect('/register');
      }

      // Get the newly created user
      db.get('SELECT * FROM users WHERE user_id = ?', [this.lastID], (err, user) => {
        if (err) {
          console.error('Error fetching user:', err.message);
          return res.redirect('/login');
        }

        // Save user to session
        req.session.user = user;
        res.redirect('/clubs');
      });
    }
  );
});

// GET /login - Show login form
router.get('/login', (req, res) => {
  res.render('auth/login');
});

// POST /login - Handle login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      console.error('Error finding user:', err.message);
      return res.redirect('/login');
    }

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
  });
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
