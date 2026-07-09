import { Logger } from "./logger";


/**
 * A class to help with stock trading in the game.
 * 
 * @example const trader = new StockTrader(ns);
 */
export class StockTrader {
    /**
     * @param {NS} ns - Netscript context
     * @example const trader = new StockTrader(ns);
     */
    constructor (ns) {
        this.ns = ns;
        this.commissionFee = 100000;
        this.openLongThreshold = .55;
        this.closeLongThreshold = .50;

        this.logger = new Logger(ns);
    }

    /**
     * Trade stocks on World Stock Exchange.
     * Currently does not support shorting.
     * 
     * @param {number} [openLongThreshold=.55]  - The forecast threshold to get past to go long on stock
     * @param {number} [closeLongThreshold=.50] - The forecast threshold to get past to close open longs
     */
    trade(openLongThreshold = .55, closeLongThreshold = .50) {
        const symbols = this.ns.stock.getSymbols();
        for (const symbol of symbols) {
            const forecast = this.ns.stock.getForecast(symbol);
            const price = this.ns.stock.getPrice(symbol);
            const maxShares = this.ns.stock.getMaxShares(symbol);
            const position = this.ns.stock.getPosition(symbol);
            // We split the position into the parts we need.
            const myShares = position[0];
            const avgMySharePrice = position[1];
            // This only makes sense for "home" as we cannot spend others money.
            const availableCash = this.ns.getServerMoneyAvailable("home");
            const availableShares = maxShares - myShares;

            // The forecast tells us to spend money on the stock.
            if (forecast >= openLongThreshold && availableShares > 0) {
                const cost = availableShares * price;
                if (cost < availableCash) {
                    const avgOpenPrice = this.ns.stock.buyStock(symbol, availableShares);
                    this.logger.write(this.logger.INFO, `Bought ${availableShares} shares for ${this.ns.format.number(avgOpenPrice, 2)} per share in ${symbol}`);
                }
            // The forecast tells us to sell our inventory for the stock.
            } else if (forecast <= closeLongThreshold && myShares > 0) {
                const avgClosePrice = this.ns.stock.sellStock(symbol, myShares);
                const profit = (avgClosePrice - avgMySharePrice) * myShares - this.commissionFee;
                if (profit > 0) {
                    this.logger.write(this.logger.SUCCESS, `Closed ${myShares} shares in ${symbol} with a profit of ${this.ns.format.number(profit, 2)}`);
                } else {
                    this.logger.write(this.logger.WARN, `Closed ${myShares} shares in ${symbol} with a loss of ${this.ns.format.number(profit, 2)}`);
                }
            }
        }
    }
}