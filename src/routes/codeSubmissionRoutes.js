import express from 'express';
import {
  submitCode,
  getSubmissions
} from '../controllers/codeSubmissionController.js';

const router = express.Router();

// @route   POST /api/submit
// @desc    Submit code and get suggestions
router.post('/', submitCode);

// @route   GET /api/submissions/:questionId
// @desc    Get submission history for a question
router.get('/:questionId', getSubmissions);

export default router; 