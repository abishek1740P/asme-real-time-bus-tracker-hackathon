module.exports = function (allowedRoles) {
  return (req, res, next) => {

    if (Array.isArray(allowedRoles)) {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
    } else {
      if (req.user.role !== allowedRoles) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    next();
  };
};
