const { connection, query } = require('./connection');
const bcrypt = require('bcryptjs');

// Create tables and seed data
const initDatabase = async () => {
  // Drop existing tables in reverse order to avoid foreign key constraints
  console.log('Dropping existing tables...');
  try {
    await query('SET FOREIGN_KEY_CHECKS = 0');
    await query('DROP TABLE IF EXISTS events');
    await query('DROP TABLE IF EXISTS memberships');
    await query('DROP TABLE IF EXISTS clubs');
    await query('DROP TABLE IF EXISTS users');
    await query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Tables dropped successfully!');
  } catch (err) {
    console.error('Error dropping tables:', err.message);
  }

  try {
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'student'
      )
    `);

    // Create clubs table
    await query(`
      CREATE TABLE IF NOT EXISTS clubs (
        club_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_by INT,
        FOREIGN KEY (created_by) REFERENCES users(user_id)
      )
    `);

    // Create memberships table
    await query(`
      CREATE TABLE IF NOT EXISTS memberships (
        membership_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        club_id INT,
        role VARCHAR(50) NOT NULL DEFAULT 'member',
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (club_id) REFERENCES clubs(club_id) ON DELETE CASCADE,
        UNIQUE(user_id, club_id)
      )
    `);

    // Create events table
    await query(`
      CREATE TABLE IF NOT EXISTS events (
        event_id INT AUTO_INCREMENT PRIMARY KEY,
        club_id INT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date DATE NOT NULL,
        FOREIGN KEY (club_id) REFERENCES clubs(club_id) ON DELETE CASCADE
      )
    `);

    console.log('Tables created successfully!');
    
    // Seed data
    console.log('Seeding database with initial data...');
    
    // Hash passwords
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const studentPassword = bcrypt.hashSync('student123', 10);

    // Insert admin user
    const [adminResult] = await query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Admin User', 'admin@college.edu', adminPassword, 'admin']
    );
    const adminId = adminResult.insertId;

    // Insert student users
    const [student1Result] = await query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Student One', 'student1@college.edu', studentPassword, 'student']
    );
    const student1Id = student1Result.insertId;

    const [student2Result] = await query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Student Two', 'student2@college.edu', studentPassword, 'student']
    );
    const student2Id = student2Result.insertId;

    // Insert clubs
    const [codingClubResult] = await query(
      'INSERT INTO clubs (name, description, created_by) VALUES (?, ?, ?)',
      ['Coding Club', 'A club for coding enthusiasts and programmers', adminId]
    );
    const codingClubId = codingClubResult.insertId;

    const [dramaClubResult] = await query(
      'INSERT INTO clubs (name, description, created_by) VALUES (?, ?, ?)',
      ['Drama Society', 'Express yourself through drama and theater', adminId]
    );
    const dramaClubId = dramaClubResult.insertId;

    // Insert memberships
    // Student1 as coordinator of Coding Club
    await query(
      'INSERT INTO memberships (user_id, club_id, role) VALUES (?, ?, ?)',
      [student1Id, codingClubId, 'coordinator']
    );

    // Student2 as member of Coding Club
    await query(
      'INSERT INTO memberships (user_id, club_id, role) VALUES (?, ?, ?)',
      [student2Id, codingClubId, 'member']
    );

    // Student2 as member of Drama Society
    await query(
      'INSERT INTO memberships (user_id, club_id, role) VALUES (?, ?, ?)',
      [student2Id, dramaClubId, 'member']
    );

    // Insert event for Coding Club
    await query(
      'INSERT INTO events (club_id, title, description, event_date) VALUES (?, ?, ?, ?)',
      [
        codingClubId,
        'Hackathon 2025',
        '24-hour coding competition with prizes',
        '2025-11-15'
      ]
    );

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Error during database initialization:', err.message);
  }
};

// Run the initialization
initDatabase();

// Create a database interface that mimics the SQLite interface for backward compatibility
const db = {
  query: async (sql, params = []) => {
    try {
      const [rows] = await query(sql, params);
      return rows;
    } catch (err) {
      console.error('Database query error:', err.message);
      throw err;
    }
  },
  all: async (sql, params = []) => {
    try {
      const [rows] = await query(sql, params);
      return rows;
    } catch (err) {
      console.error('Database all error:', err.message);
      throw err;
    }
  },
  get: async (sql, params = []) => {
    try {
      const [rows] = await query(sql, params);
      return rows[0];
    } catch (err) {
      console.error('Database get error:', err.message);
      throw err;
    }
  },
  run: async (sql, params = [], callback) => {
    try {
      const [result] = await query(sql, params);
      if (typeof callback === 'function') {
        callback.call({ lastID: result.insertId, changes: result.affectedRows });
      }
      return result;
    } catch (err) {
      console.error('Database run error:', err.message);
      if (typeof callback === 'function') {
        callback(err);
      }
      throw err;
    }
  }
};

module.exports = db;