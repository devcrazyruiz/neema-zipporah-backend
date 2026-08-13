/**
 * Restrict a route to one or more roles.
 * Usage: router.get("/", verifyToken, checkRole("admin"), handler)
 *        router.get("/", verifyToken, checkRole("admin", "accountant"), handler)
 */
function checkRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      return next(new Error("Not authorized. Please log in."));
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403);
      return next(
        new Error(`Access denied. This action requires one of these roles: ${allowedRoles.join(", ")}`)
      );
    }

    next();
  };
}

module.exports = checkRole;
