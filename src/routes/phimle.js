const express = require('express');
const router = express.Router();

const phimleController = require('../app/controller/PhimleController'); // Ensure this path is correct

// Define routes
router.get('/', phimleController.index);
module.exports = router;