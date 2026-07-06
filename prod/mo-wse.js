// From what I have read it seems that the forecast is simply a number from 0 to
// 1, which tells us the probability that the stock will go down or up for each
// "tick".
//
// So a forecast of for example .60 means the stock will go up 60% of the time.
//    a forecast of for example .30 means the stock will go down 70% of the time.
//
// The game has some weird inertia thing going on, meaning that it takes a while
// to turn etc, so safe values seem to be .45 for short and .55 for long and .50
// for selling the long/shorts. It also seems that a forecast of less that .45
// rare, so I haven't seen a single short in the time I have played.

// TODO: The game will refuse to go long on a symbol if you are allready shorted
// and vice versa. So we need to add logic to get rid of the trade in opposite
// direction if one exist allready.

/**
 * @typedef {{
 *  shortingEnabled: Boolean,
 *  sleepTime: Number,
 *  openLongThreshold: Number,
 *  closeLongThreshold: Number,
 *  openShortThreshold: Number,
 *  closeShortThreshold: Number,
 *  volatilityThreshold: Number,
 *  help: Boolean
 * }} MyFlags
 * 
 * @typedef {"ERROR: " | "SUCCESS: " | "INFO: " | "WARN: " | "DEBUG: "} LogLevel
 */

// I use this as an "enum" for logging purposes so that I can get
// colored output.
const LOG_LEVEL = Object.freeze({
    "ERROR": "ERROR: ",
    "SUCCESS": "SUCCESS: ",
    "INFO": "INFO: ", 
    "WARN": "WARN: ",
    "DEBUG": "DEBUG: ",
});

/**
 * @param {NS} ns 
 * @returns
 */
export async function main(ns) {
    /** @type {MyFlags} */
    const flags = /** @type {MyFlags} */ (ns.flags([
        ["shortingEnabled", false],
        ["sleepTime", 30000],
        ["openLongThreshold", .55],
        ["closeLongThreshold", .50],
        ["openShortThreshold", .45],
        ["closeShortThreshold", .50],
        ["volatilityThreshold", .02],
        ["help", false],
    ]));

    if (flags.help) {
        ns.tprint(LOG_LEVEL.INFO + `Usage: run ${ns.getScriptName()} --shortingEnabled <BOOLEAN> --sleepTime <TIME> --openLongThreashold <THRESHOLD> --closeLongThreashold <THRESHOLD> --openShortThreshold <THRESHOLD> --closeShortThreshold <THRESHOLD> --volatilityThreshold <THRESHOLD>`);
        ns.tprint(LOG_LEVEL.INFO + "\t--shortingEnabled -> Optional and defaults to false.");
        ns.tprint(LOG_LEVEL.INFO + "\t--sleepTime -> Optional and defaults to 1000 equalling 1 second.");
        ns.tprint(LOG_LEVEL.INFO + "\t  Note that proces change every 200ms, but thresholds and volatility change every ~300-400 seonds.");
        ns.tprint(LOG_LEVEL.INFO + "\t--openLongThreshold -> Optional and defaults to .55 which is a strong long forecast.");
        ns.tprint(LOG_LEVEL.INFO + "\t--closeLongThreshold -> Optional and defaults to .50.");
        ns.tprint(LOG_LEVEL.INFO + "\t--openShortThreshold -> Optional and defaults to .45 which is a strong short forecast.");
        ns.tprint(LOG_LEVEL.INFO + "\t--closeShortThreshold -> Optional and defaults to .50.");
        ns.tprint(LOG_LEVEL.INFO + "\t--volatilityThreshold -> Optional and defaults to .02.");
        ns.tprint(LOG_LEVEL.INFO + "\t  Note that volatility tells you how fast a stock is moving in a direction.");
        ns.tprint(LOG_LEVEL.INFO + "\t  .02 (2%, moving fast), .015 (1.5% moving medium paced), .01 (1% slow moving)");
        ns.tprint(LOG_LEVEL.INFO + "\t  Lowering or ignoring volatility in general does not reduce your proffitability, but");
        ns.tprint(LOG_LEVEL.INFO + "\t  it puts more of your money in dead stock which is bad if you want to grow fast.");
        ns.tprint(LOG_LEVEL.INFO + "\t  Only time this can hurt you is if you earn less than what it cost to trade the stock.");
        return;
    }

    // We prepare the logging.
    ns.ui.openTail();
    ns.disableLog('ALL');
    ns.clearLog();

    ns.print(LOG_LEVEL.INFO + "Starting World Stock Exchange trader.")
    ns.print(LOG_LEVEL.INFO);

    const symbols = ns.stock.getSymbols();
    while (true) {
        // For every symbol/stock in the system, we get the details
        // about the stock and our inventory.
        for (const symbol of symbols) {
            const forecast = ns.stock.getForecast(symbol);
            const volatility = ns.stock.getVolatility(symbol);
            const price = ns.stock.getPrice(symbol);
            const position = ns.stock.getPosition(symbol);
            // These are the long shares for sale.
            const longShares = position[0];
            const longAveragePrice = position[1];
            const shortShares = position[2];
            const shortAveragePrice = position[3];

            const maxShares = ns.stock.getMaxShares(symbol);

            // Woohoo, forecast says buy the symbol/stock.
            // Buy when the forecast is good and the stock is moving fast.
            if (forecast >= flags.openLongThreshold && volatility >= flags.volatilityThreshold) {
                const shares = maxShares - longShares;

                if (shares > 0) {
                    const cost = shares * price;
                    if (ns.getServerMoneyAvailable(ns.getHostname()) > cost) {
                        // Before we can go long, we have to cover any
                        // shorts we have on the same symbol/stock.
                        if(shortShares > 0) {
                            ns.stock.buyShort(symbol, shortShares);
                        }
                        ns.stock.buyStock(symbol, shares);
                        ns.print(
                            LOG_LEVEL.SUCCESS +
                            `Bought (LONG) ${shares} ${symbol} @ ${
                                ns.format.number(price)
                            }`
                        );
                    }
                }
            } 
            
            // Shit, the forecast tells us we should close our longs.
            // The idea here is that either the forecast is telling us which
            // direction the stock is going in or when volatility is going down.
            // The reasons for selling when volatility goes does is that it
            // simply means there is not a lot of movement at all.
            if ((forecast < flags.closeLongThreshold || volatility < flags.volatilityThreshold) && longShares > 0) {
                ns.stock.sellStock(symbol, longShares);
                const profit = (price - longAveragePrice) * longShares;
                let text = "profit";
                /** @type {LogLevel} */
                let level = LOG_LEVEL.SUCCESS
                if (profit < 0) {
                    text = "loss";
                    level = LOG_LEVEL.WARN;
                }
                ns.print(
                    level +
                    `Sold (LONG) ${longShares} ${symbol} for a ${text} of ${
                        ns.format.number(profit)
                    }`
                );
            }

            // Woohoo, forecast says short the symbol/stock.
            // Short when forecast is telling us its moving in the right diretion and its moving fast in one direction.
            if (flags.shortingEnabled && forecast <= flags.openShortThreshold && volatility >= flags.volatilityThreshold) {
                const shares = maxShares - shortShares;

                if (shares > 0) {
                    const cost = shares * price;
                    if (ns.getServerMoneyAvailable(ns.getHostname()) > cost) {
                        // Shorting broke my head for a while. When shorting,
                        // you borrow shares, sell them immediately, hope the
                        // price goes down, buy them back later and return the
                        // stock. Thats why we are selling the short when
                        // initiating the trade.
                        // Also, we need to get rid of any long trades
                        // on the same symbol/stock, before going short.
                        if (longShares > 0) {
                            ns.stock.sellStock(symbol, longShares);
                        }
                        ns.stock.sellShort(symbol, shares);
                        ns.print(
                            LOG_LEVEL.SUCCESS +
                            `Bought (SHORTED) ${shares} ${symbol} @ ${
                                ns.format.number(price)
                            }`
                        );
                    }
                }
            }

            // Shit, the forecast tells us we should close/cover our shorted symbols/stocks.
            if (flags.shortingEnabled && (forecast > flags.closeShortThreshold || volatility < flags.volatilityThreshold) && shortShares > 0) {
                // Shorting broke my head for a while. When shorting,
                // you borrow shares, sell them immediately, hope the
                // price goes down, buy them back later and return the
                // stock. Thats why we are buying the short when
                // closing/cover the initial trade.
                ns.stock.buyShort(symbol, shortShares);
                const profit = (shortAveragePrice - price) * shortShares;
                let text = "profit";
                /** @type {LogLevel} */
                let level = LOG_LEVEL.SUCCESS
                if (profit < 0) {
                    text = "loss";
                    level = LOG_LEVEL.WARN
                }
                ns.print(
                    level +
                    `Sold (SHORTED)  ${shortShares} ${symbol} for a ${text} of ${
                        ns.format.number(profit)
                    }`
                );
            }
        }
        await ns.sleep(flags.sleepTime);
    }
}