const User = require('../models/User');
const bcrypt = require('bcrypt');

class AuthController {
    // Hiển thị form đăng ký
    showRegister(req, res) {
        res.render('auth/register');
    }

    // Xử lý đăng ký tài khoản mới
    async register(req, res) {
        try {
            const { username, email, password } = req.body;

            // Kiểm tra thông tin nhập vào
            if (!username || !email || !password) {
                return res.render('auth/register', {
                    error: 'Vui lòng nhập đầy đủ thông tin!'
                });
            }

            // Kiểm tra email đã tồn tại
            const existingUser = await User.findOne({ email });

            if (existingUser) {
                return res.render('auth/register', {
                    error: 'Email này đã được sử dụng!'
                });
            }

            // Mã hóa mật khẩu
            const hashedPassword = await bcrypt.hash(password, 10);

            // Tạo tài khoản mới
            const newUser = new User({
                username,
                email,
                password: hashedPassword,
                role: 0,
                isAdmin: false
            });

            await newUser.save();

            // Đăng ký xong chuyển sang trang đăng nhập
            return res.redirect('/login');

        } catch (error) {
            console.error('Lỗi đăng ký:', error);

            return res.render('auth/register', {
                error: 'Có lỗi xảy ra khi đăng ký tài khoản!'
            });
        }
    }

    // Hiển thị form đăng nhập
    showLogin(req, res) {
        res.render('auth/login');
    }

    // Xử lý đăng nhập
    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.render('auth/login', {
                    error: 'Vui lòng nhập email và mật khẩu!'
                });
            }

            // Tìm tài khoản trong MongoDB
            const user = await User.findOne({ email });

            if (!user) {
                return res.render('auth/login', {
                    error: 'Email không tồn tại!'
                });
            }

            // Kiểm tra mật khẩu
            const isPasswordValid = await bcrypt.compare(
                password,
                user.password
            );

            if (!isPasswordValid) {
                return res.render('auth/login', {
                    error: 'Mật khẩu không chính xác!'
                });
            }

            // Lưu thông tin đăng nhập vào session
            req.session.userId = user._id.toString();
            req.session.username = user.username;
            req.session.role = user.role;
            req.session.isAdmin =
                user.isAdmin === true || Number(user.role) === 1;

            // Lưu session xong mới chuyển trang
            req.session.save((error) => {
                if (error) {
                    console.error('Lỗi lưu session:', error);

                    return res.status(500).send(
                        'Không thể lưu phiên đăng nhập. Vui lòng thử lại.'
                    );
                }

                return res.redirect('/');
            });

        } catch (error) {
            console.error('Lỗi đăng nhập:', error);

            return res.render('auth/login', {
                error: 'Có lỗi xảy ra khi đăng nhập!'
            });
        }
    }

    // Xử lý đăng xuất
    logout(req, res, next) {
        req.session.destroy((error) => {
            if (error) {
                return next(error);
            }

            // Xóa cookie session trên trình duyệt
            res.clearCookie('connect.sid');

            return res.redirect('/');
        });
    }
}

module.exports = new AuthController();