/**
 * To run the grow script an un-named argument with the host name of the host
 * you want to attack must be given.
 * 
 * @param {NS} ns                - Netscript context
 * @property {string} ns.args[0] - Required host name to grow
 * @example ns.run(<PATH TO SCRIPT>, <NUMBER OF THREADS>, <TARGET HOST>);
 * @example run <PATH TO SCRIPT> <TARGET HOST> -t <NUMBER OF THREADS>
 */
export async function main(ns) {
    if (ns.args[0] === undefined) ns.alert("No host name argument was given.");
    const targetHost = String(ns.args[0]);
    await ns.grow(targetHost);
}