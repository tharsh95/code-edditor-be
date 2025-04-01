import axios from 'axios';
import Job from '../models/Job.js';

const RAPID_API_HOST = 'active-jobs-db.p.rapidapi.com';
const RAPID_API_KEY = 'e165835b8amsh39f518c60cefed4p195814jsn6fdb0889fcc6';

const rapidApiClient = axios.create({
  baseURL: 'https://active-jobs-db.p.rapidapi.com',
  headers: {
    'x-rapidapi-host': RAPID_API_HOST,
    'x-rapidapi-key': RAPID_API_KEY
  }
});

/**
 * Fetch jobs from RapidAPI
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} - Array of jobs
 */
export const fetchJobs = async (params = {}) => {
  try {
    const response = await rapidApiClient.get('/active-ats-7d', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching jobs from RapidAPI:', error);
    throw error;
  }
};

/**
 * Save jobs to MongoDB
 * @param {Array} jobs - Array of jobs to save
 * @returns {Promise<Array>} - Saved jobs
 */
export const saveJobs = async (jobs) => {
  try {
    // Convert date strings to Date objects
    const processedJobs = jobs.map(job => ({
      ...job,
      date_posted: new Date(job.date_posted),
      date_created: new Date(job.date_created),
      date_validthrough: job.date_validthrough ? new Date(job.date_validthrough) : null
    }));

    // Use bulkWrite with ordered: false for better performance
    const operations = processedJobs.map(job => ({
      updateOne: {
        filter: { id: job.id },
        update: { $set: job },
        upsert: true
      }
    }));

    const result = await Job.bulkWrite(operations, { ordered: false });
    
    return {
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedCount
    };
  } catch (error) {
    console.error('Error saving jobs to database:', error);
    throw error;
  }
};

/**
 * Fetch and save jobs
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result of the operation
 */
export const fetchAndSaveJobs = async (params = {}) => {
  try {
    const jobs = await fetchJobs(params);
    const result = await saveJobs(jobs);
    return result;
  } catch (error) {
    console.error('Error in fetchAndSaveJobs:', error);
    throw error;
  }
}; 