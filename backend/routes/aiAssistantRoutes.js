/**
 * Enhanced AI Assistant Routes
 * API endpoints for AI assistant functionality with conversation management
 */

const express = require('express');
const router = express.Router();
const { chatWithAI, getConversationHistory, getAIStatus } = require('../controllers/aiAssistantController');

/**
 * POST /api/ai-assistant/chat
 * Chat with AI assistant with conversation storage
 * Body: { question: string, conversationId?: string, sessionId?: string }
 */
router.post('/chat', chatWithAI);

/**
 * GET /api/ai-assistant/conversation/:conversationId
 * Get conversation history by ID
 */
router.get('/conversation/:conversationId', getConversationHistory);

/**
 * GET /api/ai-assistant/status
 * Get AI assistant status with current sensor data and recommendations
 */
router.get('/status', getAIStatus);

module.exports = router;
