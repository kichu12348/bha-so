const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("clubs.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database");
  }
});

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS clubs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        president TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        members_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) {
        console.error("Error creating table:", err.message);
      } else {
        console.log("Clubs table ready");

        db.get("SELECT COUNT(*) as count FROM clubs", (err, row) => {
          if (!err && row.count === 0) {
            const sampleClubs = [
              [
                "Chess Club",
                "Strategic thinking and chess competitions",
                "Sports",
                "John Smith",
                "chess@college.edu",
                25,
              ],
              [
                "Drama Society",
                "Theater productions and acting workshops",
                "Arts",
                "Jane Doe",
                "drama@college.edu",
                18,
              ],
              [
                "Coding Club",
                "Programming competitions and tech workshops",
                "Technology",
                "Alice Johnson",
                "coding@college.edu",
                32,
              ],
            ];

            const stmt = db.prepare(
              "INSERT INTO clubs (name, description, category, president, email, members_count) VALUES (?, ?, ?, ?, ?, ?)"
            );
            sampleClubs.forEach((club) => {
              stmt.run(club);
            });
            stmt.finalize();
            console.log("Sample data inserted");
          }
        });
      }
    }
  );
});

module.exports = db;
