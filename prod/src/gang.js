import { Logger } from "./logger"


export class MyGang {
    #logger
    #ns

    /**
     * A class to handle the gang stuff in the game.
     * 
     * @param {NS} ns 
     */
    constructor (ns) {
        this.#ns = ns
        this.#logger = new Logger(ns)

        this.information = null
    }

    run() {
        while (!this.#ns.gang.inGang()) {
            this.#ns.sleep(10)
        }
        this.information = this.#ns.gang.getGangInformation()

        while (true) {
            const recruitsAvailable = this.#ns.gang.getRecruitsAvailable()
            if (recruitsAvailable > 0) {
                this.#logger.info(`Recruit names: ${recruitsAvailable}`)
            }
            this.#ns.sleep(1000)
        }
    }
}