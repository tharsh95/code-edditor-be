import mongoose from 'mongoose';
import openaiService from '../services/openaiService.js';
import Question from '../models/Question.js';
import { fetchAndSaveJobs } from '../services/rapidApiService.js';

// @desc    Get all jobs from database with pagination
// @route   GET /api/jobs
// @access  Public
export const getJobs = async (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count of jobs
    const totalJobs = await mongoose.connection.collection('jobs').countDocuments();
    
    // Get jobs with pagination
    const jobs = await mongoose.connection.collection('jobs')
      .find({})
      .skip(skip)
      .limit(limit)
      .sort({ date_created: -1 })
      .toArray();
    
    // Calculate total pages
    const totalPages = Math.ceil(totalJobs / limit);
    
    res.status(200).json({
      success: true,
      pagination: {
        currentPage: page,
        totalPages,
        totalJobs,
        jobsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
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
      id: req.params.id
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

// @desc    Fetch and save jobs from RapidAPI
// @route   GET /api/jobs/fetch
// @access  Public
export const fetchJobsFromAPI = async (req, res) => {
  console.log("Fetching jobs from API");
  try {
    // Get current count of jobs
    const currentJobCount = await mongoose.connection.collection('jobs').countDocuments();
    
    const params = {
      limit: 10,
      offset: currentJobCount+10, // Use current job count as offset
      title_filter: '"Software Engineer"',
      location_filter: '"India"',
      description_type: 'text'
    };

    const result = await fetchAndSaveJobs(params);

    res.status(200).json({
      success: true,
      message: 'Jobs fetched and saved successfully',
      data: result,
      currentJobCount,
      offsetUsed: currentJobCount
    });
  } catch (error) {
    console.error('Error in fetchJobsFromAPI controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
}; 