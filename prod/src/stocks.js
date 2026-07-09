import { Logger } from "./classes/logger.js";

import {
    COMMISSION_FEE,
    DEF_CLOSE_LONG_THRESHOLD,
    DEF_OPEN_LONG_THRESHOLD,
} from "./constants.js";


/**
 * Trade stocks on World Stock Exchange.
 * Currently does not support shorting.
 * 
 * @param {NS} ns                                                - Netscript context
 * @param {string[]} symbols                                     - The symbols which the function will trade in
 * @param {number} [openLongThreshold=DEF_OPEN_LONG_THRESHOLD]   - The forecast threshold to get past to go long on stock
 * @param {number} [closeLongThreshold=DEF_CLOSE_LONG_THRESHOLD] - The forecast threshold to get past to close open longs
 */
export function tradeStocks(ns, symbols, openLongThreshold = DEF_OPEN_LONG_THRESHOLD, closeLongThreshold = DEF_CLOSE_LONG_THRESHOLD) {
    const logger = new Logger(ns);

    for (const symbol of symbols) {
        const forecast = ns.stock.getForecast(symbol);
        const price = ns.stock.getPrice(symbol);
        const maxShares = ns.stock.getMaxShares(symbol);
        const position = ns.stock.getPosition(symbol);
        // We split the position into the parts we need.
        const myShares = position[0];
        const avgMySharePrice = position[1];
        // This only makes sense for "home" as we cannot spend others money.
        const availableCash = ns.getServerMoneyAvailable("home");
        const availableShares = maxShares - myShares;

        // The forecast tells us to spend money on the stock.
        if (forecast >= openLongThreshold && availableShares > 0) {
            const cost = availableShares * price;
            if (cost < availableCash) {
                const avgOpenPrice = ns.stock.buyStock(symbol, availableShares);
                logger.write(logger.INFO, `Bought ${availableShares} shares for ${ns.format.number(avgOpenPrice, 2)} per share in ${symbol}`);
            }
        // The forecast tells us to sell our inventory for the stock.
        } else if (forecast <= closeLongThreshold && myShares > 0) {
            const avgClosePrice = ns.stock.sellStock(symbol, myShares);
            const profit = (avgClosePrice - avgMySharePrice) * myShares - COMMISSION_FEE;
            if (profit > 0) {
                logger.write(logger.SUCCESS, `Closed ${myShares} shares in ${symbol} with a profit of ${ns.format.number(profit, 2)}`);
            } else {
                logger.write(logger.WARN, `Closed ${myShares} shares in ${symbol} with a loss of ${ns.format.number(profit, 2)}`);
            }
        }
    }
}