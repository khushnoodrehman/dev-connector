const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    text: String,
    images: [
        {
            url: String,
            public_id: String
        }
    ],
    likes: [
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'user'
            }
        }
    ],
    comments: [
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'user'
            },

            text: String,

            createdAt: Date
        }
    ],
    tags: [String],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

postSchema.index({createdAt:-1})
postSchema.index({user:1})

module.exports = Post = mongoose.model('post', postSchema);