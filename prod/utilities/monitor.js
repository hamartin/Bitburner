/*
 * This script was literally copy pasted from this video: https://www.youtube.com/watch?v=85-A4rOJr5A&t=87s
 * I added some more stuff to it, but all the logic that makes this script nice, comes from that video.
 * The user account on Youtube: https://www.youtube.com/@theblackhat5473
 */

import { Server } from "../src/server"


/**
 * @typedef {{
 *    help: Boolean,
 *    sleepTime: Number,
 *    _: String[],
 * }} MyFlags
 */

/** @param {NS} ns */
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

    while (true) {
        const targetServer = new Server(ns, String(flags._[0]))
        const serverInfo = targetServer.getCurrentInfo()
        ns.clearLog()
        ns.print(`${targetServer.hostName}:`)
        ns.print(` $_______: ${ns.format.number(serverInfo.currentMoney, 3)} / ${ns.format.number(serverInfo.maxMoney, 3)} (${(serverInfo.currentMoney / serverInfo.maxMoney * 100).toFixed(2)})`)
        ns.print(` security: +${(serverInfo.currentSecurity - serverInfo.minSecurity).toFixed(2)}`)
        ns.print(` hack____: ${ns.format.time(ns.getHackTime(targetServer.hostName))} (t=${Math.ceil(ns.hackAnalyzeThreads(targetServer.hostName, serverInfo.currentMoney))})`)
        ns.print(` grow____: ${ns.format.time(ns.getGrowTime(targetServer.hostName))} (t=${Math.ceil(ns.growthAnalyze(targetServer.hostName, serverInfo.maxMoney / serverInfo.currentMoney))})`)
        ns.print(` weaken__: ${ns.format.time(ns.getWeakenTime(targetServer.hostName))} (t=${Math.ceil((serverInfo.currentSecurity - serverInfo.minSecurity) * 20)})`)
        await ns.sleep(flags.sleepTime)
    }
}

export function autocomplete(data, args) {
    return data.servers
}