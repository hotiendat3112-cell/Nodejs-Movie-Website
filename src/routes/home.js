const express = require('express');
const router = express.Router();

const homeController = require('../app/controller/HomeController'); // Ensure this path is correct// Ensure this path is correct

// Define routes
router.get('/', homeController.index,homeController.banner);
router.get('/phim/:slug', homeController.slug);
router.get('/phim/:slug/:name', homeController.tap);
router.get('/search', homeController.search);
router.get('/the-loai/:slug', homeController.theloai);
// router.get('/', homeController.slug);
module.exports = router;