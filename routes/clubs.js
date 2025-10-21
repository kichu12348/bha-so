const express = require('express');
const router = express.Router();
const db = require('../database');
const { isAuthenticated, isAdmin } = require('../middleware');

// GET /clubs - Show all clubs
router.get('/', (req, res) => {
  db.all('SELECT * FROM clubs', (err, clubs) => {
    if (err) {
      console.error('Error fetching clubs:', err.message);
      return res.status(500).send('Error fetching clubs');
    }
    res.render('clubs/index', { clubs });
  });
});

// GET /clubs/new - Show create club form (Admin only) - MUST BE BEFORE /:id
router.get('/new', isAdmin, (req, res) => {
  res.render('clubs/new');
});

// POST /clubs - Create new club (Admin only)
router.post('/', isAdmin, (req, res) => {
  const { name, description } = req.body;
  const created_by = req.session.user.user_id;

  db.run(
    'INSERT INTO clubs (name, description, created_by) VALUES (?, ?, ?)',
    [name, description, created_by],
    function(err) {
      if (err) {
        console.error('Error creating club:', err.message);
        return res.redirect('/clubs/new');
      }
      res.redirect('/clubs');
    }
  );
});

// GET /clubs/:id/edit - Show edit club form (Admin only) - MUST BE BEFORE /:id
router.get('/:id/edit', isAdmin, (req, res) => {
  const clubId = req.params.id;

  db.get('SELECT * FROM clubs WHERE club_id = ?', [clubId], (err, club) => {
    if (err || !club) {
      console.error('Error fetching club:', err?.message);
      return res.redirect('/clubs');
    }
    res.render('clubs/edit', { club });
  });
});

// GET /clubs/:id/events/new - Show create event form - MUST BE BEFORE /:id
router.get('/:id/events/new', isAuthenticated, (req, res) => {
  const clubId = req.params.id;
  const userId = req.session.user.user_id;

  // Check if user is a coordinator of this club
  db.get(
    'SELECT * FROM memberships WHERE user_id = ? AND club_id = ? AND role = ?',
    [userId, clubId, 'coordinator'],
    (err, membership) => {
      if (err || !membership) {
        return res.redirect(`/clubs/${clubId}`);
      }

      // Get club details for the form
      db.get('SELECT * FROM clubs WHERE club_id = ?', [clubId], (err, club) => {
        if (err || !club) {
          return res.redirect('/clubs');
        }
        res.render('events/new', { club });
      });
    }
  );
});

// GET /clubs/:id - Show club details
router.get('/:id', isAuthenticated, (req, res) => {
  const clubId = req.params.id;
  const userId = req.session.user.user_id;

  // Get club details
  db.get('SELECT * FROM clubs WHERE club_id = ?', [clubId], (err, club) => {
    if (err || !club) {
      console.error('Error fetching club:', err?.message);
      return res.redirect('/clubs');
    }

    // Get all members with their roles
    db.all(
      `SELECT u.user_id, u.name, u.email, m.role 
       FROM memberships m 
       JOIN users u ON m.user_id = u.user_id 
       WHERE m.club_id = ?`,
      [clubId],
      (err, members) => {
        if (err) {
          console.error('Error fetching members:', err.message);
          members = [];
        }

        // Get all events for this club
        db.all(
          'SELECT * FROM events WHERE club_id = ? ORDER BY event_date',
          [clubId],
          (err, events) => {
            if (err) {
              console.error('Error fetching events:', err.message);
              events = [];
            }

            // Check current user's membership status
            db.get(
              'SELECT * FROM memberships WHERE user_id = ? AND club_id = ?',
              [userId, clubId],
              (err, membership) => {
                if (err) {
                  console.error('Error checking membership:', err.message);
                }

                res.render('clubs/show', {
                  club,
                  members,
                  events,
                  userMembership: membership || null
                });
              }
            );
          }
        );
      }
    );
  });
});

// POST /clubs/:id/join - Join a club
router.post('/:id/join', isAuthenticated, (req, res) => {
  const clubId = req.params.id;
  const userId = req.session.user.user_id;

  db.run(
    'INSERT INTO memberships (user_id, club_id, role) VALUES (?, ?, ?)',
    [userId, clubId, 'member'],
    (err) => {
      if (err) {
        console.error('Error joining club:', err.message);
      }
      res.redirect(`/clubs/${clubId}`);
    }
  );
});

// POST /clubs/:id/events - Create new event - MUST BE BEFORE /:id DELETE
router.post('/:id/events', isAuthenticated, (req, res) => {
  const clubId = req.params.id;
  const userId = req.session.user.user_id;
  const { title, description, event_date } = req.body;

  // Check if user is a coordinator of this club
  db.get(
    'SELECT * FROM memberships WHERE user_id = ? AND club_id = ? AND role = ?',
    [userId, clubId, 'coordinator'],
    (err, membership) => {
      if (err || !membership) {
        return res.redirect(`/clubs/${clubId}`);
      }

      // Create the event
      db.run(
        'INSERT INTO events (club_id, title, description, event_date) VALUES (?, ?, ?, ?)',
        [clubId, title, description, event_date],
        (err) => {
          if (err) {
            console.error('Error creating event:', err.message);
          }
          res.redirect(`/clubs/${clubId}`);
        }
      );
    }
  );
});

// DELETE /clubs/:id/leave - Leave a club
router.delete('/:id/leave', isAuthenticated, (req, res) => {
  const clubId = req.params.id;
  const userId = req.session.user.user_id;

  db.run(
    'DELETE FROM memberships WHERE user_id = ? AND club_id = ?',
    [userId, clubId],
    (err) => {
      if (err) {
        console.error('Error leaving club:', err.message);
      }
      res.redirect(`/clubs/${clubId}`);
    }
  );
});

// PUT /clubs/:id - Update club (Admin only)
router.put('/:id', isAdmin, (req, res) => {
  const clubId = req.params.id;
  const { name, description } = req.body;

  db.run(
    'UPDATE clubs SET name = ?, description = ? WHERE club_id = ?',
    [name, description, clubId],
    (err) => {
      if (err) {
        console.error('Error updating club:', err.message);
        return res.redirect(`/clubs/${clubId}/edit`);
      }
      res.redirect(`/clubs/${clubId}`);
    }
  );
});

// DELETE /clubs/:id - Delete a club (Admin only)
router.delete('/:id', isAdmin, (req, res) => {
  const clubId = req.params.id;

  db.run('DELETE FROM clubs WHERE club_id = ?', [clubId], (err) => {
    if (err) {
      console.error('Error deleting club:', err.message);
    }
    res.redirect('/clubs');
  });
});

module.exports = router;
