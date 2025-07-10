import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'NexusVerse Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Basic auth endpoints
app.post('/api/auth/register', (req, res) => {
  res.json({ 
    message: 'Registration endpoint ready',
    status: 'success'
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({ 
    message: 'Login endpoint ready',
    status: 'success'
  });
});

// User endpoints
app.get('/api/users/profile', (req, res) => {
  res.json({ 
    message: 'User profile endpoint ready',
    status: 'success'
  });
});

// Communities endpoints
app.get('/api/communities', (req, res) => {
  res.json({ 
    message: 'Communities endpoint ready',
    status: 'success',
    data: []
  });
});

// Events endpoints
app.get('/api/events', (req, res) => {
  res.json({ 
    message: 'Events endpoint ready',
    status: 'success',
    data: []
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NexusVerse Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
}); 