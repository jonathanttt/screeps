var spawnManager = {
    roleBodies: {
        harvester: [WORK, CARRY, MOVE],
        energyMiner: [WORK, WORK, MOVE],
        carrier: [CARRY, CARRY, MOVE, MOVE],
        upgrader: [WORK, CARRY, MOVE],
        builder: [WORK, CARRY, MOVE]
    },

    /**
     * Spawns a creep if it meets the conditions.
     * @param {StructureSpawn} spawn - The spawn object.
     * @param {string} role - The role of the creep to spawn.
     */
    checkAndSpawn: function (spawn, role) {
        if (Memory.spawnInProgress) return false;

        const body = this.roleBodies[role]; // Get body parts for the role
        const newName = `${role}${Game.time}`;
        const result = spawn.spawnCreep(body, newName, { memory: { role } });

        if (result === OK) {
            console.log(`Spawning new ${role}: ${newName}`);
            Memory.spawnInProgress = true; // Set the flag
            return true; // Spawn action succeeded
        } else {
            console.log(`Failed to spawn ${role}. Error: ${result}`);
        }

        return false; // No spawn action taken
    },

    /**
     * Calculates the energy cost of a given creep body.
     * @param {Array} body - The body parts of the creep.
     * @returns {number} - The total energy cost.
     */
    getBodyCost: function (body) {
        const BODYPART_COST = {
            move: 50,
            work: 100,
            carry: 50,
            attack: 80,
            ranged_attack: 150,
            heal: 250,
            claim: 600,
            tough: 10
        };
        return body.reduce((cost, part) => cost + BODYPART_COST[part], 0);
    }
};

module.exports = spawnManager;
