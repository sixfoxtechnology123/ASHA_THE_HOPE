const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // This will store the Hash
    role: { type: String, default: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);