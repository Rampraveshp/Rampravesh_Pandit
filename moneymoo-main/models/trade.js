const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema({
  stock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stock",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Portfolio",
    required: true,
  },
  type: {
    type: String,
    enum: ["buy", "sell"],
    required: true,
  },
  notes: { type: String },
});

module.exports = mongoose.model("Trade", tradeSchema);
