const stock = require("../models/stock");

const getCurrentTotals = (trades) => {
  const currentTotalCost = trades.reduce((total, trade) => total + trade.quantity * trade.price, 0);
  const currentTotalNumOfShares = trades.reduce((total, trade) => total + trade.quantity, 0);
  return { currentTotalCost, currentTotalNumOfShares };
};

const calculateNewTotals = (currentTotalCost, currentTotalNumOfShares, trade) => {
  const newTotalCost = currentTotalCost + trade.quantity * trade.price;
  const newTotalQuantity = currentTotalNumOfShares + trade.quantity;
  const newAvgCostBasis = newTotalCost / newTotalQuantity;
  return { newTotalCost, newTotalQuantity, newAvgCostBasis };
};

const calculateMktValueAndPL = async (userStocksArray) => {
  userStocksArray.forEach((userStock) => {
    userStock.marketValue = (userStock.stock.price * userStock.quantity).toFixed(2);
    userStock.unrealizedPL = (userStock.stock.price * userStock.quantity - userStock.totalCost).toFixed(2);
    userStock.unrealizedPLPercent = (
      ((userStock.stock.price * userStock.quantity - userStock.totalCost) / userStock.totalCost) *
      100
    ).toFixed(2);
  });
};

const getPortfoliosSumValue = async (portfolios) => {
  let portfoliosSumValue = portfolios.reduce((total, portfolio) => {
    return total + portfolio.totalValue;
  }, 0);
  portfoliosSumValue = Number(portfoliosSumValue.toFixed(2)).toLocaleString();
  return portfoliosSumValue;
};

const handleTradeType = async (portfolio, trades, trade, stock) => {
  const userStock = portfolio.userStocks.find((userSt) => {
    return userSt.stock._id.toString() === stock._id.toString();
  });
  if (trade.type.toLowerCase() === "buy") {
    console.log("--------- THIS IS A BUY TRADE ---------");
    const { currentTotalCost, currentTotalNumOfShares } = getCurrentTotals(trades);
    const { newAvgCostBasis, newTotalQuantity, newTotalCost } = calculateNewTotals(
      currentTotalCost,
      currentTotalNumOfShares,
      trade
    );
    userStock.set({
      costBasis: newAvgCostBasis,
      quantity: newTotalQuantity,
      totalCost: newTotalCost,
    });
  } else {
    console.log("--------- THIS IS A SELL TRADE ---------");
    if (userStock.quantity === trade.quantity) return "removeStock";
    else if (userStock.quantity < trade.quantity) return "invalidTrade";
    userStock.set({
      quantity: userStock.quantity - trade.quantity,
      totalCost: userStock.totalCost - userStock.costBasis * trade.quantity,
    });
  }
};

const calcPortfoliosSummary = async (userStocksArray) => {
  const qtSum = userStocksArray.reduce((total, userStock) => total + userStock.quantity, 0);
  const mktValueSum = userStocksArray.reduce((total, userStock) => {
    return total + Number(userStock.marketValue);
  }, 0);
  const costBasisSum = userStocksArray.reduce((total, userStock) => total + userStock.totalCost, 0);
  const unrealizedPL = mktValueSum - costBasisSum;
  const unrealizedPLPercent = ((mktValueSum - costBasisSum) / costBasisSum) * 100;
  return {
    qtSum: qtSum,
    mktValueSum: Number(mktValueSum.toFixed(2)).toLocaleString(),
    costBasisSum: Number(costBasisSum.toFixed(2)).toLocaleString(),
    unrealizedPL: Number(unrealizedPL.toFixed(2)).toLocaleString(),
    unrealizedPLPercent: Number(unrealizedPLPercent.toFixed(2)).toLocaleString(),
  };
};

const consolidateUserStocks = async (userStocks) => {
  let userStockList = [];
  userStocks.forEach((userStock) => {
    const stockExists = userStockList.some((s) => s.stock.symbol === userStock.stock.symbol);
    if (stockExists) {
      const stock = userStockList.find((s) => s.stock.symbol === userStock.stock.symbol);
      stock.totalCost += userStock.totalCost;
      stock.quantity += userStock.quantity;
      stock.costBasis = stock.totalCost / stock.quantity;
    } else {
      userStockList.push(userStock);
    }
  });
  return userStockList;
};

module.exports = {
  consolidateUserStocks,
  getCurrentTotals,
  calculateNewTotals,
  handleTradeType,
  calculateMktValueAndPL,
  calcPortfoliosSummary,
  getPortfoliosSumValue,
};
