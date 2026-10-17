
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    // Không bắt buộc vì tài khoản Google không dùng mật khẩu này
    password: {
        type: String,
        default: null
    },

    // 0: Người dùng thường, 1: Quản trị viên
    role: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
