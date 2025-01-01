module.exports = {
    initializeRoomSources: function (room) {
        // Ensure Memory.rooms structure exists
        if (!Memory.rooms) {
            Memory.rooms = {};
        }
        if (!Memory.rooms[room.name]) {
            Memory.rooms[room.name] = { sources: {} };
        }

        const spawn = room.find(FIND_MY_SPAWNS)[0]; // Assume at least one spawn exists
        const sources = room.find(FIND_SOURCES);
        const terrain = new Room.Terrain(room.name);

        sources.forEach((source) => {
            // Only calculate and store if not already initialized
            if (!Memory.rooms[room.name].sources[source.id]) {
                const harvestablePositions = this.calculateHarvestablePositions(source, terrain);
                const distance = spawn ? spawn.pos.getRangeTo(source) : Infinity;

                // Store source details in memory
                Memory.rooms[room.name].sources[source.id] = {
                    dist: distance,
                    harvestablePositions: harvestablePositions.length, // Store count
                    positions: harvestablePositions, // Optional: Keep positions for debugging or advanced logic
                    assignedCreeps: [], // Track creeps assigned to this source
                };

                console.log(
                    `Initialized source ${source.id} in room ${room.name}: dist=${distance}, harvestablePositions=${harvestablePositions.length}`
                );
            }
        });
    },

    assignSource: function (creep) {
        console.log(`Assigning source for Creep: ${creep.name}`);

        // Ensure room sources are initialized
        const roomMemory = Memory.rooms[creep.room.name];
        if (!roomMemory || !roomMemory.sources) {
            console.log(`Room memory not initialized for ${creep.room.name}. Initializing now.`);
            this.initializeRoomSources(creep.room); // Initialize if missing
        }

        const hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
        const sourcesData = Memory.rooms[creep.room.name].sources;

        // Sort sources by distance
        const sortedSources = Object.entries(sourcesData)
            .map(([sourceId, data]) => ({
                id: sourceId,
                dist: data.dist,
                availablePositions: data.harvestablePositions - data.assignedCreeps.length, // Calculate free positions
                assignedCreeps: data.assignedCreeps,
            }))
            .sort((a, b) => a.dist - b.dist);

        // Assign a source based on role and conditions
        for (const sourceData of sortedSources) {
            const source = Game.getObjectById(sourceData.id);
            const isSafe = isPositionSafe(source.pos, hostileCreeps);

            // Miner prioritization: Miners should take over positions if needed
            if (creep.memory.role === 'energyMiner' && isSafe) {
                if (sourceData.availablePositions > 0) {
                    this.assignCreepToSource(creep, sourceData.id);
                    console.log(`Miner ${creep.name} assigned to source at (${source.pos.x}, ${source.pos.y}).`);
                    return;
                } else {
                    const harvesterToReassign = sourceData.assignedCreeps.find((name) => name.startsWith('harvester'));
                    if (harvesterToReassign) {
                        this.assignCreepToSource(creep, sourceData.id); // Assign miner first
                        console.log(`Miner ${creep.name} assigned to source at (${source.pos.x}, ${source.pos.y}).`);
                        this.reassignCreep(Game.creeps[harvesterToReassign]); // Reassign harvester after
                        console.log(`Reassigned harvester ${harvesterToReassign} to another source.`);
                        return;
                    }
                }
            }

            // Assign source to harvesters only if positions are free after miners
            if (creep.memory.role === 'harvester' && isSafe && sourceData.availablePositions > 0) {
                this.assignCreepToSource(creep, sourceData.id);
                console.log(`Harvester ${creep.name} assigned to source at (${source.pos.x}, ${source.pos.y}).`);
                return;
            }
        }

        console.log(`No safe or available sources for Creep: ${creep.name}`);
    },

    reassignCreep: function (creep) {
        console.log(`Reassigning Creep: ${creep.name} from source ${creep.memory.sourceId}`);
        this.removeCreepFromSource(creep); // Remove from current source
        this.assignSource(creep); // Attempt to assign a new source
        console.log(`Creep ${creep.name} reassigned successfully.`);
    },

    calculateHarvestablePositions: function (source, terrain) {
        const positions = [];

        // Check the 3x3 area around the source
        for (let x = source.pos.x - 1; x <= source.pos.x + 1; x++) {
            for (let y = source.pos.y - 1; y <= source.pos.y + 1; y++) {
                if (
                    (x !== source.pos.x || y !== source.pos.y) && // Skip the source's center position
                    terrain.get(x, y) !== TERRAIN_MASK_WALL
                ) {
                    positions.push({ x, y }); // Add valid positions
                }
            }
        }
        return positions;
    },

    assignCreepToSource: function (creep, sourceId) {
        const roomMemory = Memory.rooms[creep.room.name];
        const sourceMemory = roomMemory.sources[sourceId];

        // Add creep to the list of assigned creeps
        if (!sourceMemory.assignedCreeps.includes(creep.name)) {
            sourceMemory.assignedCreeps.push(creep.name);
        }
        creep.memory.sourceId = sourceId;
    },

    removeCreepFromSource: function (creep) {
        if (!creep.memory.sourceId) return; // No source assigned to this creep
        const roomMemory = Memory.rooms[creep.room.name];
        const sourceMemory = roomMemory.sources[creep.memory.sourceId];

        if (sourceMemory) {
            sourceMemory.assignedCreeps = sourceMemory.assignedCreeps.filter((name) => name !== creep.name);
        }

        // Clear creep's source assignment
        creep.memory.sourceId = null;
    },

    getAssignedCreeps: function (sourceId, roomName) {
        const roomMemory = Memory.rooms[roomName] || {};
        const sourceMemory = roomMemory.sources ? roomMemory.sources[sourceId] : {};
        return sourceMemory ? sourceMemory.assignedCreeps || [] : [];
    },
};

function isPositionSafe(pos, hostileCreeps, dangerRange = 5) {
    return !hostileCreeps.some((enemy) => pos.getRangeTo(enemy.pos) <= dangerRange);
}
