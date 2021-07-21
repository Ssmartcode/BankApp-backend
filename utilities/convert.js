const axios = require("axios");
const fx = require("money");
const convert = async (amount, fromCurrency, toCurrency) => {
  let data;
  try {
    data = await axios.get(process.env.OPEN_EXCHANGE_RATES_URL);
  } catch (err) {
    console.log(err);
  }
  fx.rates = data.data.rates;
  fx.base = data.data.base;

  const convertedAmount = fx(amount).from(fromCurrency).to(toCurrency);
  return Math.round((convertedAmount + Number.EPSILON) * 100) / 100;
};

module.exports = convert;
