module.exports = {
    buildExtensions: function(room) {
        const extensions = room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_EXTENSION }
        });

        const extensionSites = room.find(FIND_CONSTRUCTION_SITES, {
            filter: { structureType: STRUCTURE_EXTENSION }
        });

        // Build extensions if under the limit for the current RCL
        const extensionLimit = CONTROLLER_STRUCTURES.extension[room.controller.level];
        if (extensions.length + extensionSites.length < extensionLimit) {
            const spawn = room.find(FIND_MY_SPAWNS)[0];
            if (!spawn) return;

            const radius = 3; // Distance from the spawn
            for (let x = -radius; x <= radius; x++) {
                for (let y = -radius; y <= radius; y++) {
                    const pos = new RoomPosition(spawn.pos.x + x, spawn.pos.y + y, room.name);
                    const terrain = room.getTerrain().get(pos.x, pos.y);

                    if (
                        terrain !== TERRAIN_MASK_WALL &&
                        pos.lookFor(LOOK_STRUCTURES).length === 0 &&
                        pos.lookFor(LOOK_CONSTRUCTION_SITES).length === 0
                    ) {
                        room.createConstructionSite(pos, STRUCTURE_EXTENSION);

                        if (extensions.length + extensionSites.length + 1 >= extensionLimit) {
                            return;
                        }
                    }
                }
            }
        }
    }
};
