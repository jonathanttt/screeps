const { avoidEnemies } = require('safety');

const roleUpgrader = {
    /** Main function to run the upgrader's logic */
    run: function (creep) {
        // Avoid enemies
        if (avoidEnemies(creep)) return;

        // Toggle between upgrading and fetching energy beside
        this.updateState(creep);

        // Perform tasks based on the current state
        if (creep.memory.upgrading) {
            creep.say('🛠');
            this.upgradeController(creep);
        } else {
            const searchRange = 3;
            const waitRange = 2;
            creep.say('🔄');
            this.fetchEnergyNearController(creep, searchRange, waitRange);
        }
    },

    /** Toggle states based on energy capacity */
    updateState: function (creep) {
        if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.upgrading = false;
        }
        if (!creep.memory.upgrading && creep.store.getFreeCapacity() === 0) {
            creep.memory.upgrading = true;
        }
    },

    /** Upgrade the room's controller */
    upgradeController: function (creep) {
        if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
        }
    },

    /** Fetch energy from nearby containers or dropped resources near the controller */
    fetchEnergyNearController: function (creep, searchRange, waitRange) {
        // Look for energy sources near the controller
        const nearbyTargets = creep.room.controller.pos.findInRange(FIND_STRUCTURES, searchRange, {
            filter: (structure) =>
                (structure.structureType === STRUCTURE_CONTAINER ||
                    structure.structureType === STRUCTURE_STORAGE) &&
                structure.store[RESOURCE_ENERGY] > 0
        }).concat(
            creep.room.controller.pos.findInRange(FIND_DROPPED_RESOURCES, searchRange, {
                filter: (resource) => resource.resourceType === RESOURCE_ENERGY
            })
        );

        if (nearbyTargets.length > 0) {
            // Prioritize structure over dropped resources
            const target = nearbyTargets.find((t) => t.structureType) || nearbyTargets[0];

            if (
                (target.structureType && creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) ||
                (target.resourceType && creep.pickup(target) === ERR_NOT_IN_RANGE)
            ) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        } else {
            // Stay close to the controller while waiting for energy to appear
            if (!creep.pos.inRangeTo(creep.room.controller, waitRange)) {
                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
    }
};

module.exports = roleUpgrader;
