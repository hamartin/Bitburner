// I realized when doing the stock trading script that if I need to kill the
// script, all the started trades will still be active until I start the script
// again and the script can take controll over the situation again.
//
// So I made this script to simply kill all active trades so that they just dont
// spend a lot of time there and possibly cost us/me a lot of fake money.

/** @param {NS} ns */
export async function main(ns) {
    if (!ns.stock.has4SDataTixApi()) {
        ns.tprint(`WARN: You need to buy 4S data TIX API access before using this script.`)
        ns.exit()
    }

    const symbols = ns.stock.getSymbols()
    for (const symbol of symbols) {
        const position = ns.stock.getPosition(symbol)
        const longShares = position[0]
        const shortShares = position[2]

        if (longShares > 0) {
            ns.stock.sellStock(symbol, longShares)
            ns.tprint(`INFO: Sold LONG ${symbol} (${longShares} shares)`)
        }

        if (shortShares > 0) {
            ns.stock.buyShort(symbol, shortShares)
            ns.tprint(`INFO: Covered SHORT ${symbol} (${shortShares} shares)`)
        }
    }

    ns.tprint("INFO: All stock positions closed.")
}
