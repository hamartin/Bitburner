/**
 * @typedef {(host: string) => void} CrackFunction
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
 * @param {string} namePrefix 
 * @returns {string[]}
 */
function getHackingServerHostNames(ns, hosts, namePrefix) {
    // Function returns a list of host names for hacking servers we have
    // allready bought.
    const hackingServers = hosts.filter(host => ns.hasRootAccess(host) && ns.getServerMaxRam(host) > 0);

    // This bit of the code handles getting all the bought servers
    // which does not show in the normal scans.
    let i = 0;
    while (ns.serverExists(namePrefix + i)) {
        hackingServers.push(namePrefix + i);
        i++;
    }
    return hackingServers;
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
    ns.ui.openTail();

    //
    // Constants which are used in different places.
    //

    // Maps the filename in the terminal to the Netscript function.
    const CRACKING_PROGRAMS = new Map([
        ["BruteSSH.exe", ns.brutessh],
        ["FTPCrack.exe", ns.ftpcrack],
        ["relaySMTP.exe", ns.relaysmtp],
        ["HTTPWorm.exe", ns.httpworm],
        ["SQLInject.exe", ns.sqlinject],
    ]);

    // Script arguments which is used throughout the script.
    const targetHost = ns.args[0] ? String(ns.args[0]) : "";
    const serverNamePrefix = ns.args[1] ? String(ns.args[1]) : "Vogon-";
    const sleepTime = ns.args[2] ? Number(ns.args[2]) : 10000;

    // Target host is a requirement. If one is not given, we print a usage message and quit.
    if (!targetHost) {
        ns.tprint(LOG_LEVEL.ERROR + "Usage: run mo-controller.js <TARGET HOST> <CLOUD SERVER NAME PREFIX> <SLEEP TIME>");
        ns.tprint(LOG_LEVEL.ERROR + "\t<CLOUD SERVER NAME PREFIX>:");
        ns.tprint(LOG_LEVEL.ERROR + "\t  Is optional and defaults to Vogon-");
        ns.tprint(LOG_LEVEL.ERROR + "\t<SLEEP TIME>:");
        ns.tprint(LOG_LEVEL.ERROR + "\t  Is optional and defaults to 10000 equalling 10 seconds");
        ns.tprint(LOG_LEVEL.ERROR + "");
        ns.tprint(LOG_LEVEL.ERROR + "Note that if you specify sleep time on the command line, you have to specify server name prefix as well.");
        return;
    }

    // All the payloads are a requirement. If one or more don't exist, print a message and quit.
    for (const script of Object.values(PAYLOADS)) {
        if (!ns.fileExists(script, ns.getHostname())) {
            ns.tprint(LOG_LEVEL.ERROR + `No file found with the name ${script}.`);
            return;
        }
    }

    let numberOfHackingServers = 0;
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

        // We find all the servers we can use to hack other servers with.
        const hackingServers = getHackingServerHostNames(ns, hosts, serverNamePrefix);
        if (hackingServers.length != numberOfHackingServers) {
            // TODO: We could solve this in a better way by converting
            // two lists of hacking servers into sets and comparing
            // those instead. That would make it easy for us to only
            // copy the script to the new hosts, not disturbing the
            // scripts allready running. I am lazy, so I will not be
            // doing that.
            numberOfHackingServers = hackingServers.length;
            for (const host of hackingServers) {
                // We don't want to overwrite the source file.
                if (host != ns.getHostname()) {
                    await ns.scp(PAYLOADS.ALLINONEGO, host);
                    await ns.scp(PAYLOADS.HACK, host);
                    await ns.scp(PAYLOADS.GROW, host);
                    await ns.scp(PAYLOADS.WEAKEN, host);
                    killAllProcessesAndRunScript(ns, host, targetHost, PAYLOADS.ALLINONEGO);
                }
            }
        }

        // Putting a sleep here as we do not need this script to run at
        // full speed. I'm ok with it running every second to reduce
        // how often the script evaulates the current state.
        await ns.sleep(sleepTime);
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
}