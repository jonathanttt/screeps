const { avoidEnemies } = require('safety');

const roleBuilder = {
    /** Main function to run the builder's logic */
    run: function (creep) {
        // Avoid enemies
        if (avoidEnemies(creep)) return;

        // Toggle between building and collecting energy
        if (creep.memory.building && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.building = false;
            creep.say('🔄 collect');
        }
        if (!creep.memory.building && creep.store.getFreeCapacity() === 0) {
            creep.memory.building = true;
            creep.say('🚧 build');
        }

        // Perform tasks based on the current state
        if (creep.memory.building) {
            this.buildStructures(creep);
        } else {
            this.collectEnergy(creep);
        }
    },

    /** Collect energy from building containers, general containers, or dropped energy */
    collectEnergy: function (creep) {
        // Priority 1: Building containers near extensions
        const buildingContainer = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) =>
                structure.structureType === STRUCTURE_CONTAINER &&
                structure.store[RESOURCE_ENERGY] > 0 &&
                structure.pos.findInRange(FIND_CONSTRUCTION_SITES, 2).length > 0
        });

        if (buildingContainer) {
            if (creep.withdraw(buildingContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(buildingContainer, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return;
        }

        // Priority 2: General containers
        const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) =>
                structure.structureType === STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 0
        });

        if (container) {
            if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return;
        }

        // Priority 3: Dropped energy
        const droppedEnergy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
            filter: (res) => res.resourceType === RESOURCE_ENERGY
        });

        if (droppedEnergy) {
            if (creep.pickup(droppedEnergy) === ERR_NOT_IN_RANGE) {
                creep.moveTo(droppedEnergy, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return;
        }

        // Fallback: Wait near carriers for energy
        const carriers = creep.room.find(FIND_MY_CREEPS, {
            filter: (c) => c.memory.role === 'carrier'
        });

        if (carriers.length > 0) {
            creep.moveTo(carriers[0], { visualizePathStyle: { stroke: '#00ff00' } });
            creep.say('Waiting for energy');
        }
    },

    /** Build structures based on priority */
    buildStructures: function (creep) {
        if (!creep.memory.targetId) {
            const target = this.getNextAvailableConstructionSite(creep);
            if (target) {
                creep.memory.targetId = target.id;
            } else {
                return;
            }
        }

        const target = Game.getObjectById(creep.memory.targetId);
        if (!target) {
            creep.memory.targetId = null; // Clear invalid target
            return;
        }

        if (creep.build(target) === ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }

        if (target.progress === target.progressTotal) {
            creep.memory.targetId = null;
        }
    },

    /** Get the next available construction site */
    getNextAvailableConstructionSite: function (creep) {
        const sites = creep.room.find(FIND_CONSTRUCTION_SITES);
        return sites.length > 0 ? sites[0] : null;
    }
};

module.exports = roleBuilder;
