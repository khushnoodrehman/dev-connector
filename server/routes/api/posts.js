const express = require('express');
const router = express.Router();

const Post = require('../../models/Post')

// @route   GET api/posts
// @desc    Test route
// @access  Public


router.get('/', (req, res) => {
    res.send('Posts Route')
});


// @route   GET api/posts
// @desc    Get all posts
// @access  Private

router.get('/', auth, async (req, res) => {
    try {
        // Get page and limit from query string (e.g., /api/posts?page=1&limit=10)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Calculate how many posts to skip
        const skipIndex = (page - 1) * limit;

        const posts = await Post.find()
            .sort({ createdAt: -1 }) // Newest first
            .limit(limit)
            .skip(skipIndex);

        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});



router.post(
    '/',
    [
        auth,
        body('text', 'Post text is required')
            .not()
            .isEmpty()
            .trim()
            .isLength({ max: 500 })
    ],
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        try {
            const { text, images, tags } = req.body;

            const newPost = new Post({

                user: req.user.id,

                text,

                images: images || [],

                tags: tags || []

            });

            const post = await newPost.save();

            const populatedPost =
                await Post.findById(post._id)
                    .populate('user', 'name avatar');

            res.json(populatedPost);

        }
        catch (err) {
            res.status(500).send('Server Error');
        }

    });



module.exports = router;