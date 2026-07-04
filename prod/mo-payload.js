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

export async function main(ns) {
    const targetHost = ns.args[0];
    if (targetHost === undefined) {
        ns.tprint(LOG_LEVEL.ERROR + "Usage: run mo-payload.js <TARGET HOST NAME> <MAX MONEY MULTIPLIER> <SECURITY THRESHOLD ADD>");
        ns.tprint(LOG_LEVEL.ERROR + "\t<MAX MONEY MULTIPLIER>:");
        ns.tprint(LOG_LEVEL.ERROR + "\t  Optional and defaults to 0.75");
        ns.tprint(LOG_LEVEL.ERROR + "\t<SECURITY THRESHOLD ADD>:");
        ns.tprint(LOG_LEVEL.ERROR + "\t  Optional and defaults to 5");
        return;
    }
    let maxMoneyMultiplier = ns.args[1];
    if (maxMoneyMultiplier === undefined) maxMoneyMultiplier = 0.75;
    let securityThresholdAdd = ns.args[2];
    if (securityThresholdAdd === undefined) securityThresholdAdd = 5;
    const moneyThresh = ns.getServerMaxMoney(targetHost) * maxMoneyMultiplier;
    const securityThresh = ns.getServerMinSecurityLevel(targetHost) + securityThresholdAdd;

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