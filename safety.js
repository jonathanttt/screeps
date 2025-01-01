module.exports = {
    avoidEnemies: function (creep, dangerRange = 5) {
        const hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);

        // Check if the creep is in a danger zone
        const inDanger = hostileCreeps.some((enemy) => creep.pos.getRangeTo(enemy.pos) <= dangerRange);

        if (inDanger) {
            console.log(`Creep ${creep.name} is avoiding enemies near (${creep.pos.x}, ${creep.pos.y}).`);
            creep.memory.avoiding = true;

            // Move to a safe location, such as the room's controller
            if (creep.room.controller) {
                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ff0000' } });
            }
            return true; // Indicates the creep is avoiding enemies
        }

        // Clear avoidance state if no longer in danger
        if (creep.memory.avoiding) {
            console.log(`Creep ${creep.name} is no longer avoiding enemies.`);
            creep.memory.avoiding = false;
        }

        return false; // Indicates the creep is not in danger
    },

    isSourceSafe: function (source, hostileCreeps, dangerRange = 5) {
        return !hostileCreeps.some((enemy) => source.pos.getRangeTo(enemy.pos) <= dangerRange);
    }
};
