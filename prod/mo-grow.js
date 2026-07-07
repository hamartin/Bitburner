/**
 * To run the grow script an un-named argument with the host name of the host
 * you want to attack must be given.
 * 
 * @param {NS} ns
 */
export async function main(ns) {
    if (ns.args[0] === undefined) ns.alert("No host name argument was given.");
    const targetHost = String(ns.args[0]);
    await ns.grow(targetHost);
}