const express = require('express');
const router = express.Router();
const phimboController = require('../app/controller/PhimboController');

// Define routes
router.get('/', phimboController.index);
module.exports = router;