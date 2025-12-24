const checkAdminRole = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    if (req.user.role !== 'admin') {
        console.warn(`Access denied for user ID: ${req.user.id}, Role: ${req.user.role}`);
        return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    
    next();
};

export default checkAdminRole;