import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import eventRoutes from './routes/eventRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', eventRoutes);

// Base route for connection verification
app.get('/', (req, res) => {
  res.send('Event Manager Dashboard Backend API is running perfectly!');
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is humming smoothly at http://localhost:${PORT}`);
});
