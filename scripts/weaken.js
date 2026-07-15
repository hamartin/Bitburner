/**
 * To run the weaken script an un-named argument with the host name of the host
 * you want to attack must be given.
 * 
 * @param {NS} ns                    - Netscript context
 * @property {string} ns.args[0]     - Required host name to weaken
 * @property {number} [ns.args[1]=0] - Required delay time for the script
 * @example ns.run(<PATH TO SCRIPT>, <NUMBER OF THREADS>, <TARGET HOST>)
 * @example run <PATH TO SCRIPT> <TARGET HOST> -t <NUMBER OF THREADS>
 */
export async function main(ns) {
    if (ns.args[0] === undefined) {
        ns.alert("No host name argument was given.")
        ns.exit()
    }
    const targetHost = String(ns.args[0])
    const delay = ns.args[1] === undefined
        ? 0
        : Number(ns.args[1])
    await ns.weaken(targetHost, {additionalMsec: delay})
}

/**
 *  Autocomplete only works for the first argument.
 */
export function autocomplete(data, args) {
    if (args.length === 1) {
        return data.servers
    }
    return []
}