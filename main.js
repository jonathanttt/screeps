// Import role modules and the spawn manager
var roleHarvester = require('role.harvester');
var roleEnergyMiner = require('role.energyminer');
var roleCarrier = require('role.carrier');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var spawnManager = require('spawn.manager');

// Initialize memory and spawn queue
Memory.Early = true;
if (!Memory.spawnQueue) {
    Memory.spawnQueue = [
        { role: 'harvester' },
        { role: 'harvester' },
        { role: 'energyMiner' },
        { role: 'carrier' },
        { role: 'energyMiner' },
        { role: 'carrier' }
    ];
}

function cleanUpMemory() {
    for (let name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log(`Clearing non-existing creep memory: ${name}`);
        }
    }
}

function manageSpawning(spawn) {
    if (spawn.spawning) {
        Memory.spawnInProgress = true;
        return;
    }

    Memory.spawnInProgress = false;

    if (Memory.spawnQueue.length > 0) {
        const nextInQueue = Memory.spawnQueue[0];
        const body = spawnManager.roleBodies[nextInQueue.role];
        const bodyCost = spawnManager.getBodyCost(body);

        if (spawn.room.energyAvailable >= bodyCost) {
            const spawnResult = spawnManager.checkAndSpawn(spawn, nextInQueue.role);

            if (spawnResult) {
                Memory.spawnQueue.shift();
            } else {
                console.log(`Failed to spawn ${nextInQueue.role}. Retrying next tick.`);
            }
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

    const isRoleInQueue = (role) =>
        Memory.spawnQueue.some((item) => item.role === role) ||
        _.some(Game.spawns, (spawn) => spawn.spawning && spawn.spawning.name.startsWith(role));

    if (roleCounts.energyMiner >= 3 && roleCounts.carrier >= 2) {
        Memory.Early = false;
        const harvester = _.find(Game.creeps, (creep) => creep.memory.role === 'harvester');
        if (harvester) {
            console.log(`Retiring harvester: ${harvester.name}`);
            harvester.memory.role = 'builder';
        }
    }

    if (Memory.Early && roleCounts.harvester <= 2 && !isRoleInQueue('harvester')) {
        Memory.spawnQueue.push({ role: 'harvester' });
    }

    if (roleCounts.energyMiner <= 3 && !isRoleInQueue('energyMiner')) {
        Memory.spawnQueue.push({ role: 'energyMiner' });
    }

    if (roleCounts.carrier <= 2 && !isRoleInQueue('carrier')) {
        Memory.spawnQueue.push({ role: 'carrier' });
    }

    if (roleCounts.upgrader <= 2 && !isRoleInQueue('upgrader')) {
        Memory.spawnQueue.push({ role: 'upgrader' });
    }

    const room = Game.spawns['Spawn1'].room;
    const hasConstructionSites = room.find(FIND_CONSTRUCTION_SITES).length > 0;

    if (
        room.controller.level >= 2 &&
        hasConstructionSites &&
        roleCounts.builder < 2 &&
        !isRoleInQueue('builder')
    ) {
        Memory.spawnQueue.push({ role: 'builder' });
    }
}

function manageExtensionsAndContainers(room) {
    if (room.controller.level >= 2) {
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if (!spawn) return;

        const extensionPositions = [
            { x: -2, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 1 }, { x: 2, y: 0 },
            { x: -2, y: -1 }, { x: -1, y: -2 }, { x: 0, y: -3 }, { x: 1, y: -2 }, { x: 2, y: -1 }
        ];

        extensionPositions.forEach((posOffset) => {
            const x = spawn.pos.x + posOffset.x;
            const y = spawn.pos.y + posOffset.y;

            if (room.getTerrain().get(x, y) !== TERRAIN_MASK_WALL) {
                const structures = room.lookForAt(LOOK_STRUCTURES, x, y);
                const constructionSites = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y);

                if (structures.length === 0 && constructionSites.length === 0) {
                    room.createConstructionSite(x, y, STRUCTURE_EXTENSION);
                }
            }
        });
    }
}

function runCreepRoles() {
    for (let name in Game.creeps) {
        const creep = Game.creeps[name];
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

module.exports.loop = function () {
    cleanUpMemory();
    updateSpawnQueue();

    const spawn = Game.spawns['Spawn1'];
    manageSpawning(spawn);

    const room = spawn.room;
    runCreepRoles();
    manageExtensionsAndContainers(room);
};
