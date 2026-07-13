import { Threads } from "./threads";


/**
 * Returns a mapping between host names and a set of information.
 * 
 * @param {NS} ns                 - Netscript context 
 * @param {HostNames_l} hostNames - List of host names
 * @param {Script} script 
 * @returns {ServersInfo_m}
 */
export function getServersInfo(ns, hostNames, script) {
    const threads = new Threads(ns);
    return new Map(
        hostNames.map(h => [h, {
            threads: threads.getNumberOfThreadsAHostCanRun(h, script.requiredRam),
            stats: ns.getServer(h),
        }])
    )
}