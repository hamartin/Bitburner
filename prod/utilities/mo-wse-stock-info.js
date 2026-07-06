/**
 * @typedef {{
 *   help: Boolean,
 *   _: (String)[],
 * }} MyFlags
 */

/**
 * @typedef { AutocompleteData & { stockSymbols?: string[] }} StockAutocompleteData
 */

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
        ["help", false],
    ]));

    if (flags.help) {
        ns.tprint(LOG_LEVEL.INFO + `Usage: run ${ns.getScriptName} <SYMBOL>`);
        return
    }

    const symbol = String(ns.args[0]);
    const forecast = ns.stock.getForecast(symbol);
    const volatility = ns.stock.getVolatility(symbol);
    ns.tprint(`Stock: ${symbol}, Forecast: ${forecast}, Volatility: ${volatility}`);
}

/**
 * @param {AutocompleteData} data - context about the game, useful when autocompleting
 * @param {string[]} args - current arguments, not including "run script.js"
 * @returns {string[]} - the array of possible autocomplete options
 */
export function autocomplete(data, args) {
    /** @type {StockAutocompleteData} */
    const d = data;
    return d.stockSymbols ?? [
        "ECP","MGCP","BLD","FSIG","NTLK","OMTK","FLCM","CLRK","SYSC",
        "CTK","AERO","OMN","UNV","GPH","WDS","LXO","HLS","NVDA","TSLA",
    ];
}