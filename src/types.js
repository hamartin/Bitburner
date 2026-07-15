/**
 * @typedef {number} Batches_n
 */

/**
 * @typedef {number} Delay_n
 */

/**
 * @typedef {Object} Delay_o
 * @property {Delay_n} hackDelay
 * @property {Delay_n} weakenHackDelay
 * @property {Delay_n} growDelay
 * @property {Delay_n} weakenGrowDelay
 */

/**
 * @typedef {string} FileName_s
 */

/**
 * @typedef {Object} HGWStatus_o
 * @property {number} currentSecurity
 * @property {number} minSecurity
 * @property {number} diffSecurity
 * @property {number} currentMoney
 * @property {number} maxMoney
 * @property {number} diffMoney
 */

/**
 * @typedef {string} ServerName_s
 */

/**
 * @typedef {ServerName_s[]} ServerNames_l
 */

/**
 * @typedef {import("./network").Network} Network
 */

/**
 * @typedef {string} Path_s
 */

/**
 * @typedef {string} PathAndFileName_s
 */

/**
 * @typedef {PID_n[]} PID_l
 */

/**
 * @typedef {number} PID_n
 */

/**
 * @typedef {number} RAM_n
 */

/**
 * @typedef {Object} RAM_o
 * @typedef {RAM_n} hackRAM
 * @typedef {RAM_n} weakenHackRAM
 * @typedef {RAM_n} growRAM
 * @typedef {RAM_n} weakenGrowRAM
 * @typedef {RAM_n} totalRAM
 */

/**
 * @typedef {Map<ServerName_s, ServerRAM_o>} ServerRAM_m
 */

/**
 * @typedef {Object} ServerRAM_o
 * @typedef {RAM_n} maxRAM
 * @typedef {RAM_n} usedRAM
 * @typedef {RAM_n} freeRAM
 */

/**
 * @typedef {import("./script").Script} Script
 */

/**
 * @typedef {Script[]} Scripts
 */

/**
 * @typedef {Map<ServerName_s, ServerInfo_o>} ServersInfo_m
 */

/**
 * @typedef {Object} ServerInfo_o
 * @property {Server} stats       - Required
 * @property {number=} threads    - Optional
 */

/**
 * @typedef {import("./threads").Threads} Threads
 */

/**
 * @typedef {number} Threads_n
 */

/**
 * @typedef {Object} Threads_o
 * @typedef {Threads_n} hackThreads
 * @typedef {Threads_n} weakenHackThreads
 * @typedef {Threads_n} growThreads
 * @typedef {Threads_n} weakenGrowThreads
 * 
 * @typedef {Threads_n} weakenToMinThreads
 * @typedef {Threads_n} growToMaxThreads
 * @typedef {Threads_n} weakenGrowToMaxThreads
 */

/**
 * @typedef TreeNode
 * @property {String} host
 * @property {TreeNode | null} parent
 * @property {TreeNode[]} children
 */

/**
 * @typedef {number} Threshold_n
 */