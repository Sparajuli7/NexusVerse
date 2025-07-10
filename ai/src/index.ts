import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'NexusVerse AI Service is running!',
    timestamp: new Date().toISOString()
  });
});

// NLP endpoints
app.post('/api/nlp/sentiment', (req, res) => {
  res.json({ 
    message: 'Sentiment analysis endpoint ready',
    status: 'success',
    sentiment: 'positive',
    score: 0.8
  });
});

app.post('/api/nlp/topics', (req, res) => {
  res.json({ 
    message: 'Topic extraction endpoint ready',
    status: 'success',
    topics: ['technology', 'networking', 'community']
  });
});

app.post('/api/nlp/moderate', (req, res) => {
  res.json({ 
    message: 'Content moderation endpoint ready',
    status: 'success',
    isAppropriate: true
  });
});

app.post('/api/nlp/translate', (req, res) => {
  res.json({ 
    message: 'Translation endpoint ready',
    status: 'success',
    translatedText: 'Hello World'
  });
});

app.post('/api/nlp/entities', (req, res) => {
  res.json({ 
    message: 'Entity extraction endpoint ready',
    status: 'success',
    entities: ['John Doe', 'NexusVerse', 'Technology']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 NexusVerse AI Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
}); 