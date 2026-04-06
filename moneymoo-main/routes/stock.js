const express = require("express");
const router = express.Router();
const api = require("../utils/apiUtils.js");

router.get("/", (req, res) => {
  res.redirect("/search");
});

router.get("/:stockSymbol", async (req, res) => {
  let profile = await api.fetchStockProfile(req.params.stockSymbol);
  const metrics = await api.fetchFinancials(req.params.stockSymbol);

  profile.marketCap = profile.marketCap.toLocaleString();
  profile.volume = profile.volume.toLocaleString();
  profile.averageVolume = profile.averageVolume.toLocaleString();

  if (!metrics) return res.render(`stock/show`, { stock: profile, financials: null });
  const financials = {
    "52WeekHigh": metrics.metric["52WeekHigh"] || null,
    "52WeekHighDate": metrics.metric["52WeekHighDate"] || null,
    "52WeekLow": metrics.metric["52WeekLow"] || null,
    "52WeekLowDate": metrics.metric["52WeekLowDate"] || null,
    "10DayAverageTradingVolume": metrics.metric["10DayAverageTradingVolume"] || null,
    yearToDatePriceReturnDaily: metrics.metric.yearToDatePriceReturnDaily || null,
    monthToDatePriceReturnDaily: metrics.metric.monthToDatePriceReturnDaily || null,
    currentRatioAnnual: metrics.metric.currentRatioAnnual || null,
    currentRatioQuarterly: metrics.metric.currentRatioQuarterly || null,
    peTTM: metrics.metric.peTTM || null,
    epsAnnual: metrics.metric.epsAnnual || null,
    epsGrowth3Y: metrics.metric.epsGrowth3Y || null,
    epsGrowth5Y: metrics.metric.epsGrowth5Y || null,
    epsGrowthQuarterlyYoy: metrics.metric.epsGrowthQuarterlyYoy || null,
    pb: metrics.metric.pb || null,
    pbAnnual: metrics.metric.pbAnnual || null,
    pbQuarterly: metrics.metric.pbQuarterly || null,
    cashFlowPerShareTTM: metrics.metric.cashFlowPerShareTTM || null,
    cashFlowPerShareAnnual: metrics.metric.cashFlowPerShareAnnual || null,
    cashFlowPerShareQuarterly: metrics.metric.cashFlowPerShareQuarterly || null,
    revenueGrowth3Y: metrics.metric.revenueGrowth3Y || null,
    revenueGrowth5Y: metrics.metric.revenueGrowth5Y || null,
    revenueGrowthQuarterlyYoy: metrics.metric.revenueGrowthQuarterlyYoy || null,
    revenuePerShareAnnual: metrics.metric.revenuePerShareAnnual || null,
    revenuePerShareTTM: metrics.metric.revenuePerShareTTM || null,
    revenueShareGrowth5Y: metrics.metric.revenueShareGrowth5Y || null,
  };
  console.log("FINANCIALS SAVED:", financials);
  res.render(`stock/show`, { stock: profile, financials: financials });
});

module.exports = router;
