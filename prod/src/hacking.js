import { Logger } from "./classes/logger.js";
import { Payloads } from "./classes/payloads.js";


/**
 * This helper allows you to call one function and get the growth time. If
 * Formulas are available, then it will use that instead of the default one.
 * 
 * @param {NS} ns       - Netscript context 
 * @param {string} host - Hostname of the host we are calculating the growth time for
 * @returns {number}
 */
export function getGrowTime(ns, host) {
    if (ns.fileExists("Formulas.exe", "home")) {
        const server = ns.getServer(host);
        const player = ns.getPlayer();
        return ns.formulas.hacking.growTime(server, player);
    }

    return ns.getGrowTime(host);
}