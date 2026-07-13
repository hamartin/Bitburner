import { Logger } from "./logger"
import { Server } from "./server"

import { CRACKING_PROGRAMS } from "./constants"


// This is needed so that Visual Code can resolve the MyPlayer class
/**
 * @typedef {import("../src/player.js").MyPlayer} MyPlayer
 */

/**
 * Executes a script on a server
 * 
 * @param {NS} ns                  - Netscript context
 * @param {string} hostName        - Hostname for the host to run the script on
 * @param {string} targetHost      - Hostname for the host to attack
 * @param {string} virusFileName   - Filename of the "virus" to attack the target host with
 * @param {boolean} [maxOut=false] - Tells the function if only one thread is to be used or as many as possible
 */
export function executeScriptOnRemoteHost(ns, hostName, targetHost, virusFileName, maxOut = false) {
    if (!maxOut) {
        ns.exec(virusFileName, hostName, 1, targetHost)
    } else {
        const virusRamUsage = ns.getScriptRam(virusFileName)
        const maxRam = ns.getServerMaxRam(hostName)
        const threads = Math.floor(maxRam / virusRamUsage)
        ns.exec(virusFileName, hostName, threads, targetHost)
    }
}

/**
 * Returns a list of host names for hacking servers we have allready bought.
 * 
 * @param {NS} ns          - Netscript context
 * @param {Server[]} hosts - List of servers
 * @returns {Server[]}     - List of servers that can be used for hacking
 */
export function getHackingServerHostNames(ns, hosts) {
    const hackingServers = hosts.filter(host => ns.hasRootAccess(host.hostName) && host.stats.maxRam > 0)
    return hackingServers
}

/**
 * Gets a list of hosts wee can see on the network and compares the
 * hosts required hacking level to the players current hacking level.
 * If the player has a high enough hacking level to hack the host, the
 * host is added to a list and returned at the end of the execution.
 * 
 * @param {NS} ns          - Netscript context
 * @param {Server[]} hosts - A list of Server objects
 * @returns {Server[]}     - A list of Server objects which can be hacked
 */
export function getHostsThatCanBeHacked(ns, hosts) {
    const numberOfCrackingPrograms = getNumberOfCrackingPrograms(ns)

    const hostsThatCanBeHacked = []
    for (const host of hosts) {
        const numbOpenPortsRequired = host.stats.numOpenPortsRequired === undefined
            ? 0
            : host.stats.numOpenPortsRequired
        if (numbOpenPortsRequired > numberOfCrackingPrograms) {
            continue
        }
        hostsThatCanBeHacked.push(host)
    }
    return hostsThatCanBeHacked
}

/**
 * The function will start initially at the host which the script is
 * run on and scan all servers in the network, returning a list of
 * all servers found.
 * 
 * @param {NS} ns      - Netscript context
 * @returns {string[]} - A list of hostnames for hosts we can see on the network
 */
export function getNetworkHostNames(ns) {
    const visited = new Set([ns.getHostname(), ])
    const stack = [ns.getHostname(), ]

    while (stack.length > 0) {
        const server = stack.pop()
        for (const neighbor of ns.scan(server)) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor)
                stack.push(neighbor)
            }
        }
    }
    // Spreads the set into an array and returns it.
    return [...visited]
}

/**
 * Returns the number of cracking programs the player has on their home server
 * 
 * @param {NS} ns    - Netscript context
 * @returns {number} - The number of cracking programs we own
 */
export function getNumberOfCrackingPrograms(ns) {
    let numberOfCrackingPrograms = 0
    for (const programName of CRACKING_PROGRAMS) {
        if (ns.fileExists(programName, "home")) numberOfCrackingPrograms++
    }
    return numberOfCrackingPrograms
}

/**
 * Hacks the hosts given as an argument using the tools we currently have
 * available and nukes it to finish things of
 * 
 * @param {NS} ns          - Netscript context
 * @param {Server[]} hosts - List of Server objects to hack and nuke
 */
export function hackHosts(ns, hosts) {
    const logger = new Logger(ns)
    for (const host of hosts) {
        for (const programName of CRACKING_PROGRAMS) {
            if (!ns.fileExists(programName, "home")) {
                continue
            }
            switch (programName) {
                case "BruteSSH.exe":
                    ns.brutessh(host.hostName)
                    break
                case "FTPCrack.exe":
                    ns.ftpcrack(host.hostName)
                    break
                case "relaySMTP.exe":
                    ns.relaysmtp(host.hostName)
                    break
                case "HTTPWorm.exe":
                    ns.httpworm(host.hostName)
                    break
                case "SQLInject.exe":
                    ns.sqlinject(host.hostName)
                    break
            }
            logger.success(`Executed ${programName} on ${host.hostName}`)
        }
        ns.nuke(host.hostName)
        logger.success(`Nuked ${host}`)
    }
}

/**
 * Kills all the processes currently running on the attacking host and starts
 * the "virus" which will attack the target host
 * 
 * @param {NS} ns             - Netscript context
 * @param {Logger} ns         - The logging context
 * @param {string} host       - Hostname of the host to run the virus on
 * @param {string} targetHost - Hostname of the host to attack
 * @param {string} fileName   - Filename of the virus to attack with
 */
export function killAllProcessesAndRunScript(ns, logger, host, targetHost, fileName) {
    ns.killall(host)
    executeScriptOnRemoteHost(ns, host, targetHost, fileName, true)
    logger.info(`Killed all processes and started script ${fileName} on host ${host}.`)
}