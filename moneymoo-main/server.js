const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const morgan = require("morgan");
const session = require("express-session");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const cron = require("node-cron");
const path = require("path");

// * Routes and Controllers
const portfolioRoutes = require("./routes/portfolio.js");
const watchlistRoutes = require("./routes/watchlist.js");
const searchRoutes = require("./routes/search.js");
const browseRoutes = require("./routes/browse.js");
const stockRoutes = require("./routes/stock.js");
const authController = require("./controllers/auth.js");

// * Middleware + Utils
const api = require("./utils/apiUtils.js");
const queries = require("./queries/queries.js");
const userToView = require("./middleware/user-to-view.js");
const isSignedIn = require("./middleware/is-signed-in.js");

// * App
const app = express();
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "defaultSecretKey", // ✅ fallback
    resave: false,
    saveUninitialized: false,
  })
);

/* --------- MONGODB CONNECTION --------- */

const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/moneymoo";

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(`✅ Connected to MongoDB: ${mongoose.connection.name}`))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

/* --------- ROUTES --------- */

app.use(userToView);
app.use("/auth", authController);

app.get("/", async (req, res) => {
  try {
    if (req.session.user) {
      const portfolios = await queries.getUserPortfolios(req.session.user._id);
      const watchlists = await queries.getUserWatchlists(req.session.user._id);
      res.render("index", {
        portfolios,
        watchlists,
      });
    } else {
      res.render("index", {
        portfolios: null,
        watchlists: null,
      });
    }
  } catch (err) {
    console.error("Error loading home page:", err);
    res.status(500).send("Server error");
  }
});

app.use("/search", searchRoutes);
app.use("/browse", browseRoutes);
app.use("/stock", stockRoutes);
app.use(isSignedIn);
app.use("/portfolio", portfolioRoutes);
app.use("/watchlist", watchlistRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 App is listening on http://localhost:${PORT}`);
});

/* --------- CRON JOBS --------- */

cron.schedule("*/15 * * * *", async () => {
  console.log("⏳ CRON: Updating stock prices (every 15 min)");
  try {
    const stocks = await queries.getDatabaseStocks();
    const stockSymbols = stocks.map((stock) => stock.symbol).join("%2C");
    const data = await api.fetchPrices(stockSymbols);
    const newPrices = [];
    Object.keys(data.bars).forEach((key) => {
      const newObj = { symbol: key, price: data.bars[key].c };
      newPrices.push(newObj);
    });
    const bulkEdit = newPrices.map((stock) => {
      return {
        updateOne: {
          filter: { symbol: stock.symbol },
          update: { $set: { price: stock.price } },
        },
      };
    });
    await queries.updateStockPrices(bulkEdit);
  } catch (err) {
    console.error("CRON error (stock update):", err);
  }
});

cron.schedule("* 6 * * *", async () => {
  console.log("⏳ CRON: Updating portfolio values (every 6 hrs)");
  try {
    const portfoliosInDatabase = await queries.getDatabasePortfolios();
    portfoliosInDatabase.forEach((portfolio) => {
      const mktValue = portfolio.userStocks.reduce((total, userStock) => {
        return total + userStock.quantity * userStock.stock.price;
      }, 0);
      portfolio.mktValue = mktValue;
    });
    const bulkEdit = portfoliosInDatabase.map((portfolio) => {
      return {
        updateOne: {
          filter: { _id: portfolio._id },
          update: { $set: { totalValue: portfolio.mktValue } },
        },
      };
    });
    await queries.updateAllPortfolioValues(bulkEdit);
  } catch (err) {
    console.error("CRON error (portfolio update):", err);
  }
});
