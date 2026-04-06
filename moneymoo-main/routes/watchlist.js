const express = require("express");
const queries = require("../queries/queries.js");
const router = express.Router();

/* ------------------------- GET ROUTES ------------------------- */

router.get("/", async (req, res) => {
  const watchlistId = req.query.id;
  const watchlists = await queries.getUserWatchlists(req.session.user._id);
  if (watchlistId) {
    const watchlist = await queries.getWatchlistById(watchlistId);
    if (req.query.edit) watchlist.edit = true;
    return res.render("watchlist/index", {
      watchlists: watchlists,
      activeWatchlist: watchlist,
      stocks: null,
    });
  }
  if (watchlists.length < 1) {
    return res.render("watchlist/index", {
      watchlists: null,
      activeWatchlist: null,
      stocks: null,
    });
  }
  const stockLists = watchlists
    .filter((list) => list.stocks.length > 0)
    .map((list) => list.stocks)
    .flat();
  if (stockLists.length < 1 && stockLists) {
    return res.render("watchlist/index", {
      watchlists: watchlists,
      activeWatchlist: null,
      stocks: null,
    });
  }
  const stocks = [...new Set(stockLists)];
  console.log("FINAL LIST:", stocks);
  res.render("watchlist/index", {
    watchlists: watchlists,
    activeWatchlist: null,
    stocks: stocks,
  });
});

router.get("/new", (req, res) => {
  res.render("watchlist/new");
});

router.get("/add", async (req, res) => {
  const { symbol } = req.query;
  const stock = await queries.findOrCreateStock(symbol);
  const watchlists = await queries.getUserWatchlists(req.session.user._id);
  if (watchlists.length < 1) return res.redirect("/watchlist/new");
  res.render("watchlist/add", {
    stock: stock,
    watchlists: watchlists,
  });
});

router.get("/:watchlistId/remove", async (req, res) => {
  const watchlist = await queries.getWatchlistById(req.params.watchlistId);
  res.render("watchlist/remove", { watchlist });
});

/* ------------------------ POST ROUTES -------------------------- */

router.post("/", async (req, res) => {
  const watchlist = await queries.createWatchlist(req.session.user._id, req.body.name);
  res.redirect(`/watchlist?id=${watchlist._id}`);
});

router.post("/add/:stockId", async (req, res) => {
  const { ...formData } = req.body;
  if (Object.keys(formData).length < 1) return res.redirect("/watchlist");
  await queries.addToWatchlist(formData, req.params.stockId, req.session.user._id);
  res.redirect("/watchlist");
});

/* ------------------------ PUT ROUTES --------------------------- */

router.put("/:watchlistId", async (req, res) => {
  await queries.updateWatchlist(req.params.watchlistId, req.body.name);
  res.redirect(`/watchlist?id=${req.params.watchlistId}`);
});

router.put("/:watchlistId/remove", async (req, res) => {
  await queries.removeFromWatchlist(req.params.watchlistId, req.query.id);
  res.redirect(`/watchlist?id=${req.params.watchlistId}`);
});

/* ----------------------- DELETE ROUTES ------------------------- */

router.delete("/:watchlistId", async (req, res) => {
  await queries.deleteWatchlist(req.params.watchlistId);
  res.redirect("/watchlist");
});

module.exports = router;
