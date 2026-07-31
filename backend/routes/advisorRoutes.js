import express from 'express';
import {
  handleAdvisorChat,
  getUserChats,
  getChatMessages
} from '../controllers/advisorController.js';

const router = express.Router();

// Main advisor chat endpoint
router.post('/chat', handleAdvisorChat);

// History and session retrieval endpoints
router.get('/chats/:userId', getUserChats);
router.get('/messages/:chatId', getChatMessages);

export default router;