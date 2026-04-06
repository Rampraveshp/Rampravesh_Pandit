const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  watchlists: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Watchlist",
    },
  ],
  portfolios: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Portfolio",
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
