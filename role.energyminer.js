const sourceManager = require('source.manager');
const { avoidEnemies, isSourceSafe } = require('safety');

const roleEnergyMiner = {

    /** Main function to run the miner's logic */
    run: function (creep) {
        // Avoid enemies
        if (avoidEnemies(creep)) return;

        // Assign a source if not already assigned
        if (!creep.memory.sourceId) {
            sourceManager.assignSource(creep);
        }

        // Check if the current source is safe
        const source = Game.getObjectById(creep.memory.sourceId);
        const hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
        if (source && !isSourceSafe(source, hostileCreeps)) {
            console.log(`Miner ${creep.name} is reassigning source due to danger.`);
            creep.memory.sourceId = null; // Clear the current source
            sourceManager.assignSource(creep); // Reassign a safe source
            return; // Skip the rest of this tick
        }

        // Perform mining tasks
        this.mineEnergy(creep);
    },

    /** Mine energy from the assigned source */
    mineEnergy: function (creep) {
        creep.say('⛏');
        const source = Game.getObjectById(creep.memory.sourceId);
        if (!source) {
            console.log(`Miner ${creep.name} has no assigned source.`);
            return; // Handle missing source gracefully
        }
        if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
    }
};

module.exports = roleEnergyMiner;
