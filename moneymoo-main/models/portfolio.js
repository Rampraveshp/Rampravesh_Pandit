const mongoose = require("mongoose");

const userStockSchema = new mongoose.Schema({
  stock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stock",
    required: true,
  },
  costBasis: { type: Number, required: true },
  quantity: { type: Number, required: true },
  totalCost: { type: Number, required: true },
});

const portfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      maxLength: 24,
    },
    trades: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Trade",
      },
    ],
    userStocks: [userStockSchema],
    totalValue: { type: Number },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Portfolio", portfolioSchema);
