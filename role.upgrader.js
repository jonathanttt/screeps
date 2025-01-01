const { avoidEnemies } = require('safety');

const roleUpgrader = {
    /** Main function to run the upgrader's logic */
    run: function (creep) {
        // Avoid enemies
        if (avoidEnemies(creep)) return;

        // Toggle between upgrading and waiting for energy states
        this.updateState(creep);

        // Perform tasks based on the current state
        if (creep.memory.upgrading) {
            creep.say('🛠');
            this.upgradeController(creep);
        } else {
            creep.say('⏳');
            this.waitForEnergy(creep);
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

    /** Wait for energy near the controller */
    waitForEnergy: function (creep) {
        // Stay close to the controller and wait for energy
        if (!creep.pos.inRangeTo(creep.room.controller, 1)) {
            creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffaa00' } });
        } else {
            // console.log(`Upgrader ${creep.name} is waiting for energy at (${creep.pos.x}, ${creep.pos.y}).`);
        }
    }
};

module.exports = roleUpgrader;
