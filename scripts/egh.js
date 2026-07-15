/**
 * @typedef {{ 
 *  maxMoneyMultiplier: Number,
 *  securityThresholdAdd: Number,
 *  _: String[],
 *  help: Boolean,
 * }} MyFlags
 */

/**
 * @param {NS} ns            - Netscript context.
 * @property {string[]} _[0] - Positional argument (same as ns.args[0]). The host name of the host to run the payload on.
 * @returns 
 */
export async function main(ns) {
    const flags = /** @type {MyFlags} */ (ns.flags([
        ["maxMoneyMultiplier", .75],
        ["securityThresholdAdd", 5],
        ["help", false],
    ]))

    // Target host is a requirement. We simply exit with a usage message if one is not given.
    if (flags._.length === 0 || flags.help) {
        ns.tprint("INFO: " + `Usage: run ${ns.getScriptName()} <TARGET HOSTNAME> --maxMoneyMultiplier <MULTIPLIER> --securityThresholdAdd <THRESHOLD ADD>`)
        ns.tprint("INFO: " + "\t<TARGET HOSTNAME> -> Required.")
        ns.tprint("INFO: " + "\t--maxMoneyMultiplier -> Optional and defaults to .75")
        ns.tprint("INFO: " + "\t--securityTresholdAdd -> Optional and defaults to 5")
        return
    }
    const targetHost = flags._[0]

    const moneyThresh = ns.getServerMaxMoney(targetHost) * flags.maxMoneyMultiplier
    const securityThresh = ns.getServerMinSecurityLevel(targetHost) + flags.securityThresholdAdd

    while (true) {
        if (ns.getServerSecurityLevel(targetHost) > securityThresh) {
            await ns.weaken(targetHost)
        } else if (ns.getServerMoneyAvailable(targetHost) < moneyThresh) {
            await ns.grow(targetHost)
        } else {
            await ns.hack(targetHost)
        }
    }
}