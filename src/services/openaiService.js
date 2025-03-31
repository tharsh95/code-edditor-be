import openai from '../config/openai.js';
import Question from '../models/Question.js';

/**
 * Create system prompt for OpenAI
 * @returns {String} - System prompt
 */
const createSystemPrompt = () => {
  return `You are an AI specialized in creating programming interview questions based on job descriptions.
Your task is to generate unique, relevant programming questions that test the skills mentioned in the job description.
IMPORTANT: Generate questions ONLY in this programming languages: JavaScript.
Each question should include a title, difficulty level, detailed description, examples with input/output, and constraints.
Format your response as a valid JSON array with objects containing the following fields:
- title: A concise title for the question
- difficulty: 'Easy', 'Medium', 'Hard'
- description: A detailed description of the problem
- examples: An array of objects, each with input, output, and explanation
- testCases: An array of exactly 4 test cases, each with:
  - input: The input data for the test case
  - output: The expected output
  - explanation: A detailed explanation of why this output is correct
  - isHidden: false for the first 2 test cases, true for the last 2 (these will be used for validation)
- constraints: An array of strings describing the constraints
- language: The programming language for the question (must be one of: JavaScript)
examples and test cases should be in proper object format.
Return ONLY the JSON array with no additional text or explanations.`;
};

/**
 * Create user prompt for OpenAI
 * @param {Object} job - Job object
 * @param {Number} count - Number of questions
 * @returns {String} - User prompt
 */
const createUserPrompt = (job, count) => {
  // Extract requirements from the description
  const requirementsMatch = job.description_text.match(/Skills and experience that will lead to success\n(.*?)(?=\n\n|$)/s);
  const requirements = requirementsMatch 
    ? requirementsMatch[1].split('\n').map(req => req.trim()).filter(req => req)
    : [];

  return `Please create ${count} programming interview questions based on this job description:

Job Title: ${job.title}
Company: ${job.organization}
Description: ${job.description_text}
${requirements.length > 0 ? `Requirements: ${requirements.join(', ')}` : ''}

The questions should test the technical skills required for this position. Make them challenging but reasonable.
Please ensure each question has a clear title, difficulty level, detailed description, examples with input/output, and constraints.
Return the result as a valid JSON array.`;
};

/**
 * Generate programming questions based on a job description
 * @param {Object} job - Job object containing job details
 * @param {Number} count - Number of questions to generate (default: 3)
 * @returns {Promise<Array>} - Generated questions
 */
const generateQuestionsFromJobDescription = async (job, count = 3) => {
  try {
    const systemPrompt = createSystemPrompt();
    const userPrompt = createUserPrompt(job, count);

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const content = response.choices[0].message.content;
    
    // Parse the JSON response
    try {
      const questionsData = JSON.parse(content);
      return questionsData;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse OpenAI response');
    }
  } catch (error) {
    console.error('Error generating questions with OpenAI:', error.message);
    throw new Error('Failed to generate questions with OpenAI');
  }
};

/**
 * Save generated questions to the database
 * @param {Array} questionsData - Array of question data
 * @param {String} jobId - Job ID
 * @returns {Promise<Array>} - Saved questions
 */
const saveQuestions = async (questionsData, jobId) => {
  try {
    const savedQuestions = [];
    
    for (const questionData of questionsData) {
      const newQuestion = await Question.create({
        title: questionData.title,
        difficulty: questionData.difficulty,
        description: questionData.description,
        examples: questionData.examples,
        testCases: questionData.testCases,
        constraints: questionData.constraints,
        job: jobId
      });
      
      savedQuestions.push(newQuestion);
    }
    
    return savedQuestions;
  } catch (error) {
    console.error('Error saving questions to database:', error.message);
    throw new Error('Failed to save questions to database');
  }
};

/**
 * Get code suggestions from OpenAI
 * @param {String} code - Submitted code
 * @param {Object} question - Question object
 * @param {String} language - Programming language
 * @returns {Promise<String>} - Suggestions from OpenAI
 */
const getCodeSuggestions = async (code, question, language) => {
  try {
    const systemPrompt = `You are an expert code reviewer specializing in ${language}.
Your task is to review the submitted code and provide constructive feedback and suggestions for improvement.
Focus on:
1. Code quality and readability
2. Performance optimizations
3. Best practices
4. Potential bugs or edge cases
5. Alternative approaches
Provide your feedback in a clear, structured format.`;

    const userPrompt = `Please review this code for the following question:

Title: ${question.title}
Description: ${question.description}

Submitted Code:
${code}

Please provide detailed suggestions for improvement.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error getting code suggestions from OpenAI:', error.message);
    throw new Error('Failed to get code suggestions from OpenAI');
  }
};

export default {
  generateQuestionsFromJobDescription,
  saveQuestions,
  getCodeSuggestions
}; 