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
const User = require('./app/models/User');// Sửa đường dẫn này trùng với tên file Model User của bạn (vd: userModel.js hoặc User.js)

// 1. Config morgan log
app.use(morgan('combined'));

// 2. Middleware đọc dữ liệu từ Form / JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 3. Static files & Method Override
app.use(express.static(path.join(__dirname, 'resources')));
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
  secret: 'tu-khoa-bi-mat-cua-ban',
  resave: false,
  saveUninitialized: true,
}));

// 6. Cấu hình Passport Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'DUMMY_ID',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'DUMMY_SECRET',
    callbackURL: "http://localhost:8080/auth/google/callback"
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

// 7. Middleware truyền Session sang Views (BẮT BUỘC ĐẶT TRƯỚC ROUTES)
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// 8. Gọi Routes chính
routes(app);

// 9. Connect Database & Start Server
const client = new MongoClient(process.env.MONGODB_URI);

async function startServer() {
  try {
    await client.connect();
    await mongoose.connect(process.env.MONGODB_URI);

    const db = client.db('netflex');
    app.locals.db = db;

    console.log('MongoDB and Mongoose connected successfully!');
    app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
  }
}

startServer();