const express = require('express');
const router = express.Router();

const authController = require('../app/controller/AuthController');
const passport = require('passport');

// ==================== ĐĂNG KÝ ====================

// Hiển thị trang đăng ký
router.get('/register', authController.showRegister);

// Xử lý đăng ký
router.post('/register', authController.register);


// ==================== ĐĂNG NHẬP ====================

// Hiển thị trang đăng nhập
router.get('/login', authController.showLogin);

// Xử lý đăng nhập bằng email và mật khẩu
router.post('/login', authController.login);


// ==================== ĐĂNG XUẤT ====================

router.get('/logout', authController.logout);


// ==================== ĐĂNG NHẬP GOOGLE ====================

// Chuyển người dùng sang Google
router.get(
    '/auth/google',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

// Google chuyển hướng trở lại website
router.get(
    '/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login'
    }),
    (req, res, next) => {
        // Lưu thông tin người dùng vào session
        req.session.userId = req.user._id.toString();
        req.session.username = req.user.username;
        req.session.role = req.user.role;
        req.session.isAdmin =
            req.user.isAdmin === true || Number(req.user.role) === 1;

        // Lưu session trước khi chuyển trang
        req.session.save((error) => {
            if (error) {
                return next(error);
            }

            res.redirect('/');
        });
    }
);

module.exports = router;