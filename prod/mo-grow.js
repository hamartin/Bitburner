/**
 * @param {NS} ns 
 */
export async function main(ns) {
    ns.grow(ns.getHostname());
}