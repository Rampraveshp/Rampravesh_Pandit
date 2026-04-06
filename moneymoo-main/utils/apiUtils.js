const Stock = require("../models/stock.js");

const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    "APCA-API-KEY-ID": `${process.env.APCA_API_KEY_ID}`,
    "APCA-API-SECRET-KEY": `${process.env.APCA_API_SECRET_KEY}`,
  },
};

async function fetchActiveStocksByVolume(num) {
  try {
    const response = await fetch(
      `https://data.alpaca.markets/v1beta1/screener/stocks/most-actives?by=volume&top=${num}`,
      options
    );
    const results = await response.json();
    const validResults = results["most_actives"].filter((result) => {
      return !result.symbol.includes(".") && !result.symbol.includes("^");
    });
    return validResults;
  } catch (err) {
    console.error("Failed to fetch active stocks by volume", err);
  }
}

async function fetchActiveStocksByTrades(num) {
  try {
    const response = await fetch(
      `https://data.alpaca.markets/v1beta1/screener/stocks/most-actives?by=trades&top=${num}`,
      options
    );
    const results = await response.json();
    const validResults = results["most_actives"].filter((result) => {
      return !result.symbol.includes(".") && !result.symbol.includes("^");
    });
    return validResults;
  } catch (err) {
    console.error("Failed to fetch active stocks by trades", err);
  }
}

async function fetchTopMarketMovers(num) {
  try {
    const response = await fetch(`https://data.alpaca.markets/v1beta1/screener/stocks/movers?top=${num}`, options);
    const results = await response.json();
    const validResults = results.gainers.filter((result) => {
      return !result.symbol.includes(".") && !result.symbol.includes("^");
    });
    return validResults;
  } catch (err) {
    console.error("Failed to fetch top market movers", err);
  }
}

async function fetchSearchResults(symbol) {
  try {
    const response = await fetch(
      `https://financialmodelingprep.com/stable/search-symbol?query=${symbol}&apikey=${process.env.FMP_APIKEY}`
    );
    console.log("API RESPONSE BEFORE JSON:", response);
    const results = await response.json();
    const validResults = results.filter((result) => {
      return result.exchange !== "OTC" && result.exchange !== "CRYPTO" && !result.symbol.includes(".");
    });
    return validResults;
  } catch (err) {
    console.error("Failed to fetch search results", err);
  }
}

async function fetchPrices(symbols) {
  try {
    const response = await fetch(`https://data.alpaca.markets/v2/stocks/bars/latest?symbols=${symbols}`, options);
    return await response.json();
  } catch (err) {
    console.error("Error with fetching stock prices:", err);
  }
}

const fetchFinancials = async (symbol) => {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${process.env.FINNHUB_APIKEY}`
    );
    const financials = await response.json();
    return financials;
  } catch (err) {
    console.error("Failed to fetch financial data for stock", err);
  }
};

const fetchAndCreateStock = async (symbol) => {
  try {
    const response = await fetch(
      `https://financialmodelingprep.com/stable/profile?symbol=${symbol}&apikey=${process.env.FMP_APIKEY}`
    );
    const stock = await response.json();
    return await Stock.create(stock[0]);
  } catch (err) {
    console.error("Failed to fetch stock data", err);
  }
};

const fetchStockProfile = async (symbol) => {
  try {
    const response = await fetch(
      `https://financialmodelingprep.com/stable/profile?symbol=${symbol}&apikey=${process.env.FMP_APIKEY}`
    );
    const stock = await response.json();
    return stock[0];
  } catch (err) {
    console.error("Failed to fetch stock profile data", err);
  }
};
// Alternative stock data fetch using axios and Alpha Vantage API
const axios = require("axios");

async function getStock(ticker) {
  const apiKey = process.env.STOCK_API_KEY;
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`;
  const response = await axios.get(url);
  return response.data["Global Quote"];
}

module.exports = { getStock };
// Exporting all functions for external use

module.exports = {
  fetchPrices,
  fetchFinancials,
  fetchStockProfile,
  fetchAndCreateStock,
  fetchSearchResults,
  fetchActiveStocksByVolume,
  fetchActiveStocksByTrades,
  fetchTopMarketMovers,
};
