import express from 'express';
import { body, validationResult } from 'express-validator';

import { logger } from '@/utils/logger';

const router = express.Router();

// Validation middleware
const validateTextAnalysis = [
  body('text').isString().isLength({ min: 1, max: 10000 }),
  body('type').isIn(['sentiment', 'topics', 'keywords', 'summary']),
];

const validateContentModeration = [
  body('content').isString().isLength({ min: 1, max: 10000 }),
  body('contentType').isIn(['post', 'comment', 'profile', 'event']),
];

// @route   POST /api/nlp/analyze
// @desc    Analyze text for sentiment, topics, keywords, or summary
// @access  Private
router.post('/analyze', validateTextAnalysis, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text, type } = req.body;

    let result: any = {};

    switch (type) {
      case 'sentiment':
        result = await analyzeSentiment(text);
        break;
      case 'topics':
        result = await extractTopics(text);
        break;
      case 'keywords':
        result = await extractKeywords(text);
        break;
      case 'summary':
        result = await generateSummary(text);
        break;
      default:
        return res.status(400).json({ message: 'Invalid analysis type' });
    }

    res.json({
      success: true,
      type,
      result,
    });
  } catch (error) {
    logger.error('Text analysis error:', error);
    res.status(500).json({ message: 'Analysis failed' });
  }
});

// @route   POST /api/nlp/moderate
// @desc    Moderate content for inappropriate content
// @access  Private
router.post('/moderate', validateContentModeration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, contentType } = req.body;

    const moderationResult = await moderateContent(content, contentType);

    res.json({
      success: true,
      isAppropriate: moderationResult.isAppropriate,
      confidence: moderationResult.confidence,
      flags: moderationResult.flags,
      suggestions: moderationResult.suggestions,
    });
  } catch (error) {
    logger.error('Content moderation error:', error);
    res.status(500).json({ message: 'Moderation failed' });
  }
});

// @route   POST /api/nlp/translate
// @desc    Translate text to different language
// @access  Private
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ message: 'Text and target language are required' });
    }

    const translation = await translateText(text, targetLanguage, sourceLanguage);

    res.json({
      success: true,
      originalText: text,
      translatedText: translation.translatedText,
      sourceLanguage: translation.sourceLanguage,
      targetLanguage: translation.targetLanguage,
      confidence: translation.confidence,
    });
  } catch (error) {
    logger.error('Translation error:', error);
    res.status(500).json({ message: 'Translation failed' });
  }
});

// @route   POST /api/nlp/extract-entities
// @desc    Extract named entities from text
// @access  Private
router.post('/extract-entities', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    const entities = await extractNamedEntities(text);

    res.json({
      success: true,
      entities: entities.entities,
      confidence: entities.confidence,
    });
  } catch (error) {
    logger.error('Entity extraction error:', error);
    res.status(500).json({ message: 'Entity extraction failed' });
  }
});

// Mock implementations for NLP functions
async function analyzeSentiment(text: string) {
  // Mock sentiment analysis
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'love', 'like'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'horrible'];
  
  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });
  
  const score = (positiveCount - negativeCount) / words.length;
  
  return {
    sentiment: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral',
    score: score,
    confidence: Math.abs(score) * 0.8 + 0.2,
  };
}

async function extractTopics(text: string) {
  // Mock topic extraction
  const topics = ['technology', 'business', 'health', 'education', 'entertainment'];
  const foundTopics = topics.filter(topic => 
    text.toLowerCase().includes(topic)
  );
  
  return {
    topics: foundTopics,
    confidence: 0.7,
  };
}

async function extractKeywords(text: string) {
  // Mock keyword extraction
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const words = text.toLowerCase().split(/\s+/);
  const keywords = words.filter(word => 
    word.length > 3 && !stopWords.includes(word)
  );
  
  return {
    keywords: keywords.slice(0, 10),
    confidence: 0.6,
  };
}

async function generateSummary(text: string) {
  // Mock summary generation
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const summary = sentences.slice(0, 2).join('. ') + '.';
  
  return {
    summary,
    confidence: 0.5,
  };
}

async function moderateContent(content: string, contentType: string) {
  // Mock content moderation
  const inappropriateWords = ['spam', 'inappropriate', 'offensive'];
  const hasInappropriateContent = inappropriateWords.some(word => 
    content.toLowerCase().includes(word)
  );
  
  return {
    isAppropriate: !hasInappropriateContent,
    confidence: 0.8,
    flags: hasInappropriateContent ? ['inappropriate_content'] : [],
    suggestions: hasInappropriateContent ? ['Consider revising your content'] : [],
  };
}

async function translateText(text: string, targetLanguage: string, sourceLanguage?: string) {
  // Mock translation
  return {
    translatedText: `[${targetLanguage.toUpperCase()}] ${text}`,
    sourceLanguage: sourceLanguage || 'en',
    targetLanguage,
    confidence: 0.7,
  };
}

async function extractNamedEntities(text: string) {
  // Mock entity extraction
  const entities = [
    { text: 'John Doe', type: 'PERSON', confidence: 0.9 },
    { text: 'New York', type: 'LOCATION', confidence: 0.8 },
    { text: 'Apple Inc.', type: 'ORGANIZATION', confidence: 0.7 },
  ];
  
  return {
    entities: entities.filter(entity => text.includes(entity.text)),
    confidence: 0.7,
  };
}

export default router; 