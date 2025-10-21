// Authentication middleware
function isAuthenticated(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// Admin authorization middleware
function isAdmin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  if (req.session.user.role !== 'admin') {
    return res.redirect('/clubs');
  }
  next();
}

module.exports = {
  isAuthenticated,
  isAdmin
};
