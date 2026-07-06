/**
 * @typedef {{ 
 *  maxMoneyMultiplier: Number,
 *  securityThresholdAdd: Number,
 *  _: (String | Number | Boolean)[]
 * }} MyFlags
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
        ["maxMoneyMultiplier", .75],
        ["securityThresholdAdd", 5],
    ]));
    const targetHost = String(flags._[0]);

    // Target host is a requirement. We simply exit with a usage message if one is not given.
    if (!targetHost) {
        ns.tprint(LOG_LEVEL.ERROR + `Usage: run ${ns.getScriptName()} <TARGET HOSTNAME> --maxMoneyMultiplier <MULTIPLIER> --securityThresholdAdd <THRESHOLD ADD>`);
        ns.tprint(LOG_LEVEL.ERROR + "\t<TARGET HOSTNAME> -> Required.");
        ns.tprint(LOG_LEVEL.ERROR + "\t--maxMoneyMultiplier -> Optional and defaults to .75");
        ns.tprint(LOG_LEVEL.ERROR + "\t--securityTresholdAdd -> Optional and defaults to 5");
        return;
    }

    const moneyThresh = ns.getServerMaxMoney(targetHost) * flags.maxMoneyMultiplier;
    const securityThresh = ns.getServerMinSecurityLevel(targetHost) + flags.securityThresholdAdd;

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