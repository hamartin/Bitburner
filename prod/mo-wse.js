import { tradeStocks } from "./src/stocks";


/** @typedef {{ sleepTime: number }} MyFlags */

/** @param {NS} ns */
export async function main(ns) {
    const flags = /** @type {MyFlags} */ (ns.flags([
        ["sleepTime", 10000],
    ]));

    // Disable all logging from Netscript and open a tail window.
    ns.ui.openTail();
    ns.disableLog("ALL");
    ns.clearLog();

    const symbols = ns.stock.getSymbols();
    while (true) {
        tradeStocks(ns, symbols);
        await ns.sleep(flags.sleepTime);
    }
}