import { CloudServers } from "./src/cloudserver.js/index.js"
import { Logger } from "./src/logger"
import { MyPlayer } from "./src/player"
import { Payloads } from "./src/payloads"
import { Server } from "./src/server"

import {
    getHackingServerHostNames,
    getHostsThatCanBeHacked,
    getNetworkHostNames,
    hackHosts,
    killAllProcessesAndRunScript,
} from "./src/utility.js"


/**
 * @typedef {{
 *  serverNamePrefix: String,
 *  sleepTime: Number,
 *  _: (String | Number | Boolean)[],
 *  help: Boolean,
 * }} MyFlags
 */

/**
 * @param {NS} ns
 */
export async function main(ns) {
    const flags = /** @type {MyFlags} */ (ns.flags([
        ["sleepTime", 1000],
        ["help", false],
    ]))

    const player = new MyPlayer(ns)
    const payloads = new Payloads(ns)
    const logger = new Logger(ns)
    const cloudServers = new CloudServers(ns)

    if (flags.help) {
        ns.tprint(logger.ERROR + ` Usage: run ${ns.getScriptName()} --sleepTime <TIME> --help`)
        ns.tprint(logger.ERROR + "\t--sleepTime -> Optional and defaults to 1000 equalling 1 seoncd.")
        ns.tprint(logger.ERROR + "\t--help -> Optional and shows this help screen.")
        return
    }

    // We prepare the logging.
    ns.ui.openTail()
    ns.disableLog('ALL')
    ns.clearLog()

    /** @type {ServerSet} */
    const knownHackingServers = new Set([])
    /** @type {ServerSet} */
    const knownCloudServers = new Set([])
    /** @type {ServerRamMap} */
    const knownCloudServersRam = new Map()
    let previousTargetHost = null
    while (true) {
        // Get information about all the hosts we can see on the
        // network and its details. Note that the bought servers does
        // not show up in the scan. This is also true for all the Dark
        // Net servers.
        const hosts = getNetworkHostNames(ns).map(h => new Server(ns, h))

        // Hack all the hosts which has not been hacked yet and that we are able to hack.
        const hostsThatCanBeHacked = getHostsThatCanBeHacked(ns, hosts)
        const hostsNotHacked = hostsThatCanBeHacked.filter(host => !ns.hasRootAccess(host.hostName))
        if (hostsNotHacked.length > 0) hackHosts(ns, hostsNotHacked)

        // We find all the servers we can use to hack other servers with and
        // compare it to known servers. We extract new unknown servers and work
        // on those and also updating the known list of servers.
        const currentHackingServers = getHackingServerHostNames(ns, hosts)
        const newHackingServers = currentHackingServers.filter(host => !knownHackingServers.has(host.hostName))
        knownHackingServers.clear()
        for (const host of currentHackingServers) knownHackingServers.add(host.hostName)

        // Finds the best target and if the target host is something other than
        // previous best target, then we redploy and run the scripts against the
        // new host.
        let hackingServers = newHackingServers
        const targetHost = player.getBestHostToAttack()
        if (targetHost != previousTargetHost) {
            logger.info(`Changing target host from ${previousTargetHost} to ${targetHost}`)
            hackingServers = currentHackingServers
            previousTargetHost = targetHost
        }

        for (const host of hackingServers) {
            if (host.hostName == ns.getHostname()) continue
            await ns.scp(payloads.allFileNameFull, host.hostName)
            await ns.scp(payloads.hackFileNameFull, host.hostName)
            await ns.scp(payloads.growFileNameFull, host.hostName)
            await ns.scp(payloads.weakenFileNameFull, host.hostName)
            ns.print(logger.INFO + `Copied all payload files to ${targetHost}.`)
            killAllProcessesAndRunScript(ns, logger, host.hostName, targetHost, payloads.allFileNameFull)
        }

        // This part is identical to the hacking servers part above with the
        // exception of tracking the cloud servers RAM so that we can kill and
        // rerun scripts using all the host RAM.
        const currentCloudServers = cloudServers.getServerHostNames()
        const newCloudServers = currentCloudServers.filter(host => !knownCloudServers.has(host))
        knownCloudServers.clear()
        for (const host of currentCloudServers) knownCloudServers.add(host)

        for (const host of newCloudServers) {
            await ns.scp(payloads.allFileNameFull, host)
            await ns.scp(payloads.hackFileNameFull, host)
            await ns.scp(payloads.growFileNameFull, host)
            await ns.scp(payloads.weakenFileNameFull, host)
            logger.info(`Copied all payload files to ${targetHost}.`)
            killAllProcessesAndRunScript(ns, logger, host, targetHost, payloads.allFileNameFull)

            // New cloud server. We need to get the RAM size and store it to the
            // map for later use and comparison.
            knownCloudServersRam.set(host, ns.getServerMaxRam(host))
        }

        for (const currentCloudServer of currentCloudServers) {
            const currentRam = ns.getServerMaxRam(currentCloudServer)
            const previousRam = knownCloudServersRam.get(currentCloudServer)

            if (previousRam === undefined || previousRam !== currentRam) {
                knownCloudServersRam.set(currentCloudServer, currentRam)
                logger.info(`Cloudserver ${currentCloudServer} has increased its RAM. Restarting all scripts.`)
                killAllProcessesAndRunScript(ns, logger, currentCloudServer, targetHost, payloads.allFileNameFull)
            }
        }
        await ns.sleep(flags.sleepTime)
    }
}

/**
 * Function enables us to push tab when writing host names in the terminal and
 * we will get a list of servers to choose from
 * 
 * @param {AutocompleteData} data - Autocomplete context containing servers, scripts, txt files, and flags
 * @param {string[]} args         - Arguments typed so far in the terminal
 * @returns {string[]}            - List of autocomplete suggestions
 */
export function autocomplete(data, args) {
  return data.servers
}