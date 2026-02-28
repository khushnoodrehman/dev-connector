const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { body, validationResult } = require('express-validator');
const request = require('request');
const config = require('config');

const User = require('../../models/User');
const Profile = require('../../models/Profile');

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

router.post('/', [
    auth,
    body('status', 'Status is required!').not().isEmpty(),
    body('skills', 'Skills is required!').not().isEmpty()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body;

    const profileFields = {
        user: req.user.id,
        ...(company && { company }),
        ...(website && { website }),
        ...(location && { location }),
        ...(bio && { bio }),
        ...(status && { status }),
        ...(githubusername && { githubusername }),
        ...(skills && { skills: skills.split(',').map(skill => skill.trim()) }),
        ...((youtube || twitter || facebook || linkedin || instagram) && {
            social: {
                ...(youtube && { youtube }),
                ...(twitter && { twitter }),
                ...(facebook && { facebook }),
                ...(linkedin && { linkedin }),
                ...(instagram && { instagram })
            }
        })
    }

    try {
        let profile = await Profile.findOne({ user: req.user.id });

        if (profile) {
            //Update
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true }
            );

            return res.json(profile);
        }

        //Create
        profile = new Profile(profileFields);

        await profile.save();

        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send({ msg: 'Server error!' })
    }
});


// @route   GET api/profile
// @desc    Get all profiles
// @access  Public

router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message)
        res.status(500).send({ msg: 'Server error!' })
    }
})


// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public

router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);

        if (!profile) {
            return res.status(400).json({ msg: 'Profile not found!' })
        }


        res.json(profile);
    } catch (err) {
        console.error(err.message)
        if (err.kind == 'ObjectId') res.status(400).json({ msg: 'Profile not found!' });
        res.status(500).send({ msg: 'Server error!' })
    }
})


// @route   DELETE api/profile
// @desc    Delete profile, user & posts
// @access  Private

router.delete('/', auth, async (req, res) => {
    try {
        // Remove Profile
        await Profile.findOneAndDelete({ user: req.user.id });

        // Remove User
        await User.findOneAndDelete({ _id: req.user.id });

        res.json({ msg: 'User deleted!' });

    } catch (err) {
        console.error(err.message)
        res.status(500).send({ msg: 'Server error!' })
    }
});


// @route   PUT api/profile/experience
// @desc    Adding new experience
// @access  Private


router.put('/experience', [
    auth,
    body('title', 'Title is required').not().isEmpty(),
    body('company', 'Company is required').not().isEmpty(),
    body('from', 'From date is required').not().isEmpty()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(401).json({ msg: 'No Profile found!' });
        }

        profile.experience.unshift(newExp);

        await profile.save();
        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error!')
    }
});



// @route    PUT api/profile/experience/:exp_id
// @desc     Update experience in profile
// @access   Private


router.put('/experience/:exp_id', [
    auth,
    body('title', 'Title is required').not().isEmpty(),
    body('company', 'Company is required').not().isEmpty(),
    body('from', 'From date is required').not().isEmpty()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(404).json({ msg: 'Profile not found' });
        }

        const updateIndex = profile.experience
            .map(item => item.id)
            .indexOf(req.params.exp_id);

        if (updateIndex === -1) {
            return res.status(404).json({ msg: 'Experience entry not found' });
        }

        const { title, company, location, from, to, current, description } = req.body;

        if (title) profile.experience[updateIndex].title = title;
        if (company) profile.experience[updateIndex].company = company;
        if (location) profile.experience[updateIndex].location = location;
        if (from) profile.experience[updateIndex].from = from;
        if (to) profile.experience[updateIndex].to = to;
        if (description) profile.experience[updateIndex].description = description;

        if (current !== undefined) profile.experience[updateIndex].current = current;

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route    DELETE api/profile/experience/:exp_id
// @desc     Delete experience in profile
// @access   Private


router.delete('/experience/:exp_id', auth, async (req, res) => {
    const { exp_id } = req.params;

    try {
        const profile = await Profile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(404).json({ msg: 'Profile not found' });
        }

        const indexToDel = profile.experience
            .map(item => item.id)
            .indexOf(exp_id);

        if (indexToDel === -1) {
            return res.status(404).json({ msg: 'Experience already deleted!' });
        }

        // profile.experience = profile.experience.filter(
        //     exp => exp._id.toString() !== req.params.exp_id
        // );

        profile.experience.splice(indexToDel, 1);

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});



// @route   PUT api/profile/education
// @desc    Adding new education
// @access  Private

router.put('/education', [
    auth,
    body('school', 'School is required').not().isEmpty(),
    body('degree', 'Degree is required').not().isEmpty(),
    body('fieldofstudy', 'Field of study is required').not().isEmpty(),
    body('from', 'From date is required').not().isEmpty()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body;

    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(401).json({ msg: 'No Profile found!' });
        }

        profile.education.unshift(newEdu);

        await profile.save();
        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error!')
    }
});




// @route    PUT api/profile/education/:edu_id
// @desc     Update education in profile
// @access   Private


router.put('/education/:edu_id', [
    auth,
    body('school', 'School is required').not().isEmpty(),
    body('degree', 'Degree is required').not().isEmpty(),
    body('fieldofstudy', 'Field of study is required').not().isEmpty(),
    body('from', 'From date is required').not().isEmpty()
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(404).json({ msg: 'Profile not found' });
        }

        const updateIndex = profile.education
            .map(item => item.id)
            .indexOf(req.params.edu_id);

        if (updateIndex === -1) {
            return res.status(404).json({ msg: 'Education entry not found' });
        }

        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        } = req.body;

        if (school) profile.education[updateIndex].school = school;
        if (degree) profile.education[updateIndex].degree = degree;
        if (fieldofstudy) profile.education[updateIndex].fieldofstudy = fieldofstudy;
        if (from) profile.education[updateIndex].from = from;
        if (to) profile.education[updateIndex].to = to;
        if (description) profile.education[updateIndex].description = description;

        if (current !== undefined) profile.education[updateIndex].current = current;

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});



// @route    DELETE api/profile/education/:edu_id
// @desc     Delete education in profile
// @access   Private


router.delete('/education/:edu_id', auth, async (req, res) => {
    const { edu_id } = req.params;

    try {
        const profile = await Profile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(404).json({ msg: 'Profile not found' });
        }

        const indexToDel = profile.education
            .map(item => item.id)
            .indexOf(edu_id);

        if (indexToDel === -1) {
            return res.status(404).json({ msg: 'Education no found or already deleted!' });
        }

        // profile.experience = profile.education.filter(
        //     edu => edu._id.toString() !== edu_id
        // );

        profile.education.splice(indexToDel, 1);

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});



// @route   GET api/profile/github/:username
// @desc    Get user repos from github
// @access  Public

router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientID')}&client_secret=${config.get('githubClientSecret')}`,
            method: 'GET',
            headers: { 'user-agent': 'node.js' }
        };

        request(options, (error, response, body) => {
            if(error) console.error(error);

            if(response.statusCode !== 200) {
                return res.status(404).json({ msg: 'No github profile found!' })
            }

            res.json(JSON.parse(body));
        })
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error!')
    }
});


module.exports = router;