import { Threads } from "./threads";


/**
 * Returns a mapping between host names and a set of information.
 * 
 * @param {NS} ns                    - Netscript context 
 * @param {HostNames_l} hostNames    - List of host names
 * @param {Script} script            - The script to calculate threads for
 * @param {number} [minVacantRam=32] - The minimum amount of RAM we want available on "home" at any given time
 * @param {number} [minMaxRam=128]    - The minimum max RAM "home" can have before we start overriding used RAM
 * @returns {ServersInfo_m}
 */
export function getServersInfo(ns, hostNames, script, minVacantRam = 32, minMaxRam = 128) {
    const threads = new Threads(ns);

    return new Map(
        hostNames.map(h => {
            // Clone the server stats so qw don't mutate Bitburner's internal object
            const stats = { ...ns.getServer(h) };

            // I want to make sure there is always a minimum of 32GB of vacant
            // RAM on the home server so that I can run things like utility
            // scripts etc. But I only want to do this if I have a lot of RAM
            // simply because in the beginning, you have very little resources
            // to use for hacking.
            if (if h === "home" && stats.maxRam > minMaxRam) {
                stats.ramUsed += minVacantRam
            }

            return [h, {
                threads: threads.getNumberOfThreadsAHostCanRun(stats, script.requiredRam),
                stats,
            }];
        })
    );
}