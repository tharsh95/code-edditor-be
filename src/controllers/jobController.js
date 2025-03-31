import mongoose from 'mongoose';
import openaiService from '../services/openaiService.js';
import Question from '../models/Question.js';

// @desc    Get all jobs from database
// @route   GET /api/jobs
// @access  Public
export const getJobs = async (req, res) => {
  try {
    const jobs = await mongoose.connection.collection('jobs').find({}).toArray();
    
    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    console.error('Error in getJobs controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
};

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Public
export const getJobById = async (req, res) => {
  try {
    const job = await mongoose.connection.collection('jobs').findOne({
      _id: new mongoose.Types.ObjectId(req.params.id)
    });
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Get questions for this job
    const questions = await Question.find({ job: req.params.id });
    job.questions = questions;
    
    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error in getJobById controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
};

// @desc    Generate questions for a job
// @route   POST /api/jobs/:id/questions
// @access  Public
export const generateQuestions = async (req, res) => {
  console.log("Generating questions");
  try {
    const { id } = req.params;
    const { count } = req.body;
    
    // Get job from database
    const job = await mongoose.connection.collection('jobs').findOne({
      _id: new mongoose.Types.ObjectId(id)
    });
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if there are already questions for this job
    const existingQuestions = await Question.find({ job: id }).limit(2);
    if (existingQuestions.length >= 2) {
      // If there are already 2 or more questions, return them
      return res.status(200).json({
        success: true,
        count: existingQuestions.length,
        data: existingQuestions,
        message: 'Using existing questions from database'
      });
    }
    
    // Generate questions using OpenAI
    const questionsData = await openaiService.generateQuestionsFromJobDescription(job, count || 3);
    // Save questions to database
    const savedQuestions = await openaiService.saveQuestions(questionsData, id);
    console.log(savedQuestions)
    
    res.status(201).json({
      success: true,
      count: savedQuestions.length,
      data: savedQuestions
    });
  } catch (error) {
    console.error('Error in generateQuestions controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
};

// @desc    Get questions for a job
// @route   GET /api/jobs/:id/questions
// @access  Public
export const getQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get questions from database
    const questions = await Question.find({ job: id });
    
    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    console.error('Error in getQuestions controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
}; 