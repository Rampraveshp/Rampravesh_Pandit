const Portfolio = require("../models/portfolio.js");
const Watchlist = require("../models/watchlist.js");
const User = require("../models/user.js");
const Trade = require("../models/trade.js");
const Stock = require("../models/stock.js");
const api = require("../utils/apiUtils.js");
const utils = require("../utils/serverUtils.js");

const getUserById = async (userId) => {
  try {
    return await User.findById(userId);
  } catch (e) {
    console.log("Error getting User by ID:", e);
  }
};

const getPortfolioById = async (portfolioId) => {
  try {
    return await Portfolio.findById(portfolioId).populate("userStocks.stock");
  } catch (e) {
    console.log("Error getting Portfolio by ID:", e);
  }
};

const getTradeById = async (tradeId) => {
  try {
    return await Trade.findById(tradeId).populate("stock");
  } catch (e) {
    console.log("Error with getting Trade by ID:", e);
  }
};

const getWatchlistById = async (watchlistId) => {
  try {
    return await Watchlist.findById(watchlistId).populate("stocks");
  } catch (e) {
    console.log("Error with getting Watchlist by ID:", e);
  }
};

const getUserWatchlists = async (userId) => {
  try {
    return await Watchlist.find({ userId: userId }).populate("stocks");
  } catch (e) {
    console.log("Error with getting Watchlists by userId:", e);
  }
};

const getUserPortfolios = async (userId) => {
  try {
    return await Portfolio.find({ userId: userId }).populate("userStocks.stock");
  } catch (e) {
    console.log("Error getting Portfolios by userId:", e);
  }
};

const getDatabasePortfolios = async () => {
  try {
    return await Portfolio.find({}).populate("userStocks.stock");
  } catch (e) {
    console.log("Error getting Database Portfolios:", e);
  }
};

const getDatabaseStocks = async () => {
  try {
    return await Stock.find();
  } catch (e) {
    console.log("Error getting Database Stocks:", e);
  }
};

const getTradesByPortfolioStock = async (stockId, portfolioId) => {
  try {
    const trades = await Trade.find({
      $and: [{ stock: stockId }, { portfolioId: portfolioId }],
    });
    console.log("TRADES FOUND?:", trades);
    return trades;
  } catch (e) {
    console.log("Error with getting trades by Portfolio & Stock:", e);
  }
};

const getPortfolioAndTrades = async (portfolioId) => {
  try {
    const portfolio = await Portfolio.findById(portfolioId).populate({
      path: "trades",
      populate: { path: "stock", model: "Stock" },
    });
    portfolio.trades.forEach((trade) => {
      trade.dateStr = trade.date.toLocaleDateString("en-us", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    });
    portfolio.trades.sort((a, b) => b.date - a.date);
    return portfolio;
  } catch (e) {
    console.log("Error with getting Portfolio and Trades:", e);
  }
};

const getStockById = async (stockId) => {
  try {
    return await Stock.findById(stockId);
  } catch (e) {
    console.log("Error with getting Stock by ID:", e);
  }
};

const findOrCreateStock = async (symbol) => {
  try {
    let stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    console.log("DID WE FIND A STOCK?:", stock);
    if (!stock) stock = await api.fetchAndCreateStock(symbol);
    return stock;
  } catch (e) {
    console.log("Error with trying to find a stock or creating one from the API:", e);
  }
};

const createPortfolio = async (userId, name) => {
  try {
    const portfolio = await Portfolio.create({
      userId: userId,
      name: name,
      totalValue: 0,
    });
    const user = await getUserById(userId);
    user.portfolios.push(portfolio._id);
    await user.save();
  } catch (e) {
    console.log("Error trying to create new Portfolio:", e);
  }
};

const createTrade = async (type, symbol, date, quantity, price, notes, portfolioId) => {
  try {
    const portfolio = await getPortfolioById(portfolioId);
    const stock = await findOrCreateStock(symbol);
    const trades = await getTradesByPortfolioStock(stock._id, portfolio._id);
    const tradeDate = new Date(date);

    // TODO-ST: Handle user-facing message for not enough shares to sell / shares are 0.
    // i.e "Stock removed from portfolio since selling"
    // i.e "Invalid trade, not enough shares in current stock to sell"
    // "Invalid trade. No existing trades found for this stock"

    if (type.toLowerCase() === "sell" && trades.length <= 0) {
      console.log('There are no existing trades found for this sell trade.');
      return;
    }

    if (price.includes(",")) price = price.replace(/,/g, "");
    if (quantity.includes(",")) quantity = quantity.replace(/,/g, "");

    const trade = await Trade.create({
      type: type.toLowerCase(),
      stock: stock._id,
      date: tradeDate,
      quantity: Number(quantity),
      price: Number(price),
      notes: notes || null,
      portfolioId: portfolioId,
    });
    console.log("NEW TRADE CREATED:", trade);

    if (trades.length > 0) {
      const updateUserStock = await utils.handleTradeType(portfolio, trades, trade, stock);
      if (updateUserStock === "removeStock") {
        console.log("Stock is now at 0 quantity. Removing the stock.");
        const userStock = portfolio.userStocks.find((userSt) => {
          return userSt.stock._id.toString() === stock._id.toString();
        });
        await deleteStockFromPortfolio(userStock._id, portfolioId);
        return;
      } else if (updateUserStock === "invalidTrade") {
        console.log("Invalid Trade. Trying to sell more than is held.");
        await deleteInvalidTrade(trade._id);
        return;
      }
    } else {
      const userStock = {
        stock: stock._id,
        costBasis: Number(price),
        quantity: Number(quantity),
        totalCost: Number(price) * Number(quantity),
      };
      portfolio.userStocks.push(userStock);
    }
    portfolio.trades.push(trade);
    await portfolio.save();
    await updatePortfolioTotalValue(portfolioId);
  } catch (e) {
    console.log("Error trying to create new Trade:", e);
  }
};

const createWatchlist = async (userId, name) => {
  try {
    const watchlist = await Watchlist.create({ userId, name });
    const user = await getUserById(userId);
    user.watchlists.push(watchlist);
    await user.save();
    return watchlist;
  } catch (e) {
    console.log("Error trying to create new Watchlist:", e);
  }
};

const updateAllPortfolioValues = async (bulkEdit) => {
  try {
    const result = await Portfolio.bulkWrite(bulkEdit);
    console.log(`${result.modifiedCount} portfolio totalValues were updated.`);
  } catch (error) {
    console.error("Error updating database portfolios total values:", error);
  }
};

const updateStockPrices = async (bulkEdit) => {
  try {
    const result = await Stock.bulkWrite(bulkEdit);
    console.log(`${result.modifiedCount} stocks were updated.`);
  } catch (error) {
    console.error("Error updating database stock prices:", error);
  }
};

const updateWatchlist = async (watchlistId, name) => {
  try {
    await Watchlist.findByIdAndUpdate(watchlistId, { name: name });
  } catch (e) {
    console.log("Error with updating Watchlist:", e);
  }
};

const updatePortfolio = async (portfolioId, name) => {
  try {
    await Portfolio.findByIdAndUpdate(portfolioId, { name: name });
  } catch (e) {
    console.log("Error with updating Portfolio:", e);
  }
};

const updatePortfolioTotalValue = async (portfolioId) => {
  try {
    const portfolio = await getPortfolioById(portfolioId);
    const totalSum = portfolio.userStocks.reduce((total, userStock) => {
      return total + userStock.quantity * userStock.stock.price;
    }, 0);
    portfolio.totalValue = totalSum;
    await portfolio.save();
  } catch (e) {
    console.log("Error with updating Portfolio Total Value:", e);
  }
};

const updateTrade = async (tradeId, date, notes) => {
  try {
    const newDate = new Date(date);
    await Trade.findByIdAndUpdate(tradeId, {
      date: newDate,
      notes: notes,
    });
  } catch (e) {
    console.log("Error with updating Trade:", e);
  }
};

const addToWatchlist = async (formData, stockId, userId) => {
  try {
    Object.keys(formData).forEach((wl) => {
      if (formData[wl] === "on") formData[wl] = true;
    });
    const stock = await getStockById(stockId);
    const watchlists = await getUserWatchlists(userId);
    watchlists.forEach((watchlist) => {
      Object.keys(formData).forEach(async (key) => {
        if (key === watchlist.name && key) {
          const foundList = await Watchlist.findOne({ name: watchlist.name });
          console.log("FOUND A LIST AND PUSHING STOCK:", foundList);
          foundList.stocks.push(stock);
          await foundList.save();
        }
      });
    });
  } catch (e) {
    console.log("Error trying to add to Watchlist:", e);
  }
};

const removeFromWatchlist = async (watchlistId, stockId) => {
  try {
    const watchlist = await getWatchlistById(watchlistId);
    watchlist.stocks.pull(stockId);
    await watchlist.save();
  } catch (e) {
    console.log("Error with trying to remove stock from Watchlist:", e);
  }
};

const deleteInvalidTrade = async (tradeId) => {
  try {
    await Trade.findByIdAndDelete(tradeId);
  } catch (e) {
    console.log("Error with deleting invalid Trade:", e);
  }
};

const deleteTradeFromPortfolio = async (portfolioId, tradeId) => {
  try {
    const trade = await getTradeById(tradeId);
    console.log("TRADE:", trade);
    const tradeTotalCost = trade.price * trade.quantity;
    const portfolio = await getPortfolioById(portfolioId);
    const userStock = portfolio.userStocks.find((u) => {
      return u.stock._id.toString() === trade.stock._id.toString();
    });

    if (trade.type.toLowerCase() === "buy") {
      userStock.quantity = userStock.quantity - trade.quantity;
      if (userStock.quantity > 0) {
        userStock.totalCost = userStock.totalCost - tradeTotalCost;
        userStock.costBasis = userStock.totalCost / userStock.quantity;
      } else {
        portfolio.userStocks.pull(userStock._id);
      }
    } else {
      userStock.quantity = userStock.quantity + trade.quantity;
      userStock.totalCost = userStock.totalCost + tradeTotalCost;
      userStock.costBasis = userStock.totalCost / userStock.quantity;
    }
    portfolio.trades.pull(tradeId);
    await trade.deleteOne();
    await portfolio.save();
    await updatePortfolioTotalValue(portfolio._id);
  } catch (e) {
    console.log("Error with deleting Trade from Portfolio:", e);
  }
};

const deletePortfolio = async (portfolioId) => {
  try {
    const portfolio = await getPortfolioById(portfolioId);
    const user = await getUserById(portfolio.userId);
    user.portfolios.pull(portfolio._id);
    await user.save();
    await Trade.deleteMany({ portfolioId: portfolio._id });
    await portfolio.deleteOne();
  } catch (e) {
    console.log("Error with deleting Portfolio:", e);
  }
};

const deleteWatchlist = async (watchlistId) => {
  try {
    const watchlist = await getWatchlistById(watchlistId);
    const user = await getUserById(watchlist.userId);
    user.watchlists.pull(watchlist._id);
    await user.save();
    await watchlist.deleteOne();
  } catch (e) {
    console.log("Error with deleting Watchlist:", e);
  }
};

const deleteStockFromPortfolio = async (userStockId, portfolioId) => {
  try {
    const portfolio = await getPortfolioById(portfolioId);
    const userStock = portfolio.userStocks.id(userStockId);
    const trades = await getTradesByPortfolioStock(userStock.stock._id, portfolio._id);
    const tradesToRemove = trades.map((trade) => trade._id.toString());
    portfolio.trades.forEach((trade) => {
      if (tradesToRemove.includes(trade.toString())) {
        portfolio.trades.pull(trade);
      }
    });
    portfolio.userStocks.pull(userStock._id);
    await portfolio.save();
    await updatePortfolioTotalValue(portfolioId);
    await Trade.deleteMany({
      $and: [{ stock: userStock.stock._id }, { portfolioId: portfolio._id }],
    });
  } catch (e) {
    console.log("Error with deleting userStock from Portfolio:", e);
  }
};

module.exports = {
  // getters
  getDatabasePortfolios,
  getTradeById,
  getStockById,
  getUserPortfolios,
  getUserWatchlists,
  getPortfolioById,
  getWatchlistById,
  getPortfolioAndTrades,
  getDatabaseStocks,
  findOrCreateStock,
  // setters
  createPortfolio,
  createTrade,
  createWatchlist,
  // updates
  addToWatchlist,
  updateAllPortfolioValues,
  updateStockPrices,
  updatePortfolio,
  updatePortfolioTotalValue,
  updateTrade,
  updateWatchlist,
  // deletes
  deleteInvalidTrade,
  removeFromWatchlist,
  deleteStockFromPortfolio,
  deleteTradeFromPortfolio,
  deletePortfolio,
  deleteWatchlist,
};
