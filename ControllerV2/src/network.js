/**
 * A class which is designed to be used as a singleton and handles all
 * networking specific stuff.
 * 
 * @example const network = new Network(ns)
 */
export class Network {
    //Private members
    #ns

    /**
     * @param {NS} ns - Netscript context
     * @example const network = new Network(ns)
     */
    constructor (ns) {
        this.#ns = ns
    }

    /**
     * The method will start initially at the host which the script is
     * run on and scan all servers in the network, returning a list of
     * all servers found.
     * 
     * @returns {HostNames_l} - A list of hostnames for hosts we can see on the network
     * @example const hostNames = network.getHostNames()
     */
    getHostNames() {
        const visited = new Set([this.#ns.getHostname(), ])
        const stack = [this.#ns.getHostname(), ]

        while (stack.length > 0) {
            const server = stack.pop()
            for (const neighbor of this.#ns.scan(server)) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor)
                    stack.push(neighbor)
                }
            }
        }
        // Spreads the set into an array and returns it.
        return [...visited]
    }

    /**
     * Returns a list of host names where each host has been rooted and is ready
     * to be used.
     * 
     * @returns {HostNames_l} - Returns a list of host names where the host has been rooted.
     */
    getRootedHostNames() {
        return this.getHostNames().filter(h => this.#ns.hasRootAccess(h))
    }
}