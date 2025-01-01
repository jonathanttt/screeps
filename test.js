var roleHarvester = require('role.harvester');
var roleEnergyMiner = require('role.energyminer');
var roleCarrier = require('role.carrier');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var spawnManager = require('spawn.manager');
var extensionBuilder = require('extension.builder');
const sourceManager = require('source.manager'); 

if (!Memory.spawnQueue) {
    Memory.spawnQueue = [
        { role: 'harvester', body: [WORK, CARRY, MOVE] },
        { role: 'energyMiner', body: [WORK, WORK, MOVE] },
        { role: 'carrier', body: [CARRY, CARRY, MOVE, MOVE] },
        { role: 'energyMiner', body: [WORK, WORK, MOVE] },
        { role: 'carrier', body: [CARRY, CARRY, MOVE, MOVE] },
    ];
}

function logSourceUtilization(room) {
    const sources = room.find(FIND_SOURCES);

    console.log(`Room ${room.name} has ${sources.length} sources.`);
    sources.forEach((source) => {
        const harvestablePositions = sourceManager.getHarvestablePositions(source);
        const assignedCreeps = _.filter(Game.creeps, (c) => c.memory.sourceId === source.id).length;
        const utilization = (assignedCreeps / harvestablePositions) * 100;

        console.log(
            `Source ${source.id} at (${source.pos.x}, ${source.pos.y}): ${assignedCreeps}/${harvestablePositions} positions used (Utilization: ${utilization.toFixed(2)}%).`
        );
    });
}

// Function to clean up memory of dead creeps
function cleanUpMemory() {
    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            // console.log('Clearing non-existing creep memory:', name);
        }
    }
}

// Function to log creep details
function logCreepDetails() {
    // console.log('Creep Overview:');
    for (var name in Game.creeps) {
        const creep = Game.creeps[name];
        // console.log(
        //     `Creep: ${creep.name}, Role: ${creep.memory.role}, Assigned Source: ${
        //         creep.memory.sourceId ? creep.memory.sourceId : 'None'
        //     }`
        // );
    }
}

// Function to manage creep spawning
function manageSpawning(spawn) {
    if (spawn.spawning) {
        const spawningCreep = Game.creeps[spawn.spawning.name];
        console.log(`Spawn ${spawn.name} is spawning ${spawningCreep.memory.role}: ${spawningCreep.name}`);
        Memory.spawnInProgress = true; // Ensure the flag remains set
        return;
    }

    // If no creep is being spawned and the flag is set, clear the flag
    if (Memory.spawnInProgress) {
        console.log(`Spawn ${spawn.name} is now idle. Clearing spawn flag.`);
        Memory.spawnInProgress = false;
    }

    // Process the first item in the spawn queue
    // console.log(JSON.stringify(Memory.spawnQueue));
    if (Memory.spawnQueue.length > 0) {
        const nextInQueue = Memory.spawnQueue[0];
        const bodyCost = spawnManager.getBodyCost(nextInQueue.body);

        // Check if the room has enough energy
        if (spawn.room.energyAvailable >= bodyCost) {
            // Spawn the creep and remove it from the queue
            if (spawnManager.checkAndSpawn(spawn, nextInQueue.role, 1, nextInQueue.body)) {
                Memory.spawnQueue.shift(); // Remove the spawned role from the queue
                return; // Stop further processing
            }
        } else {
            // console.log(
            //     `Not enough energy to spawn ${nextInQueue.role}. Required: ${bodyCost}, Available: ${spawn.room.energyAvailable}`
            // );
        }
    }
}

function updateSpawnQueue() {
    const roleCounts = {
        harvester: _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester').length,
        energyMiner: _.filter(Game.creeps, (creep) => creep.memory.role === 'energyMiner').length,
        carrier: _.filter(Game.creeps, (creep) => creep.memory.role === 'carrier').length,
        upgrader: _.filter(Game.creeps, (creep) => creep.memory.role === 'upgrader').length,
        builder: _.filter(Game.creeps, (creep) => creep.memory.role === 'builder').length
    };

    // Check if the role is already in the queue to avoid duplication
    const isRoleInQueue = (role) => Memory.spawnQueue.some((item) => item.role === role);

    // Add roles to the queue dynamically based on conditions
    if (roleCounts.harvester < 1 && !isRoleInQueue('harvester')) {
        Memory.spawnQueue.push({ role: 'harvester', body: [WORK, CARRY, MOVE] });
    }

    if (roleCounts.energyMiner < 2 && !isRoleInQueue('energyMiner')) {
        Memory.spawnQueue.push({ role: 'energyMiner', body: [WORK, WORK, MOVE] });
    }

    if (roleCounts.carrier < 2 && !isRoleInQueue('carrier')) {
        Memory.spawnQueue.push({ role: 'carrier', body: [CARRY, CARRY, MOVE, MOVE] });
    }

    if (roleCounts.upgrader < 2 && !isRoleInQueue('upgrader')) {
        Memory.spawnQueue.push({ role: 'upgrader', body: [WORK, CARRY, MOVE] });
    }

    if (roleCounts.builder < 2 && !isRoleInQueue('builder')) {
        Memory.spawnQueue.push({ role: 'builder', body: [WORK, CARRY, MOVE] });
    }
}

// Function to run roles for each creep
function runCreepRoles() {
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        switch (creep.memory.role) {
            case 'harvester':
                roleHarvester.run(creep);
                break;
            case 'energyMiner':
                roleEnergyMiner.run(creep);
                break;
            case 'carrier':
                roleCarrier.run(creep);
                break;
            case 'upgrader':
                roleUpgrader.run(creep);
                break;
            case 'builder':
                roleBuilder.run(creep);
                break;
        }
    }
}

// Function to build extensions
function manageExtensions() {
    for (var roomName in Game.rooms) {
        var room = Game.rooms[roomName];
        if (room.controller && room.controller.my) {
            extensionBuilder.buildExtensions(room);
        }
    }
}

function buildWallsAndTowers(room) {
    const terrain = new Room.Terrain(room.name);
    const spawnPos = room.find(FIND_MY_SPAWNS)[0].pos; // Get spawn position

    // Define coordinates for a 10x10 defensive perimeter with a 1-tile aisle
    const defensivePerimeter = [
        // Top row
        { x: spawnPos.x - 5, y: spawnPos.y - 5 }, { x: spawnPos.x - 4, y: spawnPos.y - 5 },
        { x: spawnPos.x + 4, y: spawnPos.y - 5 }, { x: spawnPos.x + 5, y: spawnPos.y - 5 },
        
        // Left and right sides
        { x: spawnPos.x - 5, y: spawnPos.y - 4 }, { x: spawnPos.x - 5, y: spawnPos.y + 4 },
        { x: spawnPos.x + 5, y: spawnPos.y - 4 }, { x: spawnPos.x + 5, y: spawnPos.y + 4 },
        
        // Bottom row
        { x: spawnPos.x - 5, y: spawnPos.y + 5 }, { x: spawnPos.x - 4, y: spawnPos.y + 5 },
        { x: spawnPos.x + 4, y: spawnPos.y + 5 }, { x: spawnPos.x + 5, y: spawnPos.y + 5 },
        
        // Middle sides
        { x: spawnPos.x - 4, y: spawnPos.y - 4 }, { x: spawnPos.x + 4, y: spawnPos.y - 4 },
        { x: spawnPos.x - 4, y: spawnPos.y + 4 }, { x: spawnPos.x + 4, y: spawnPos.y + 4 }
    ];

    // Build walls around the perimeter
    defensivePerimeter.forEach((pos) => {
        if (terrain.get(pos.x, pos.y) !== TERRAIN_MASK_WALL) { // Avoid natural walls
            room.createConstructionSite(pos.x, pos.y, STRUCTURE_WALL);
        }
    });

    // console.log(`Defensive walls initiated in room ${room.name}.`);

    // Place towers for defense
    const towerPositions = [
        { x: spawnPos.x - 7, y: spawnPos.y - 7 }, // Top-left corner
        { x: spawnPos.x + 7, y: spawnPos.y - 7 }, // Top-right corner
        { x: spawnPos.x - 7, y: spawnPos.y + 7 }, // Bottom-left corner
        { x: spawnPos.x + 7, y: spawnPos.y + 7 }  // Bottom-right corner
    ];

    towerPositions.forEach((pos) => {
        if (terrain.get(pos.x, pos.y) !== TERRAIN_MASK_WALL) { // Avoid natural walls
            room.createConstructionSite(pos.x, pos.y, STRUCTURE_TOWER);
        }
    });

    // console.log(`Towers initiated at strategic positions in room ${room.name}.`);
}

function manageTowers(room) {
    const towers = room.find(FIND_MY_STRUCTURES, {
        filter: { structureType: STRUCTURE_TOWER }
    });

    towers.forEach((tower) => {
        // Attack the closest hostile creep
        const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (closestHostile) {
            tower.attack(closestHostile);
        }

        // Repair the closest damaged structure
        const closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => structure.hits < structure.hitsMax && structure.structureType !== STRUCTURE_WALL
        });
        if (closestDamagedStructure) {
            tower.repair(closestDamagedStructure);
        }
    });
}

module.exports.loop = function () {
    cleanUpMemory(); // Step 1: Clean up memory of dead creeps
    // logCreepDetails(); // Step 2: Log creep details
    updateSpawnQueue();
    var spawn = Game.spawns['Spawn1'];
    manageSpawning(spawn); // Step 3: Manage creep spawning
    runCreepRoles(); // Step 4: Run creep roles

    // // Step 5: Manage defensive structures (walls and towers)
    // for (const roomName in Game.rooms) {
    //     const room = Game.rooms[roomName];
    //     if (room.controller && room.controller.my) {
    //         buildWallsAndTowers(room); // Build defensive structures
    //     }
    // }

    // manageExtensions(); // Step 6: Build extensions dynamically
};

