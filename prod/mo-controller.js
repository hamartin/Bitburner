import {
    CLOUDSERVER_NAME_PREFIX,
    CRACKING_PROGRAMS,
    LOG_LEVEL,
    PAYLOADS,
} from "./src/constants.js";
import { LogMessage } from "./src/logging.js";

/**
 * @typedef {{
 *  serverNamePrefix: String,
 *  sleepTime: Number,
 *  _: (String | Number | Boolean)[],
 *  help: Boolean
 * }} MyFlags
 */

/**
 * @typedef {Set<String>} ServerSet
 */

/**
 * @typedef {Map<String, Number>} ServerRamMap
 */

/**
 * Executes a script on a server, maxing out the number of threads.
 * 
 * @param {NS} ns                - Netscript context
 * @param {string} hostName      - Hostname for the host to run the script on
 * @param {string} targetHost    - Hostname for the host to attack
 * @param {string} virusFileName - Filename of the "virus" to attack the target host with
 */
function executeScriptOnRemoteHost(ns, hostName, targetHost, virusFileName) {
    const virusRamUsage = ns.getScriptRam(virusFileName);
    const maxRam = ns.getServerMaxRam(hostName);
    const threads = Math.floor(maxRam / virusRamUsage);
    ns.exec(virusFileName, hostName, threads, targetHost);
}

/**
 * Returns a list of host names for hacking servers we have allready bought.
 * 
 * @param {NS} ns          - Netscript context
 * @param {string[]} hosts - List of servers
 * @returns {string[]}     - List of servers that can be used for hacking
 */
function getHackingServerHostNames(ns, hosts) {
    const hackingServers = hosts.filter(host => ns.hasRootAccess(host) && ns.getServerMaxRam(host) > 0);
    return hackingServers;
}

/**
 * This bit of the code handles getting all the bought servers
 * which does not show in the normal scans.
 * 
 * @param {NS} ns      - Netscript context
 * @returns {String[]} - List of cloudserver names we have bought
 */
function getCloudServerHostNames(ns) {
    const hostNames = [];

    let i = 0;
    while (ns.serverExists(CLOUDSERVER_NAME_PREFIX + i)) {
        hostNames.push(CLOUDSERVER_NAME_PREFIX + i);
        i++;
    }
    return hostNames;
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
function getHostsThatCanBeHacked(ns, hosts) {
    const playerHackingLevel = ns.getHackingLevel();
    const numberOfCrackingPrograms = getNumberOfCrackingPrograms(ns);

    const hostsThatCanBeHacked = [];
    for (const [host, details] of hosts) {
        if (playerHackingLevel < details.requiredHackingSkill) {
            continue;
        } else if (details.numOpenPortsRequired > numberOfCrackingPrograms) {
            continue;
        }
        hostsThatCanBeHacked.push(host);
    }
    return hostsThatCanBeHacked;
}

/**
 * The function will start initially at the host which the script is
 * run on and scan all servers in the network, returning a list of
 * all servers found.
 * 
 * @param {NS} ns      - Netscript context
 * @returns {string[]} - A list of hostnames for hosts we can see on the network
 */
function getNetworkHostNames(ns) {
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
 * The function will return a map of all servers in the network, with
 * the server name as the key and the server details as the value.
 * 
 * @param {NS} ns                 - Netscript context
 * @param {string[]} hostNames    - A list of hostnames to return details for
 * @returns {Map<string, Object>} - A map with hostnames as keys and details as values
 */
function getNetworkHostsDetails(ns, hostNames) {
    const hosts = new Map();
    for (const host of hostNames) {
        const details = ns.getServer(host);
        hosts.set(host, details);
    }
    return hosts;
}

/**
 * Returns the number of cracking programs the player has on their home server
 * 
 * @param {NS} ns    - Netscript context
 * @returns {number} - The number of cracking programs we own
 */
function getNumberOfCrackingPrograms(ns) {
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
 * @param {string[]} hosts - List of hostnames to hack and nuke
 */
export function hackHosts(ns, hosts) {
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
            LogMessage(ns, LOG_LEVEL.SUCCESS, `Executed ${programName} on ${host}`);
        }
        ns.nuke(host);
        LogMessage(ns, LOG_LEVEL.SUCCESS, `Nuked ${host}`);
    }
}

/** @param {NS} ns */
export async function main(ns) {
    /** @type {MyFlags} */
    const flags = /** @type {MyFlags} */ (ns.flags([
        ["sleepTime", 10000],
        ["help", false],
    ]));
    const targetHost = String(flags._[0]);

    // Target host is a requirement. If one is not given, we print a usage message and quit.
    if (targetHost == "undefined" || flags.help) {
        ns.tprint(LOG_LEVEL.ERROR + `Usage: run ${ns.getScriptName()} <TARGET HOST> --sleepTime <TIME>`);
        ns.tprint(LOG_LEVEL.ERROR + "\t--sleepTime -> Optional and defaults to 10000 equalling 10 seoncds.");
        return;
    }

    // All the payloads are a requirement. If one or more don't exist, print a message and quit.
    for (const script of Object.values(PAYLOADS)) {
        if (!ns.fileExists(script, ns.getHostname())) {
            ns.tprint(LOG_LEVEL.ERROR + `No file found with the name ${script}.`);
            return;
        }
    }

    // We prepare the logging.
    ns.ui.openTail();
    ns.disableLog('ALL');
    ns.clearLog();

    /** @type {ServerSet} */
    const knownHackingServers = new Set([]);
    /** @type {ServerSet} */
    const knownCloudServers = new Set([]);
    /** @type {ServerRamMap} */
    const knownCloudServersRam = new Map();
    while (true) {
        // Get information about all the hosts we can see on the
        // network and its details. Note that the bought servers does
        // not show up in the scan. This is also true for all the Dark
        // Net servers.
        const hosts = getNetworkHostNames(ns);
        const hostsDetails = getNetworkHostsDetails(ns, hosts);

        // Hack all the hosts which has not been hacked yet and that we are able to hack.
        const hostsThatCanBeHacked = getHostsThatCanBeHacked(ns, hostsDetails);
        const hostsNotHacked = hostsThatCanBeHacked.filter(host => !ns.hasRootAccess(host));
        if (hostsNotHacked.length > 0) hackHosts(ns, hostsNotHacked);

        // We find all the servers we can use to hack other servers with and
        // compare it to known servers. We extract new unknown servers and work
        // on those and also updating the known list of servers.
        const currentHackingServers = getHackingServerHostNames(ns, hosts);
        const newHackingServers = currentHackingServers.filter(host => !knownHackingServers.has(host));
        knownHackingServers.clear();
        for (const host of currentHackingServers) knownHackingServers.add(host);

        for (const host of newHackingServers) {
            if (host == ns.getHostname()) continue;
            await ns.scp(PAYLOADS.ALLINONEGO, host);
            await ns.scp(PAYLOADS.HACK, host);
            await ns.scp(PAYLOADS.GROW, host);
            await ns.scp(PAYLOADS.WEAKEN, host);
            ns.print(LOG_LEVEL.INFO + `Copied all payload files to ${targetHost}.`);
            killAllProcessesAndRunScript(ns, host, targetHost, PAYLOADS.ALLINONEGO);
        }

        // This part is identical to the hacking servers part above with the
        // exception of tracking the cloud servers RAM so that we can kill and
        // rerun scripts using all the host RAM.
        const currentCloudServers = getCloudServerHostNames(ns);
        const newCloudServers = currentCloudServers.filter(host => !knownCloudServers.has(host));
        knownCloudServers.clear();
        for (const host of currentCloudServers) knownCloudServers.add(host);

        for (const host of newCloudServers) {
            await ns.scp(PAYLOADS.ALLINONEGO, host);
            await ns.scp(PAYLOADS.HACK, host);
            await ns.scp(PAYLOADS.GROW, host);
            await ns.scp(PAYLOADS.WEAKEN, host);
            ns.print(LOG_LEVEL.INFO + `Copied all payload files to ${targetHost}.`);
            killAllProcessesAndRunScript(ns, host, targetHost, PAYLOADS.ALLINONEGO);

            // New cloud server. We need to get the RAM size and store it to the
            // map for later use and comparison.
            knownCloudServersRam.set(host, ns.getServerMaxRam(host));
        }

        for (const currentCloudServer of currentCloudServers) {
            const currentRam = ns.getServerMaxRam(currentCloudServer);
            const previousRam = knownCloudServersRam.get(currentCloudServer);

            if (previousRam === undefined || previousRam !== currentRam) {
                knownCloudServersRam.set(currentCloudServer, currentRam);
                ns.print(LOG_LEVEL.INFO + `Cloudserver ${currentCloudServer} has increased its RAM. Restarting all scripts.`);
                killAllProcessesAndRunScript(ns, currentCloudServer, targetHost, PAYLOADS.ALLINONEGO);
            }
        }
        await ns.sleep(flags.sleepTime);
    }
}

/**
 * Kills all the processes currently running on the attacking host and starts
 * the "virus" which will attack the target host
 * 
 * @param {NS} ns             - Netscript context
 * @param {string} host       - Hostname of the host to run the virus on
 * @param {string} targetHost - Hostname of the host to attack
 * @param {string} fileName   - Filename of the virus to attack with
 */
function killAllProcessesAndRunScript(ns, host, targetHost, fileName) {
    ns.killall(host);
    executeScriptOnRemoteHost(ns, host, targetHost, fileName);
    ns.print(LOG_LEVEL.INFO + `Killed all processes and started script ${fileName} on host ${host}.`);
}