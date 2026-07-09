import { CRACKING_PROGRAMS } from "./constants";


// This is needed so that Visual Code can resolve the Logger class
/**
 * @typedef {import("../src/classes/logger.js").Logger} Logger
 */

// This is needed so that Visual Code can resolve the MyPlayer class
/**
 * @typedef {import("../src/classes/player.js").MyPlayer} MyPlayer
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
        ns.exec(virusFileName, hostName, 1, targetHost);
    } else {
        const virusRamUsage = ns.getScriptRam(virusFileName);
        const maxRam = ns.getServerMaxRam(hostName);
        const threads = Math.floor(maxRam / virusRamUsage);
        ns.exec(virusFileName, hostName, threads, targetHost);
    }
}

/**
 * Returns a list of host names for hacking servers we have allready bought.
 * 
 * @param {NS} ns          - Netscript context
 * @param {string[]} hosts - List of servers
 * @returns {string[]}     - List of servers that can be used for hacking
 */
export function getHackingServerHostNames(ns, hosts) {
    const hackingServers = hosts.filter(host => ns.hasRootAccess(host) && ns.getServerMaxRam(host) > 0);
    return hackingServers;
}

/**
 * Gets a list of hosts wee can see on the network and compares the
 * hosts required hacking level to the players current hacking level.
 * If the player has a high enough hacking level to hack the host, the
 * host is added to a list and returned at the end of the execution.
 * 
 * @param {NS} ns                     - Netscript context
 * @param {Map<string, object>} hosts - A map with hostnames as key and details as values
 * @returns {string[]}                - A list of strings where each index is a hostname for a host that can be hacked
 */
export function getHostsThatCanBeHacked(ns, hosts) {
    const playerHackingLevel = ns.getHackingLevel();
    const numberOfCrackingPrograms = getNumberOfCrackingPrograms(ns);

    const hostsThatCanBeHacked = [];
    for (const [host, details] of hosts) {
        if (details.numOpenPortsRequired > numberOfCrackingPrograms) {
            continue;
        }
        hostsThatCanBeHacked.push(host);
    }
    return hostsThatCanBeHacked;
}

/**
 * The function will return a map of all servers in the network, with
 * the server name as the key and the server details as the value.
 * 
 * @param {NS} ns                 - Netscript context
 * @param {string[]} hostNames    - A list of hostnames to return details for
 * @returns {Map<string, Object>} - A map with hostnames as keys and details as values
 */
export function getNetworkHostsDetails(ns, hostNames) {
    const hosts = new Map();
    for (const host of hostNames) {
        const details = ns.getServer(host);
        hosts.set(host, details);
    }
    return hosts;
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
    const visited = new Set([ns.getHostname(), ]);
    const stack = [ns.getHostname(), ];

    while (stack.length > 0) {
        const server = stack.pop();
        for (const neighbor of ns.scan(server)) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                stack.push(neighbor);
            }
        }
    }
    // Spreads the set into an array and returns it.
    return [...visited];
}

/**
 * Returns the number of cracking programs the player has on their home server
 * 
 * @param {NS} ns    - Netscript context
 * @returns {number} - The number of cracking programs we own
 */
export function getNumberOfCrackingPrograms(ns) {
    let numberOfCrackingPrograms = 0;
    for (const programName of CRACKING_PROGRAMS) {
        if (ns.fileExists(programName, "home")) numberOfCrackingPrograms++;
    }
    return numberOfCrackingPrograms;
}

/**
 * Hacks the hosts given as an argument using the tools we currently have
 * available and nukes it to finish things of
 * 
 * @param {NS} ns          - Netscript context
 * @param {Logger} logger  - The logging context
 * @param {string[]} hosts - List of hostnames to hack and nuke
 */
export function hackHosts(ns, logger, hosts) {
    for (const host of hosts) {
        for (const programName of CRACKING_PROGRAMS) {
            if (!ns.fileExists(programName, "home")) {
                continue;
            }
            switch (programName) {
                case "BruteSSH.exe":
                    ns.brutessh(host);
                    break;
                case "FTPCrack.exe":
                    ns.ftpcrack(host);
                    break;
                case "relaySMTP.exe":
                    ns.relaysmtp(host);
                    break;
                case "HTTPWorm.exe":
                    ns.httpworm(host);
                    break;
                case "SQLInject.exe":
                    ns.sqlinject(host);
                    break;
            }
            logger.write(logger.SUCCESS, `Executed ${programName} on ${host}`);
        }
        ns.nuke(host);
        logger.write(logger.SUCCESS, `Nuked ${host}`);
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
    ns.killall(host);
    executeScriptOnRemoteHost(ns, host, targetHost, fileName, true);
    logger.write(logger.INFO, `Killed all processes and started script ${fileName} on host ${host}.`);
}