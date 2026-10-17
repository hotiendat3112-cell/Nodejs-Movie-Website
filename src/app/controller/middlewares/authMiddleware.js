module.exports = {
    // Kiểm tra đã đăng nhập chưa
    isLoggedIn(req, res, next) {
        if (req.session && req.session.user) {
            return next();
        }
        return res.redirect('/login');
    },

    // Kiểm tra có phải là Admin (role === 1) không
    isAdmin(req, res, next) {
        if (req.session && req.session.user && req.session.user.role === 1) {
            return next();
        }
        return res.status(403).send('Truy cập bị từ chối! Bạn không có quyền Admin.');
    }
};
// Đặt đoạn này trong server.js hoặc middleware dùng chung
app.use((req, res, next) => {
    res.locals.session = req.session; // Giúp các file .hbs gọi được {{session.role}}
    next();
});