const db = require('./connection');
const bcrypt = require('bcryptjs');


// Create tables and seed data
db.serialize(() => {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student'
    )
  `);

  // Create clubs table
  db.run(`
    CREATE TABLE IF NOT EXISTS clubs (
      club_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_by INTEGER,
      FOREIGN KEY (created_by) REFERENCES users(user_id)
    )
  `);

  // Create memberships table
  db.run(`
    CREATE TABLE IF NOT EXISTS memberships (
      membership_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      club_id INTEGER,
      role TEXT NOT NULL DEFAULT 'member',
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (club_id) REFERENCES clubs(club_id) ON DELETE CASCADE,
      UNIQUE(user_id, club_id)
    )
  `);

  // Create events table
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      event_id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      event_date DATE NOT NULL,
      FOREIGN KEY (club_id) REFERENCES clubs(club_id) ON DELETE CASCADE
    )
  `);

  // Check if data already exists
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) {
      console.error('Error checking users:', err.message);
      return;
    }

    // Only seed data if database is empty
    if (row.count === 0) {
      console.log('Seeding database with initial data...');

      // Hash passwords
      const adminPassword = bcrypt.hashSync('admin123', 10);
      const studentPassword = bcrypt.hashSync('student123', 10);

      // Insert admin user
      db.run(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin User', 'admin@college.edu', adminPassword, 'admin'],
        function(err) {
          if (err) {
            console.error('Error inserting admin:', err.message);
            return;
          }
          const adminId = this.lastID;

          // Insert student users
          db.run(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Student One', 'student1@college.edu', studentPassword, 'student'],
            function(err) {
              if (err) {
                console.error('Error inserting student1:', err.message);
                return;
              }
              const student1Id = this.lastID;

              db.run(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['Student Two', 'student2@college.edu', studentPassword, 'student'],
                function(err) {
                  if (err) {
                    console.error('Error inserting student2:', err.message);
                    return;
                  }
                  const student2Id = this.lastID;

                  // Insert clubs
                  db.run(
                    'INSERT INTO clubs (name, description, created_by) VALUES (?, ?, ?)',
                    ['Coding Club', 'A club for coding enthusiasts and programmers', adminId],
                    function(err) {
                      if (err) {
                        console.error('Error inserting Coding Club:', err.message);
                        return;
                      }
                      const codingClubId = this.lastID;

                      db.run(
                        'INSERT INTO clubs (name, description, created_by) VALUES (?, ?, ?)',
                        ['Drama Society', 'Express yourself through drama and theater', adminId],
                        function(err) {
                          if (err) {
                            console.error('Error inserting Drama Society:', err.message);
                            return;
                          }
                          const dramaClubId = this.lastID;

                          // Insert memberships
                          // Student1 as coordinator of Coding Club
                          db.run(
                            'INSERT INTO memberships (user_id, club_id, role) VALUES (?, ?, ?)',
                            [student1Id, codingClubId, 'coordinator']
                          );

                          // Student2 as member of Coding Club
                          db.run(
                            'INSERT INTO memberships (user_id, club_id, role) VALUES (?, ?, ?)',
                            [student2Id, codingClubId, 'member']
                          );

                          // Student2 as member of Drama Society
                          db.run(
                            'INSERT INTO memberships (user_id, club_id, role) VALUES (?, ?, ?)',
                            [student2Id, dramaClubId, 'member']
                          );

                          // Insert event for Coding Club
                          db.run(
                            'INSERT INTO events (club_id, title, description, event_date) VALUES (?, ?, ?, ?)',
                            [
                              codingClubId,
                              'Hackathon 2025',
                              '24-hour coding competition with prizes',
                              '2025-11-15'
                            ],
                            (err) => {
                              if (err) {
                                console.error('Error inserting event:', err.message);
                              } else {
                                console.log('Database seeded successfully!');
                              }
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    } else {
      console.log('Database already contains data. Skipping seed.');
    }
  });
});

module.exports = db;
