/*
 * This script was literally copy pasted from this video: https://www.youtube.com/watch?v=85-A4rOJr5A&t=87s
 * I added some more stuff to it, but all the logic that makes this script nice, comes from that video.
 * The user account on Youtube: https://www.youtube.com/@theblackhat5473
 */


/**
 * @typedef {{
 *    help: Boolean,
 *    sleepTime: Number,
 *    _: String[],
 * }} MyFlags
 */

/**
 * @param {NS} ns
 * @returns
 */
export async function main(ns) {
    const flags = /** @type {MyFlags} */ (ns.flags([
        ["help", false],
        ["sleepTime", 1000],
    ]))

    if (flags._.length === 0 || flags.help) {
        ns.tprint("This script helps visualize the money and security information for a host.")
        ns.tprint(`Usage: run ${ns.getScriptName()} TARGETHOST --help <BOOLEAN> --sleeptime <TIME>`)
        ns.tprint("\t--help -> Shows this help screen.")
        ns.tprint("\t--sleepTime -> How long for the script to sleep between iterations. Defaults to 1000 equalling 1 second.")
        ns.tprint("\tExample:")
        ns.tprint(`\t> run ${ns.getScriptName()} joesguns`)
        return
    }

    // We prepare the logging.
    ns.ui.openTail()
    ns.disableLog('ALL')

    const hostName = flags._[0]
    while (true) {
        const serverInfo = ns.getServer(hostName)
        const moneyAvailable = serverInfo.moneyAvailable
        if (!moneyAvailable) return
        const maxMoney = serverInfo.moneyMax
        if (!maxMoney) return
        const currentSecurity = serverInfo.hackDifficulty
        if (!currentSecurity) return
        const minSecurity = serverInfo.minDifficulty
        if (!minSecurity) return

        ns.clearLog()
        ns.print(`${hostName}:`)
        ns.print(` $_______: ${ns.format.number(moneyAvailable, 3)} / ${ns.format.number(maxMoney, 3)} (${(moneyAvailable / maxMoney * 100).toFixed(2)})`)
        ns.print(` security: +${(currentSecurity - minSecurity).toFixed(2)}`)
        ns.print(` hack____: ${ns.format.time(ns.getHackTime(hostName))} (t=${Math.ceil(ns.hackAnalyzeThreads(hostName, moneyAvailable))})`)
        ns.print(` grow____: ${ns.format.time(ns.getGrowTime(hostName))} (t=${Math.ceil(ns.growthAnalyze(hostName, maxMoney / moneyAvailable))})`)
        ns.print(` weaken__: ${ns.format.time(ns.getWeakenTime(hostName))} (t=${Math.ceil((currentSecurity - minSecurity) * 20)})`)
        await ns.sleep(flags.sleepTime)
    }
}

/**
 *  Autocomplete only works for the first argument.
 */
export function autocomplete(data, args) {
    if (args.length === 1) {
        return data.servers
    }
    return []
}