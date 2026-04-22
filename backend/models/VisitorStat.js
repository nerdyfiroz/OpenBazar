const mongoose = require('mongoose');

const VisitorStatSchema = new mongoose.Schema({
  day: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 }
});

module.exports = mongoose.model('VisitorStat', VisitorStatSchema);
