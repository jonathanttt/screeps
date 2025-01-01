const sourceManager = require('source.manager');
const { avoidEnemies, isSourceSafe } = require('safety');

const roleHarvester = {
    run: function (creep) {
        // Avoid enemies
        if (avoidEnemies(creep)) return;

        // Assign a source if not already assigned
        if (!creep.memory.sourceId) {
            sourceManager.assignSource(creep);
        }

        // Get the assigned source and ensure it's safe
        const source = Game.getObjectById(creep.memory.sourceId);
        const hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);

        if (!source || !isSourceSafe(source, hostileCreeps)) {
            console.log(`Creep ${creep.name} is reassigning source due to danger or missing source.`);
            creep.memory.sourceId = null;
            sourceManager.assignSource(creep);
            return;
        }

        // Perform harvesting or collection tasks
        if (creep.store.getFreeCapacity() > 0) {
            if (!this.harvestEnergy(creep, source)) {
                this.collectDroppedEnergy(creep);
            }
        } else {
            // Perform other tasks if storage is full
            if (!this.deliverEnergy(creep)) {
                if (!this.buildConstructionSites(creep)) {
                    this.upgradeController(creep);
                }
            }
        }
    },

    collectDroppedEnergy: function (creep) {
        creep.say('🔄');
        const droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
            filter: (res) => res.resourceType === RESOURCE_ENERGY
        });

        if (droppedEnergy.length > 0) {
            if (creep.pickup(droppedEnergy[0]) === ERR_NOT_IN_RANGE) {
                creep.moveTo(droppedEnergy[0], { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return true;
        }
        return false;
    },

    harvestEnergy: function (creep, source) {
        creep.say('⚡');
        const sourceMemory = Memory.rooms[creep.room.name].sources[source.id];
        const assignedCreeps = sourceManager.getAssignedCreeps(source.id);
        const minersAssigned = assignedCreeps.filter((name) => name.startsWith('energyMiner')).length;

        if (minersAssigned >= sourceMemory.harvestablePositions) {
            console.log(`Creep ${creep.name} avoiding mining position occupied by miners.`);
            return false;
        }

        if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
        }

        return true;
    },

    deliverEnergy: function (creep) {
        creep.say('📦');
        const targets = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) =>
                (structure.structureType === STRUCTURE_EXTENSION ||
                    structure.structureType === STRUCTURE_SPAWN ||
                    structure.structureType === STRUCTURE_TOWER) &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        if (targets.length > 0) {
            if (creep.transfer(targets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
            }
            return true;
        }
        return false;
    },

    buildConstructionSites: function (creep) {
        const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES);
        if (constructionSites.length > 0) {
            if (creep.build(constructionSites[0]) === ERR_NOT_IN_RANGE) {
                creep.moveTo(constructionSites[0], { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return true;
        }
        return false;
    },

    upgradeController: function (creep) {
        if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
        }
    }
};

module.exports = roleHarvester;
