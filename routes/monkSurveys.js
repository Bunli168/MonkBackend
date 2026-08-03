const express = require('express');
const router = express.Router();
const { MonkSurvey, User, UserProfile } = require('../models');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/monk-surveys
// @desc    Get all Monk Surveys (Admin) — for export
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const surveys = await MonkSurvey.findAll({
      include: [{
        model: User,
        where: { is_active: true },
        attributes: ['id', 'email', 'role_id'],
        include: [{ model: UserProfile, attributes: ['avatar_url', 'first_name_kh', 'last_name_kh', 'date_of_birth', 'phone_number', 'chhaya_number', 'from_wat'] }]
      }]
    });
    res.json({ success: true, data: surveys });
  } catch (error) {
    require('fs').writeFileSync('debug_error.log', error.stack || error.message);
    console.error('Error fetching all monk surveys:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/monk-surveys/me
// @desc    Get current user's Monk Survey
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const survey = await MonkSurvey.findOne({
      where: { user_id: req.user.id },
      include: [{
        model: User,
        attributes: ['id', 'email', 'role_id'],
        include: [{ model: UserProfile, attributes: ['avatar_url', 'first_name_kh', 'last_name_kh', 'date_of_birth', 'phone_number'] }]
      }]
    });

    res.json({
      success: true,
      data: survey || null
    });
  } catch (error) {
    console.error('Error fetching monk survey:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/monk-surveys/me
// @desc    Create or update current user's Monk Survey
// @access  Private
router.put('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find if survey already exists
    let survey = await MonkSurvey.findOne({ where: { user_id: userId } });

    if (survey) {
      // Update existing
      survey = await survey.update(req.body);
    } else {
      // Create new
      const payload = { ...req.body, user_id: userId };
      survey = await MonkSurvey.create(payload);
    }

    res.json({
      success: true,
      message: 'Monk survey updated successfully',
      data: survey
    });
  } catch (error) {
    console.error('Error updating monk survey:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/monk-surveys/:userId
// @desc    Get specific user's Monk Survey (Admin/Mekudi)
// @access  Private
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const survey = await MonkSurvey.findOne({
      where: { user_id: userId },
      include: [{
        model: User,
        attributes: ['id', 'email', 'role_id'],
        include: [{ model: UserProfile, attributes: ['avatar_url', 'first_name_kh', 'last_name_kh', 'date_of_birth', 'phone_number'] }]
      }]
    });

    res.json({
      success: true,
      data: survey || null
    });
  } catch (error) {
    console.error('Error fetching specific monk survey:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/monk-surveys/:userId
// @desc    Update specific user's Monk Survey (Admin/Mekudi)
// @access  Private
router.put('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    
    let survey = await MonkSurvey.findOne({ where: { user_id: userId } });

    if (survey) {
      survey = await survey.update(req.body);
    } else {
      const payload = { ...req.body, user_id: userId };
      survey = await MonkSurvey.create(payload);
    }

    res.json({
      success: true,
      message: 'Monk survey updated successfully',
      data: survey
    });
  } catch (error) {
    console.error('Error updating specific monk survey:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
