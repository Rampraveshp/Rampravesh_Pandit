const express = require("express");
const router = express.Router();
const api = require("../utils/apiUtils.js");

router.get("/", async (req, res) => {
  const { view } = req.query;
  if (view) {
    switch (view) {
      case "active-by-volume":
        const activeStocksByVolume = await api.fetchActiveStocksByVolume(50);
        res.render("browse/index", {
          activeByVolume: activeStocksByVolume,
          activeByTrades: null,
          topMarketMovers: null,
          activeTab: "volume",
        });
        break;
      case "active-by-trades":
        const activeStocksByTrades = await api.fetchActiveStocksByTrades(50);
        res.render("browse/index", {
          activeByVolume: null,
          activeByTrades: activeStocksByTrades,
          topMarketMovers: null,
          activeTab: "trades",
        });
        break;
      case "top-movers":
        const topMarketMovers = await api.fetchTopMarketMovers(50);
        res.render("browse/index", {
          activeByVolume: null,
          activeByTrades: null,
          topMarketMovers: topMarketMovers,
          activeTab: "movers",
        });
        break;
    }
    return;
  }
  res.redirect("/browse?view=top-movers");
});

module.exports = router;
