const express = require("express");
const router = express.Router();
const api = require("../utils/apiUtils.js");

router.get("/", (req, res) => {
  res.render("browse/index");
});

router.get("/results", (req, res) => {
  const results = req.session.searchResults || []; // fallback to empty array

  if (results.length === 0) {
    return res.render("search/results", { results: null });
  }

  res.render("search/results", { results });
});

router.post("/", async (req, res) => {
  try {
    req.session.searchResults = await api.fetchSearchResults(req.body.symbol);
  } catch (err) {
    console.error("Error fetching search results:", err);
    req.session.searchResults = [];
  }
  res.redirect("/search/results");
});

module.exports = router;
