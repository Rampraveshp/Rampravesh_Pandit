const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, unique: true },
    companyName: { type: String, required: true },
    country: { type: String, required: true },
    industry: { type: String, required: true },
    exchange: { type: String, required: true },
    sector: { type: String, required: true },
    isEtf: { type: Boolean, required: true },
    isFund: { type: Boolean, required: true },
    image: { type: String },
    // * these need to be updated regularly
    price: { type: Number, required: true },
    change: { type: Number, required: true },
    changePercentage: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Stock", stockSchema);
