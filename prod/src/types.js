/**
 * @typedef {Object} Threads
 * @property {number} hack
 * @property {number} hackRequiredRam
 * @property {number} weakenHack
 * @property {number} weakenHackRequiredRam
 * @property {number} grow
 * @property {number} growRequiredRam
 * @property {number} weakenGrow
 * @property {number} weakenGrowRequiredRam
 * @property {number} total
 * @property {number} totalRequiredRam
 */

/**
 * @typedef {Object} AttackTimes
 * @property {number} hack
 * @property {number} grow 
 * @property {number} weaken
 */

/**
 * @typedef {Object} DelayTimes
 * @property {number} hack
 * @property {number} weakenHack
 * @property {number} grow
 * @property {number} weakenGrow
 */

/**
 * @typedef {Set<String>} ServerSet
 */

/**
 * @typedef {Map<String, Number>} ServerRamMap
 */

/**
 * @typedef TreeNode
 * @property {String} host
 * @property {TreeNode | null} parent
 * @property {TreeNode[]} children
 */