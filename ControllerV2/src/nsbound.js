/**
 * Base class so I don't have to put the NS stuff absolutely everywhere
 */
export class NSBound {
    // Private members
    #ns

    /**
     * Base class so I don't have to put the NS stuff absolutely everywhere
     * 
     * @param {NS} ns - Netscript context
     */
    constructor(ns) {
        this.#ns = ns
    }

    /**
     * Enable any child class to access the private NS member.
     * @returns {NS}
     */
    get ns() {
        return this.#ns
    }
}