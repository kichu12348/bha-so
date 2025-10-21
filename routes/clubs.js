const express = require('express');
const router = express.Router();
const db = require('../database');
const { isAuthenticated, isAdmin } = require('../middleware');

// GET /clubs - Show all clubs
router.get('/', async (req, res) => {
  try {
    const clubs = await db.all('SELECT * FROM clubs');
    res.render('clubs/index', { clubs });
  } catch (err) {
    console.error('Error fetching clubs:', err.message);
    return res.status(500).send('Error fetching clubs');
  }
});

// GET /clubs/new - Show create club form (Admin only) - MUST BE BEFORE /:id
router.get('/new', isAdmin, (req, res) => {
  res.render('clubs/new');
});

// POST /clubs - Create new club (Admin only)
router.post('/', isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const created_by = req.session.user.user_id;

    await db.run(
      'INSERT INTO clubs (name, description, created_by) VALUES (?, ?, ?)',
      [name, description, created_by]
    );
    res.redirect('/clubs');
  } catch (err) {
    console.error('Error creating club:', err.message);
    return res.redirect('/clubs/new');
  }
});

// GET /clubs/:id/edit - Show edit club form (Admin only) - MUST BE BEFORE /:id
router.get('/:id/edit', isAdmin, async (req, res) => {
  try {
    const clubId = req.params.id;
    const club = await db.get('SELECT * FROM clubs WHERE club_id = ?', [clubId]);
    
    if (!club) {
      return res.redirect('/clubs');
    }
    
    res.render('clubs/edit', { club });
  } catch (err) {
    console.error('Error fetching club:', err.message);
    return res.redirect('/clubs');
  }
});

// GET /clubs/:id/events/new - Show create event form - MUST BE BEFORE /:id
router.get('/:id/events/new', isAuthenticated, async (req, res) => {
  try {
    const clubId = req.params.id;
    const userId = req.session.user.user_id;

    // Check if user is a coordinator of this club
    const membership = await db.get(
      'SELECT * FROM memberships WHERE user_id = ? AND club_id = ? AND role = ?',
      [userId, clubId, 'coordinator']
    );

    if (!membership) {
      return res.redirect(`/clubs/${clubId}`);
    }

    // Get club details for the form
    const club = await db.get('SELECT * FROM clubs WHERE club_id = ?', [clubId]);
    
    if (!club) {
      return res.redirect('/clubs');
    }
    
    res.render('events/new', { club });
  } catch (err) {
    console.error('Error in events/new route:', err.message);
    return res.redirect(`/clubs/${req.params.id}`);
  }
});

// GET /clubs/:id - Show club details
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const clubId = req.params.id;
    const userId = req.session.user.user_id;

    // Get club details
    const club = await db.get('SELECT * FROM clubs WHERE club_id = ?', [clubId]);
    
    if (!club) {
      return res.redirect('/clubs');
    }

    // Get all members with their roles
    let members = [];
    try {
      members = await db.all(
        `SELECT u.user_id, u.name, u.email, m.role 
         FROM memberships m 
         JOIN users u ON m.user_id = u.user_id 
         WHERE m.club_id = ?`,
        [clubId]
      );
    } catch (err) {
      console.error('Error fetching members:', err.message);
    }

    // Get all events for this club
    let events = [];
    try {
      events = await db.all(
        'SELECT * FROM events WHERE club_id = ? ORDER BY event_date',
        [clubId]
      );
    } catch (err) {
      console.error('Error fetching events:', err.message);
    }

    // Check current user's membership status
    let membership = null;
    try {
      membership = await db.get(
        'SELECT * FROM memberships WHERE user_id = ? AND club_id = ?',
        [userId, clubId]
      );
    } catch (err) {
      console.error('Error checking membership:', err.message);
    }

    res.render('clubs/show', {
      club,
      members,
      events,
      userMembership: membership
    });
  } catch (err) {
    console.error('Error in club details route:', err.message);
    return res.redirect('/clubs');
  }
});

// POST /clubs/:id/join - Join a club
router.post('/:id/join', isAuthenticated, async (req, res) => {
  try {
    const clubId = req.params.id;
    const userId = req.session.user.user_id;

    await db.run(
      'INSERT INTO memberships (user_id, club_id, role) VALUES (?, ?, ?)',
      [userId, clubId, 'member']
    );
    res.redirect(`/clubs/${clubId}`);
  } catch (err) {
    console.error('Error joining club:', err.message);
    res.redirect(`/clubs/${req.params.id}`);
  }
});

// POST /clubs/:id/events - Create new event - MUST BE BEFORE /:id DELETE
router.post('/:id/events', isAuthenticated, async (req, res) => {
  try {
    const clubId = req.params.id;
    const userId = req.session.user.user_id;
    const { title, description, event_date } = req.body;

    // Check if user is a coordinator of this club
    const membership = await db.get(
      'SELECT * FROM memberships WHERE user_id = ? AND club_id = ? AND role = ?',
      [userId, clubId, 'coordinator']
    );

    if (!membership) {
      return res.redirect(`/clubs/${clubId}`);
    }

    // Create the event
    await db.run(
      'INSERT INTO events (club_id, title, description, event_date) VALUES (?, ?, ?, ?)',
      [clubId, title, description, event_date]
    );
    
    res.redirect(`/clubs/${clubId}`);
  } catch (err) {
    console.error('Error creating event:', err.message);
    res.redirect(`/clubs/${req.params.id}`);
  }
});

// DELETE /clubs/:id/leave - Leave a club
router.delete('/:id/leave', isAuthenticated, async (req, res) => {
  try {
    const clubId = req.params.id;
    const userId = req.session.user.user_id;

    await db.run(
      'DELETE FROM memberships WHERE user_id = ? AND club_id = ?',
      [userId, clubId]
    );
    
    res.redirect(`/clubs/${clubId}`);
  } catch (err) {
    console.error('Error leaving club:', err.message);
    res.redirect(`/clubs/${req.params.id}`);
  }
});

// PUT /clubs/:id - Update club (Admin only)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const clubId = req.params.id;
    const { name, description } = req.body;

    await db.run(
      'UPDATE clubs SET name = ?, description = ? WHERE club_id = ?',
      [name, description, clubId]
    );
    
    res.redirect(`/clubs/${clubId}`);
  } catch (err) {
    console.error('Error updating club:', err.message);
    return res.redirect(`/clubs/${req.params.id}/edit`);
  }
});

// DELETE /clubs/:id - Delete a club (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const clubId = req.params.id;

    await db.run('DELETE FROM clubs WHERE club_id = ?', [clubId]);
    
    res.redirect('/clubs');
  } catch (err) {
    console.error('Error deleting club:', err.message);
    res.redirect('/clubs');
  }
});

module.exports = router;
