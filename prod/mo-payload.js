/**
 * @typedef {{ targetHost: String, maxMoneyMultiplier: Number, securityThresholdAdd: Number }} MyFlags
 */

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
    /** @type {MyFlags} */
    const flags = /** @type {MyFlags} */ (ns.flags([
        ["targetHost", ""],
        ["maxMoneyMultiplier", .75],
        ["securityThresholdAdd", 5],
    ]));

    const moneyThresh = ns.getServerMaxMoney(flags.targetHost) * flags.maxMoneyMultiplier;
    const securityThresh = ns.getServerMinSecurityLevel(flags.targetHost) + flags.securityThresholdAdd;

    // Target host is a requirement. We simply exit with a usage message if one is not given.
    if (!flags.targetHost) {
        ns.tprint(LOG_LEVEL.ERROR + `Usage: run ${ns.getScriptName()} <TARGET HOST NAME> <MAX MONEY MULTIPLIER> <SECURITY THRESHOLD ADD>`);
        ns.tprint(LOG_LEVEL.ERROR + "\t<MAX MONEY MULTIPLIER>:");
        ns.tprint(LOG_LEVEL.ERROR + "\t  Optional and defaults to 0.75");
        ns.tprint(LOG_LEVEL.ERROR + "\t<SECURITY THRESHOLD ADD>:");
        ns.tprint(LOG_LEVEL.ERROR + "\t  Optional and defaults to 5");
        return;
    }

    while (true) {
        if (ns.getServerSecurityLevel(flags.targetHost) > securityThresh) {
            await ns.weaken(flags.targetHost);
        } else if (ns.getServerMoneyAvailable(flags.targetHost) < moneyThresh) {
            await ns.grow(flags.targetHost);
        } else {
            await ns.hack(flags.targetHost);
        }
    }
}