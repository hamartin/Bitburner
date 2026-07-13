/**
 * @param {NS} ns
 * @returns
 */
export async function main(ns) {
    ns.ui.openTail()

    const purchased = ns.cloud.getServerNames()

    if (purchased.length === 0) {
        ns.print("✔ You have no purchased servers to sell.")
        return
    }

    ns.print(`🗑 Selling ${purchased.length} purchased servers...\n`)

    for (const host of purchased) {
        try {
            ns.killall(host)
            const result = ns.cloud.deleteServer(host)
            if (result) {
                ns.print(`✔ Sold server: ${host}`)
            } else {
                ns.print(`✘ Could not sell server: ${host} (running scripts?)`)
            }
        } catch (err) {
            ns.print(`⚠ Error selling ${host}: ${err}`)
        }
    }

    ns.print("\n🏁 Done.")
}
