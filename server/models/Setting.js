const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, default: '' }
});

module.exports = mongoose.model('Setting', settingSchema);
