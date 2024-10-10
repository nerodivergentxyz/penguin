const express = require('express');
const cors = require('cors');
const roomRoutes = require('./routes/roomRoutes');
const { handleError } = require('./middleware/errorMiddleware'); // Ensure this middleware is properly defined

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/rooms', roomRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app;
