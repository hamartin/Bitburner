/**
 * A class to keep track of payloads.
 * 
 * @example const payloads = new Payloads(ns);
 */
export class Payloads {
    #ns;

    /**
     * @param {NS} ns - Netscript context
     * @example const payloads = new Payloads(ns);
     */
    constructor (ns) {
        this.#ns = ns;

        this.scriptsPath = "/scripts";
        this.hackFileName = "hack.js";
        this.hackFileNameFull = `${this.scriptsPath}/${this.hackFileName}`;
        this.weakenFileName = "weaken.js";
        this.weakenFileNameFull = `${this.scriptsPath}/${this.weakenFileName}`;
        this.growFileName = "grow.js";
        this.growFileNameFull = `${this.scriptsPath}/${this.growFileName}`;
        this.allFileName = "payload.js";
        this.allFileNameFull = `${this.scriptsPath}/${this.allFileName}`;

        this.checkPayloadsExist();
    }

    /**
     * A function you can run to check if the scripts are accessible. If not, the script just quits on you.
     */
    checkPayloadsExist() {
        for (const script of [this.hackFileNameFull, this.weakenFileNameFull, this.growFileNameFull, this.allFileNameFull]) {
            if (!this.#ns.fileExists(script, this.#ns.getHostname())) {
                this.#ns.alert(`No file found with the name ${script}.`);
                this.#ns.exit();
            }
        }
    }

    /**
     * Returns the amount of RAM the script uses.
     * 
     * @param {string} fileName        - The file name to return the RAM used size for.
     * @param {number} [numbThreads=1] - The number of threads the amount should be calculated for. Defaults to 1.
     * @returns {number}               - The required amount of RAM to run the script.
     */
    getRamRequirements(fileName, numbThreads = 1) {
        return this.#ns.getScriptRam(fileName, this.#ns.getHostname()) * numbThreads;
    } 
}