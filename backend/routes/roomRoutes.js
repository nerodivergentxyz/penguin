const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

// Create Room Route
router.post('/create', roomController.createRoom);

// Optional: Get Room Info
router.get('/:roomId', roomController.getRoomInfo);

module.exports = router;
