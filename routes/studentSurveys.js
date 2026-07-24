const express = require('express');
const router = express.Router();
const { StudentSurvey, User, UserProfile } = require('../models');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/student-surveys
// @desc    Get all Student Surveys (Admin) — for export
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const surveys = await StudentSurvey.findAll({
      include: [{
        model: User,
        attributes: ['id', 'email'],
        include: [{ model: UserProfile, attributes: ['avatar_url', 'first_name_kh', 'last_name_kh', 'date_of_birth', 'phone_number'] }]
      }]
    });
    res.json({ success: true, data: surveys });
  } catch (error) {
    console.error('Error fetching all student surveys:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/student-surveys/me
// @desc    Get current user's Student Survey
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const survey = await StudentSurvey.findOne({
      where: { user_id: req.user.id },
      include: [{
        model: User,
        attributes: ['id', 'email'],
        include: [{ model: UserProfile, attributes: ['avatar_url', 'first_name_kh', 'last_name_kh', 'date_of_birth', 'phone_number'] }]
      }]
    });

    res.json({
      success: true,
      data: survey || null
    });
  } catch (error) {
    console.error('Error fetching student survey:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/student-surveys/me
// @desc    Create or update current user's Student Survey
// @access  Private
router.put('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find if survey already exists
    let survey = await StudentSurvey.findOne({ where: { user_id: userId } });

    if (survey) {
      // Update existing
      survey = await survey.update(req.body);
    } else {
      // Create new
      const payload = { ...req.body, user_id: userId };
      survey = await StudentSurvey.create(payload);
    }

    res.json({
      success: true,
      message: 'Student survey updated successfully',
      data: survey
    });
  } catch (error) {
    console.error('Error updating student survey:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/student-surveys/:userId
// @desc    Get specific user's Student Survey (Admin/Mekudi)
// @access  Private
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const survey = await StudentSurvey.findOne({
      where: { user_id: userId },
      include: [{
        model: User,
        attributes: ['id', 'email'],
        include: [{ model: UserProfile, attributes: ['avatar_url', 'first_name_kh', 'last_name_kh', 'date_of_birth', 'phone_number'] }]
      }]
    });

    res.json({
      success: true,
      data: survey || null
    });
  } catch (error) {
    console.error('Error fetching specific student survey:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
