const { avoidEnemies } = require('safety');

const roleCarrier = {
    /** Main function to run the carrier's logic */
    run: function (creep) {
        // Avoid enemies
        if (avoidEnemies(creep)) return;

        // Toggle between collect and deliver/transfer energy states
        this.updateState(creep);

        // Perform tasks based on the current state
        if (creep.memory.delivering) {
            creep.say('📦');
            this.manageEnergyDelivery(creep);
        } else {
            creep.say('🔄');
            this.collectEnergy(creep);
        }
    },

    /** Toggle states based on energy capacity */
    updateState: function (creep) {
        if (creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.delivering = false;
            creep.memory.targetId = null;
        }
        if (creep.store.getFreeCapacity() === 0) {
            creep.memory.delivering = true;
            creep.memory.targetId = null;
        }
    },

    /** Manage energy delivery based on priorities */
    manageEnergyDelivery: function (creep) {
        if (this.deliverEnergy(creep, 0.3)) return;
        if (this.transferEnergyToUpgraders(creep)) return;
        if (this.transferEnergyToBuilders(creep)) return;
        if (this.storeInBuildingContainers(creep)) return;
        if (this.deliverEnergy(creep, 0.2)) return;
        this.storeEnergy(creep);
    },

    /** Collect energy with tradeoff strategy */
    collectEnergy: function (creep) {
        const target = Game.getObjectById(creep.memory.targetId);

        if (!target) {
            // Select a new target if none exists
            const bestSource = this.findBestSource(creep);
            if (bestSource) {
                creep.memory.targetId = bestSource.id;
                creep.moveTo(bestSource, { visualizePathStyle: { stroke: '#ffaa00' } });
            } else {
                // No valid targets, transition to delivery state
                creep.memory.delivering = true;
            }
        } else {
            // Collect energy from the target
            if (target.amount > 0 && creep.pickup(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
            } else {
                // After collecting, check nearby sources if capacity remains
                if (creep.store.getFreeCapacity() > 0) {
                    this.lookForNearbySources(creep);
                } else {
                    creep.memory.delivering = true;
                }
            }
        }
    },

    /** Find the best energy source considering free capacity */
    findBestSource: function (creep) {
        const droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
            filter: (res) => res.resourceType === RESOURCE_ENERGY
        });

        const freeCapacity = creep.store.getFreeCapacity(RESOURCE_ENERGY);

        return droppedEnergy
            .map((source) => {
                const effectiveEnergy = Math.min(source.amount, freeCapacity); // Cap by free capacity
                const distance = creep.pos.getRangeTo(source);
                const energyBenefit = effectiveEnergy / distance; // Time unit benefit

                return {
                    source,
                    energyBenefit,
                };
            })
            .sort((a, b) => b.energyBenefit - a.energyBenefit) // Maximize energy benefit
            .map((entry) => entry.source)[0]; // Pick the best source
    },

    /** Check for nearby sources after picking all energy from the first target */
    lookForNearbySources: function (creep) {
        const nearbySources = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {
            filter: (res) => res.resourceType === RESOURCE_ENERGY && res.amount > 0
        });

        if (nearbySources.length > 0) {
            // Assign the best nearby source
            const bestSource = this.findBestSource(creep, nearbySources);
            if (bestSource) {
                creep.memory.targetId = bestSource.id;
                creep.moveTo(bestSource, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        } else {
            // No nearby sources, transition to delivery
            creep.memory.targetId = null;
            creep.memory.delivering = true;
        }
    },

    /** Deliver energy to structures based on threshold */
    deliverEnergy: function (creep, threshold) {
        creep.say('📦');
        const targets = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) =>
                (structure.structureType === STRUCTURE_TOWER ||
                    structure.structureType === STRUCTURE_SPAWN ||
                    structure.structureType === STRUCTURE_EXTENSION) &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) / structure.store.getCapacity(RESOURCE_ENERGY) > threshold
        });

        const priorityTargets = targets.sort((a, b) => {
            const priorityOrder = { tower: 1, spawn: 2, extension: 3 };
            return priorityOrder[a.structureType] - priorityOrder[b.structureType];
        });

        if (priorityTargets.length > 0) {
            if (creep.transfer(priorityTargets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(priorityTargets[0], { visualizePathStyle: { stroke: '#ffffff' } });
            }
            return true;
        }
        return false;
    },

    /** Transfer energy to upgraders */
    transferEnergyToUpgraders: function (creep) {
        creep.say('➡️');
        const upgraders = creep.room.find(FIND_MY_CREEPS, {
            filter: (c) => c.memory.role === 'upgrader' && c.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        const targetUpgrader = upgraders.sort(
            (a, b) => a.store[RESOURCE_ENERGY] - b.store[RESOURCE_ENERGY]
        )[0];
        
        if (targetUpgrader) {
                if (creep.transfer(targetUpgrader, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetUpgrader, { visualizePathStyle: { stroke: '#00ff00' } });
                }
                return true;
            }
            return false;
        },       

    /** Transfer energy to builders */
    transferEnergyToBuilders: function (creep) {
        creep.say('➡️');
        const builders = creep.room.find(FIND_MY_CREEPS, {
            filter: (c) => c.memory.role === 'builder' && c.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        const targetBuilder = builders.sort(
            (a, b) => a.store[RESOURCE_ENERGY] - b.store[RESOURCE_ENERGY]
        )[0];

        if (targetBuilder) {
            if (creep.transfer(targetBuilder, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(targetBuilder, { visualizePathStyle: { stroke: '#ff8800' } });
            }
            return true;
        }
        return false;
    },

    /** Store energy in building containers */
    storeInBuildingContainers: function (creep) {
        creep.say('📥');
        const buildingContainers = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) =>
                structure.structureType === STRUCTURE_CONTAINER &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        if (buildingContainers.length > 0) {
            if (creep.transfer(buildingContainers[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(buildingContainers[0], { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return true;
        }
        return false;
    },

    /** Store energy in storage or create a container near spawn */
    storeEnergy: function (creep) {
        creep.say('📥');
        const storage = creep.room.storage;
        if (storage && storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
            }
            return true;
        }

        const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) =>
                structure.structureType === STRUCTURE_CONTAINER &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        if (container) {
            if (creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return true;
        }

        const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
        if (spawn) {
            const nearbyContainers = spawn.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: { structureType: STRUCTURE_CONTAINER }
            });

            const nearbyConstructionSites = spawn.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
                filter: { structureType: STRUCTURE_CONTAINER }
            });

            if (nearbyContainers.length === 0 && nearbyConstructionSites.length === 0) {
                creep.room.createConstructionSite(spawn.pos.x + 1, spawn.pos.y, STRUCTURE_CONTAINER);
            }
        }
        return false;
    },

    /** Collect energy from sources */
    collectEnergy: function (creep) {
        creep.say('🔄');
        const droppedEnergy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
            filter: (res) => res.resourceType === RESOURCE_ENERGY
        });

        if (droppedEnergy) {
            if (creep.pickup(droppedEnergy) === ERR_NOT_IN_RANGE) {
                creep.moveTo(droppedEnergy, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return true;
        }

        const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) =>
                structure.structureType === STRUCTURE_CONTAINER &&
                structure.store[RESOURCE_ENERGY] > 0
        });

        if (container) {
            if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return true;
        }
        return false;
    }
};

module.exports = roleCarrier;
