/**
 * To run the grow script an un-named argument with the host name of the host
 * you want to attack must be given.
 * 
 * @param {NS} ns                - Netscript context
 * @property {string} ns.args[0] - Required host name to grow
 * @property {number} ns.args[1] - Required delay time for the script
 * @example ns.run(<PATH TO SCRIPT>, <NUMBER OF THREADS>, <TARGET HOST>);
 * @example run <PATH TO SCRIPT> <TARGET HOST> -t <NUMBER OF THREADS>
 */
export async function main(ns) {
    if (ns.args[0] === undefined) {
        ns.alert("No host name argument was given.");
        ns.exit();
    }
    if (ns.args[1] === undefined) {
        ns.alert("No delay time argument was given.");
        ns.exit();
    }
    const targetHost = String(ns.args[0]);
    const delay = Number(ns.args[1]);
    await ns.grow(targetHost, {additionalMsec: delay});
}