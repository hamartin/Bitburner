import {
    LOG_LEVEL,
    PAYLOADS,
} from "./src/constants.js";
import { LogMessage } from "./src/logging.js";
import {
    getCloudServerHostNames,
    getHackingServerHostNames,
    getHostsThatCanBeHacked,
    getNetworkHostsDetails,
    getNetworkHostNames,
    hackHosts,
    killAllProcessesAndRunScript,
} from "./src/utility.js";

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
 * Function enables us to push tab when writing host names in the terminal and
 * we will get a list of servers to choose from
 * 
 * @param {AutocompleteData} data - Autocomplete context containing servers, scripts, txt files, and flags
 * @param {string[]} args         - Arguments typed so far in the terminal
 * @returns {string[]}            - List of autocomplete suggestions
 */
export function autocomplete(data, args) {
  return data.servers;
}