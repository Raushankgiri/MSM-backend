const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now },
});

const connection = mongoose.model('connectionslist', connectionSchema);

module.exports = connection;