/**
 * A class which is designed to be used almost as a singleton and handles all
 * script specific stuff.
 * 
 * @example const script = new Script(ns, "weaken.js")
 * @example const script = new Script(ns, "weaken.js", "/other")
 */
export class Script {
    // Private members
    #ns
    #fileName
    #path

    /**
     * A class which is designed to be used as a singleton and handles all
     * script specific stuff.
     * 
     * @param {NS} ns                    - Netscript context
     * @param {FileName_s} fileName      - The script file name
     * @param {Path_s} [path="/scripts"] - FQPN to where the script resides
     * @example const script = new Script(ns, "weaken.js")
     * @example const script = new Script(ns, "weaken.js", "/other")
     */
    constructor(ns, fileName, path = "/scripts") {
        this.#ns = ns
        this.#fileName = fileName
        this.#path = path

        /** @type {PathAndFileName_s} */
        this.pathAndFileName = `${this.#path}/${this.#fileName}`
        if (!ns.fileExists(this.pathAndFileName)) {
            ns.alert(`Script ${fileName} cannot be found in ${path}. Quitting!`)
            ns.exit()
        }
        /** @type {RAM_n} */
        this.requiredRam = ns.getScriptRam(`${this.pathAndFileName}`);
    }

    /**
     * Returns true if the destination host allready has the file, else false.
     * 
     * @param {HostName_s} hostName 
     * @returns {boolean}
     */
    serverHasScript(hostName) {
        return this.#ns.fileExists(this.pathAndFileName, hostName)
    }

    /**
     * Copes itself to the destination hostName.
     * 
     * @param {HostName_s} hostName 
     */
    copyToServer(hostName) {
        this.#ns.scp(this.pathAndFileName, hostName)
    }

    /**
     * Executes the script this object has "responsebility" for.
     * 
     * @param {HostName_s} sourceHostName - Host name of the server to run the script on
     * @param {Threads_n} threads         - How many threads to run for the script
     * @param {...string} args            - Any additional arguments needed to pass to the script
     */
    runScriptOnServer(sourceHostName, threads, ...args) {
        if (!this.serverHasScript(sourceHostName)) {
            this.copyToServer(sourceHostName)
        }
        this.#ns.exec(this.pathAndFileName, sourceHostName, threads, ...args)
    }
}