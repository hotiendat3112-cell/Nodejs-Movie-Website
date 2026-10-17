require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const path = require('path');
const handlebars = require('express-handlebars');
const methodOverride = require('method-override');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const port = process.env.PORT || 8080;
const routes = require('./routes');
const User = require('./app/models/User');

// 1. Config morgan log
app.use(morgan('combined'));

// 2. Middleware đọc dữ liệu từ Form / JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 3. Static files & Method Override
app.use(express.static(path.join(__dirname, 'resources')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// 4. Template Engine (Handlebars)
app.engine('hbs', handlebars.engine({
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'resources/views/layouts'),
  partialsDir: path.join(__dirname, 'resources/views/partials'),
  defaultLayout: 'main',
  helpers: {
    gt: (a, b) => a > b,
    lt: (a, b) => a < b,
    add: (a, b) => a + b,
    sub: (a, b) => a - b,
    eq: (a, b) => a == b,
    sum: (a, b) => a + b,
  }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'resources/views'));

// 5. Cấu hình Session (BẮT BUỘC ĐẶT TRƯỚC PASSPORT VÀ ROUTES)
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu-khoa-bi-mat-cua-ban',
  resave: false,
  saveUninitialized: true,
}));

// 6. Cấu hình Passport Google OAuth (Tự động thích ứng Local / Render)
const callbackURL = process.env.RENDER_EXTERNAL_URL 
  ? `${process.env.RENDER_EXTERNAL_URL}/auth/google/callback`
  : `http://localhost:${port}/auth/google/callback`;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'DUMMY_ID',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'DUMMY_SECRET',
    callbackURL: callbackURL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (!user) {
        user = new User({
          username: profile.displayName,
          email: profile.emails[0].value,
          role: 0, // Mặc định là user thường
        });
        await user.save();
      }
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use(passport.initialize());
app.use(passport.session());

// 7. Middleware truyền Session sang Views
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// 8. Gọi Routes chính
routes(app);

// 9. Connect Database & Start Server
async function startServer() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('Biến MONGODB_URI chưa được thiết lập!');
    }

    // Kết nối Mongoose
    await mongoose.connect(mongoUri);

    // Kết nối MongoDB Native Client nếu ứng dụng dùng app.locals.db
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db('netflex');
    app.locals.db = db;

    console.log('MongoDB and Mongoose connected successfully!');
    
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1); // Thoát ứng dụng có báo lỗi nếu kết nối DB thất bại
  }
}

startServer();