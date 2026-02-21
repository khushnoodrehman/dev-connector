const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { body, validationResult } = require('express-validator');

const User = require('../../models/User');
const Profile = require('../../models/Profile');
const { route } = require('./auth');

// @route   GET api/profile/me
// @desc    Get current user profile
// @access  Private


router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findById({ user: req.user.id }).populate('user', [
            'name', 'avatar'
        ]);

        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user!' });
        }

        res.json(profile);
    } catch (error) {
        console.error(error.message)
        res.status(400).send('Internal server error!');
    }
});


// @route   POST api/profile
// @desc    Create or update user profile
// @access  Private

route.post('/', [
    auth,
    body('status', 'Status is required!').not().isEmpty(),
    body('skills', 'Skills is required!').not().isEmpty()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const {  } = req.body




})


module.exports = router;