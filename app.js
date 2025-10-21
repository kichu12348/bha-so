const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const path = require('path');

// Import database (this will create tables and seed data)
const db = require('./database');

// Import routes
const authRoutes = require('./routes/auth');
const clubRoutes = require('./routes/clubs');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: 'college-club-management-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Global middleware to make user available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/clubs', clubRoutes);

// Homepage redirect
app.get('/', (req, res) => {
  res.redirect('/clubs');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Database initialized with seed data');
  console.log('\nDemo Accounts:');
  console.log('Admin: admin@college.edu / admin123');
  console.log('Student 1: student1@college.edu / student123');
  console.log('Student 2: student2@college.edu / student123');
});
