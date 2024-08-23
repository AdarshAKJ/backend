const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const gifSchema = new Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    rank: { type: Number, default: 0 }, // Optional: Default rank is 0
    tags: { type: [String], default: [] }, // Array of tags
});

module.exports = mongoose.model("GIF", gifSchema);
