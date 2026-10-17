const express = require('express');
const router = express.Router();

const phimmoiController = require("../app/controller/PhimmoiController")// Ensure this path is correct

// Define routes
router.get('/', phimmoiController.index);
module.exports = router;