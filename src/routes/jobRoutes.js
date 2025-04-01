import express from 'express';
import {
  getJobs,
  getJobById,
  generateQuestions,
  getQuestions,
  fetchJobsFromAPI
} from '../controllers/jobController.js';

const router = express.Router();

// @route   GET /api/jobs
// @desc    Get all jobs
router.get('/', getJobs);

// @route   GET /api/jobs/:id
// @desc    Get job by ID
router.get('/:id', getJobById);

// @route   POST /api/jobs/:id/questions
// @desc    Generate questions for a job
router.post('/:id/questions', generateQuestions);

// @route   GET /api/jobs/:id/questions
// @desc    Get questions for a job
router.get('/:id/questions', getQuestions);

// @route   POST /api/jobs/fetch
// @desc    Fetch and save jobs from RapidAPI
router.post('/fetch', fetchJobsFromAPI);

export default router; 