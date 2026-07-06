/**
 * @typedef {{
 *  serverNamePrefix: String,
 *  sleepTime: Number,
 *  _: (String | Number | Boolean)[],
 *  help: Boolean
 * }} MyFlags
 */

/**
 * @typedef {(host: string) => void} CrackFunction
 */

/**
 * @typedef {Set<String>} ServerSet
 */

/**
 * @typedef {Map<String, Number>} ServerRamMap
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

// I use this as an "enum" to reference the different scripts I use.
const PAYLOADS = Object.freeze({
    "HACK": "mo-hack.js",
    "WEAKEN": "mo-weaken.js",
    "GROW": "mo-grow.js",
    "ALLINONEGO": "mo-payload.js",
})

//
// Functions
//

/**
 * @param {NS} ns 
 * @param {string} hostName 
 * @param {string} targetHost 
 * @param {string} virusFileName 
 */
function executeScriptOnRemoteHost(ns, hostName, targetHost, virusFileName) {
    // Executes a script on a server, maxing out the number of threads.
    const virusRamUsage = ns.getScriptRam(virusFileName);
    const maxRam = ns.getServerMaxRam(hostName);
    const threads = Math.floor(maxRam / virusRamUsage);
    ns.exec(virusFileName, hostName, threads, targetHost);
}

/**
 * @param {NS} ns 
 * @param {string[]} hosts 
 * @returns {string[]}
 */
function getHackingServerHostNames(ns, hosts) {
    // Function returns a list of host names for hacking servers we have
    // allready bought.
    const hackingServers = hosts.filter(host => ns.hasRootAccess(host) && ns.getServerMaxRam(host) > 0);
    return hackingServers;
}

/**
 * @param {NS} ns 
 * @param {String} namePrefix 
 * @returns {String[]}
 */
function getCloudServerHostNames(ns, namePrefix) {
    // This bit of the code handles getting all the bought servers
    // which does not show in the normal scans.
    const hostNames = [];

    let i = 0;
    while (ns.serverExists(namePrefix + i)) {
        hostNames.push(namePrefix + i);
        i++;
    }
    return hostNames;
}

/**
 * @param {NS} ns 
 * @param {Map<string, Object>} hosts 
 * @param {Map<string, CrackFunction>} crackingPrograms
 * @returns {string[]}
 */
function getHostsThatCanBeHacked(ns, hosts, crackingPrograms) {
    // Gets a list of hosts wee can see on the network and compares the
    // hosts required hacking level to the players current hacking level.
    //If the player has a high enough hacking level to hack the host, the
    // host is added to a list and returned at the end of the execution.
    const playerHackingLevel = ns.getHackingLevel();
    const numberOfCrackingPrograms = getNumberOfCrackingPrograms(ns, crackingPrograms);

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
 * @param {NS} ns 
 * @returns {string[]}
 */
function getNetworkHostNames(ns) {
    // The function will start initially at the host which the script is
    // run on and scan all servers in the network, returning a list of
    // all servers found.
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
 * @param {NS} ns 
 * @param {string[]} hostNames 
 * @returns {Map<string, Object>}
 */
function getNetworkHostsDetails(ns, hostNames) {
    // The function will return a map of all servers in the network, with
    // the server name as the key and the server details as the value.
    const hosts = new Map();
    for (const host of hostNames) {
        const details = ns.getServer(host);
        hosts.set(host, details);
    }
    return hosts;
}

/**
 * @param {NS} ns
 * @param {Map<string, CrackFunction>} crackingPrograms
 * @returns {number}
 */
function getNumberOfCrackingPrograms(ns, crackingPrograms) {
    // Simple returns the number of cracking programs the player has on
    // their home server.
    let numberOfCrackingPrograms = 0;
    for (const [program, func] of crackingPrograms) {
        if (ns.fileExists(program, "home")) numberOfCrackingPrograms++;
    }
    return numberOfCrackingPrograms;
}

/**
 * @param {NS} ns
 * @param {string[]} hosts
 * @param {Map<string, CrackFunction>} crackingPrograms
 */
export function hackHosts(ns, hosts, crackingPrograms) {
    for (const host of hosts) {
        for (const [program, func] of crackingPrograms) {
            if (ns.fileExists(program, "home")) {
                func(host);
                ns.print(LOG_LEVEL.SUCCESS + `Executed ${program} on ${host}`);
            }
        }
        ns.nuke(host);
        ns.print(LOG_LEVEL.SUCCESS + `Nuked ${host}`);
    }
}

//
// Main program
//

/**
 * @param {NS} ns
 */
export async function main(ns) {
    // Maps the filename in the terminal to the Netscript function.
    /**
     * @type {Map<String, CrackFunction>}
     */
    const CRACKING_PROGRAMS = new Map([
        ["BruteSSH.exe", ns.brutessh],
        ["FTPCrack.exe", ns.ftpcrack],
        ["relaySMTP.exe", ns.relaysmtp],
        ["HTTPWorm.exe", ns.httpworm],
        ["SQLInject.exe", ns.sqlinject],
    ]);

    /** @type {MyFlags} */
    const flags = /** @type {MyFlags} */ (ns.flags([
        ["serverNamePrefix", "Vogon-"],
        ["sleepTime", 10000],
        ["help", false],
    ]));
    const targetHost = String(flags._[0]);

    // Target host is a requirement. If one is not given, we print a usage message and quit.
    if (targetHost == "undefined" || flags.help) {
        ns.tprint(LOG_LEVEL.ERROR + `Usage: run ${ns.getScriptName()} <TARGET HOST> --serverNamePrefix <PREFIX> --sleepTime <TIME>`);
        ns.tprint(LOG_LEVEL.ERROR + "\t--serverNamePrefix -> Optional and defaults to Vogon-");
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
        const hostsThatCanBeHacked = getHostsThatCanBeHacked(ns, hostsDetails, CRACKING_PROGRAMS);
        const hostsNotHacked = hostsThatCanBeHacked.filter(host => !ns.hasRootAccess(host));
        if (hostsNotHacked.length > 0) hackHosts(ns, hostsNotHacked, CRACKING_PROGRAMS);

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
        const currentCloudServers = getCloudServerHostNames(ns, flags.serverNamePrefix);
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

        // Putting a sleep here as we do not need this script to run at
        // full speed. I'm ok with it running every second to reduce
        // how often the script evaulates the current state.
        await ns.sleep(flags.sleepTime);
    }
}

/**
 * @param {NS} ns
 * @param {string} host
 * @param {string} targetHost
 * @param {string} fileName
 */
function killAllProcessesAndRunScript(ns, host, targetHost, fileName) {
    ns.killall(host);
    executeScriptOnRemoteHost(ns, host, targetHost, fileName);
    ns.print(LOG_LEVEL.INFO + `Killed all processes and started script ${fileName} on host ${host}.`);
}