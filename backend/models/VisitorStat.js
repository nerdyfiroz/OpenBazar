const mongoose = require('mongoose');

const VisitorStatSchema = new mongoose.Schema({
  day: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  hourly: {
    type: Map,
    of: Number,
    default: {}
  }
});

module.exports = mongoose.model('VisitorStat', VisitorStatSchema);
