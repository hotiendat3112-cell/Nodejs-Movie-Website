
const express = require('express');
const router = express.Router();

const adminController = require('../app/controller/AdminController');

// Middleware kiểm tra quyền Admin
const checkAdmin = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }

    const isAdmin =
        Number(req.session.role) === 1 ||
        req.session.isAdmin === true;

    if (!isAdmin) {
        return res.status(403).send(
            '<h1>403 - Bạn không có quyền truy cập trang Quản trị!</h1>' +
            '<a href="/">Quay lại trang chủ</a>'
        );
    }

    next();
};

// Bảo vệ tất cả đường dẫn /admin
router.use(checkAdmin);

// Trang quản trị
router.get('/', adminController.index);

// Thêm phim
router.get('/movies/create', adminController.createMovie);
router.post('/movies/store', adminController.storeMovie);

// Sửa phim
router.get('/movies/:id/edit', adminController.editMovie);
router.post('/movies/:id/update', adminController.updateMovie);

// Xóa phim
router.post('/movies/:id/delete', adminController.deleteMovie);

// Thêm tập phim
router.post('/movies/:id/add-episode', adminController.addEpisode);

// Hiển thị form thêm tập
router.get('/movies/:id/add-episode', adminController.renderAddEpisode);

// Xử lý POST lưu tập
router.post('/movies/:id/add-episode', adminController.addEpisode);
module.exports = router;
