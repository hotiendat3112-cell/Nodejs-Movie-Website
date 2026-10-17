const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MovieSchema = new Schema({
    title: { type: String, required: true },
    category: { type: String },
    posterUrl: { type: String },
    description: { type: String },
    episodes: [{
        episodeNumber: Number,
        videoUrl: String
    }]
}, {
    timestamps: true,
});

module.exports = mongoose.model('Movie', MovieSchema);