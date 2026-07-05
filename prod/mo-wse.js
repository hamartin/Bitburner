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

// I use this as an "enum" for logging purposes so that I can get
// colored output.
const LOG_LEVEL = Object.freeze({
    "ERROR": "ERROR: ",
    "SUCCESS": "SUCCESS: ",
    "INFO": "INFO: ", 
    "WARN": "WARN: ",
    "DEBUG": "DEBUG: ",
});

export async function main(ns) {
    ns.tprint(LOG_LEVEL.INFO + "Usage: run mo-wse.js <SHORTING ENABLED> <SLEEP TIME> <OPEN LONG THRESHOLD> <CLOSE LONG THRESHOLD> <OPEN SHORT THRESHOLD> <CLOSE SHORT THRESHOLD>");
    ns.tprint(LOG_LEVEL.INFO + "\t<SHORTING ENABLED>:");
    ns.tprint(LOG_LEVEL.INFO + "\t  Optional and defaults to false.");
    ns.tprint(LOG_LEVEL.INFO + "\t<SLEEP TIME>:");
    ns.tprint(LOG_LEVEL.INFO + "\t  Optional and defaults to 1000 which is a second.");
    ns.tprint(LOG_LEVEL.INFO + "\t<OPEN LONG THRESHOLD>:");
    ns.tprint(LOG_LEVEL.INFO + "\t  Optional and defaults to .55 which is a strong buying forecast.");
    ns.tprint(LOG_LEVEL.INFO + "\t<CLOSE LONG THRESHOLD>:");
    ns.tprint(LOG_LEVEL.INFO + "\t  Optional and defaults to .50.");
    ns.tprint(LOG_LEVEL.INFO + "\t<OPEN SHORT THRESHOLD>:");
    ns.tprint(LOG_LEVEL.INFO + "\t  Optional and defaults to .45 which is a strong shorting forecast.");
    ns.tprint(LOG_LEVEL.INFO + "\t<CLOSE SHORT THRESHOLD>:");
    ns.tprint(LOG_LEVEL.INFO + "\t  Optional and defaults to .50.");

    const shortingEnabled = ns.args[0] === "true";
    let sleepTime = ns.args[1];
    let openLongThreshold = ns.args[2];
    let closeLongThreshold = ns.args[3];
    let openShortThreshold = ns.args[4];
    let closeShortThreshold = ns.args[5];
    if (sleepTime === undefined) sleepTime = 1000;
    if (openLongThreshold === undefined) openLongThreshold = .55;
    if (closeLongThreshold === undefined) closeLongThreshold = .50;
    if (openShortThreshold === undefined) openShortThreshold = .45;
    if (closeShortThreshold === undefined) closeShortThreshold = .50;

    const symbols = ns.stock.getSymbols();
    while (true) {
        // For every symbol/stock in the system, we get the details
        // about the stock and our inventory.
        for (const symbol of symbols) {
            const forecast = ns.stock.getForecast(symbol);
            const price = ns.stock.getPrice(symbol);
            const position = ns.stock.getPosition(symbol);
            // These are the long shares for sale.
            const longShares = position[0];
            const longAveragePrice = position[1];
            const shortShares = position[2];
            const shortAveragePrice = position[3];

            const maxShares = ns.stock.getMaxShares(symbol);

            // Woohoo, forecast says buy the symbol/stock.
            if (forecast > openLongThreshold) {
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
                        ns.tprint(LOG_LEVEL.SUCCESS + `Bought (LONG) ${shares} ${symbol} @ ${price}`);
                    }
                }
            } 
            
            // Shit, the forecast tells us we should close our longs.
            if (forecast < closeLongThreshold && longShares > 0) {
                ns.stock.sellStock(symbol, longShares);
                const profit = (price - longAveragePrice) * longShares;
                let text = "profit";
                if (profit < 0) text = "loss";
                ns.tprint(LOG_LEVEL.SUCCESS + `Sold (LONG) ${longShares} ${symbol} for a ${text} of ${ns.format.number(profit)}`);
            }

            // Woohoo, forecast says short the symbol/stock.
            if (shortingEnabled && forecast < openShortThreshold) {
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
                        ns.tprint(LOG_LEVEL.SUCCESS + `Bought (SHORTED) ${shares} ${symbol} @ ${price}`);
                    }
                }
            }

            // Shit, the forecast tells us we should close/cover our shorted symbols/stocks.
            if (shortingEnabled && forecast > closeShortThreshold && shortShares > 0) {
                // Shorting broke my head for a while. When shorting,
                // you borrow shares, sell them immediately, hope the
                // price goes down, buy them back later and return the
                // stock. Thats why we are buying the short when
                // closing/cover the initial trade.
                ns.stock.buyShort(symbol, shortShares);
                const profit = (shortAveragePrice - price) * shortShares;
                let text = "profit";
                if (profit < 0) text = "loss";
                ns.tprint(LOG_LEVEL.SUCCESS + `Sold (SHORTED)  ${shortShares} ${symbol} for a ${text} of ${ns.format.number(profit)}`);
            }
        }
        await ns.sleep(sleepTime);
    }
}