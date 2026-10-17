const authRouter = require('./auth');
const homeRouter = require('./home');
const phimleRouter = require('./phimle');
const phimboRouter = require('./phimbo');
const phimmoiRouter = require('./phimmoi');
const adminRouter = require('./admin');

function route(app) {
    app.use('/admin', adminRouter);
    
    // Đổi tiền tố từ '/auth' thành '/' để nhận trực tiếp /login, /register
    app.use('/', authRouter); 

    app.use('/phim-le', phimleRouter);
    app.use('/phim-bo', phimboRouter);
    app.use('/phim-moi', phimmoiRouter);
    app.use('/', homeRouter);
}

module.exports = route;