//
// Global constants
//

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
 * 
 * @param {NS} ns 
 * @returns 
 */
export async function main(ns) {
    const targetHost = ns.args[0] ? String(ns.args[0]) : "";
    const maxMoneyMultiplier = ns.args[1] ? Number(ns.args[1]) : .75;
    const securityThresholdAdd = ns.args[2] ? Number(ns.args[2]) : 5;
    const moneyThresh = ns.getServerMaxMoney(targetHost) * maxMoneyMultiplier;
    const securityThresh = ns.getServerMinSecurityLevel(targetHost) + securityThresholdAdd;

    // Target host is a requirement. We simply exit with a usage message if one is not given.
    if (!targetHost) {
        ns.tprint(LOG_LEVEL.ERROR + "Usage: run mo-payload.js <TARGET HOST NAME> <MAX MONEY MULTIPLIER> <SECURITY THRESHOLD ADD>");
        ns.tprint(LOG_LEVEL.ERROR + "\t<MAX MONEY MULTIPLIER>:");
        ns.tprint(LOG_LEVEL.ERROR + "\t  Optional and defaults to 0.75");
        ns.tprint(LOG_LEVEL.ERROR + "\t<SECURITY THRESHOLD ADD>:");
        ns.tprint(LOG_LEVEL.ERROR + "\t  Optional and defaults to 5");
        return;
    }

    while (true) {
        if (ns.getServerSecurityLevel(targetHost) > securityThresh) {
            await ns.weaken(targetHost);
        } else if (ns.getServerMoneyAvailable(targetHost) < moneyThresh) {
            await ns.grow(targetHost);
        } else {
            await ns.hack(targetHost);
        }
    }
}