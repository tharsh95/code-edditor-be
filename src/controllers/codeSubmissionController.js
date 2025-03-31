import Question from '../models/Question.js';
import openaiService from '../services/openaiService.js';

// @desc    Submit code and get suggestions
// @route   POST /api/submit
// @access  Public
export const submitCode = async (req, res) => {
  try {
    const { code, questionId, language } = req.body;

    // Validate required fields
    if (!code || !questionId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide code and questionId'
      });
    }

    // Check if question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Get suggestions from OpenAI
    const suggestions = await openaiService.getCodeSuggestions(code, question, language);

    // Add submission to question's submissions array
    question.submissions.push({
      code,
      language,
      suggestions
    });

    // Save the updated question
    await question.save();

    res.status(201).json({
      success: true,
      data: {
        questionId,
        submission: question.submissions[question.submissions.length - 1]
      }
    });
  } catch (error) {
    console.error('Error in submitCode controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
};

// @desc    Get submission history for a question
// @route   GET /api/submissions/:questionId
// @access  Public
export const getSubmissions = async (req, res) => {
  try {
    const { questionId } = req.params;
    
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.status(200).json({
      success: true,
      count: question.submissions.length,
      data: question.submissions
    });
  } catch (error) {
    console.error('Error in getSubmissions controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
}; 