# Screeps

## Overview
This repository contains a game bot for **Screeps**, an MMO sandbox strategy game. This bot is designed to manage in-game tasks efficiently.

## Strategy Architecture
The bot is built around a robust strategy architecture to optimize in-game progression, resource management, and role distribution:

- **Creeps Management**:
  - Automatically assigns tasks based on dynamic role control.
  - Transitions roles and redistributes workforce based on game state.
  - Manages creep TTL (time to live) and healing operations to maintain efficiency.

- **Adaptive Spawn Queue System**:
  - Prioritizes spawning creeps according to immediate room needs.
  - Maintains a flexible queue to balance roles dynamically during gameplay.

- **Resource Optimization**:
  - Strategically manages resource collection and delivery for maximum efficiency.
  - Prioritizes mining positions for energy miners, with carriers acting as key transporters.

- **Threat Awareness**:
  - Implements logic to avoid hostile threats and reassign creeps as necessary.
  - Dynamically adjusts creep tasks to mitigate risks and ensure safety.

- **Infrastructure Planning**:
  - Allocates resources intelligently between construction, upgrades, and energy storage.
  - Designs road and container placements to optimize creep travel distances.

## Roles (Now)
### Harvester
Harvesters collect energy from available sources and deliver it to spawn points, extensions, or storage structures. They are vital in the early game when miners and carriers are insufficient in number.

### Energy Miner
Miners focus exclusively on extracting energy from sources, maintaining high efficiency by staying stationed at a source. They rely on carriers for energy transportation.

### Carrier
Carriers transport energy from sources or dropped piles to spawn points, extensions, or other energy-requiring structures. They support all roles by ensuring smooth resource flow.

### Builder
Builders use stored energy to construct and repair structures, playing a critical role in room expansion and infrastructure upgrades.

### Upgrader
Upgraders use energy to enhance the room's controller, unlocking advanced technologies and room capabilities.

## Strategy
1. **Early Game**:
   - Focus on spawning harvesters to establish a steady energy supply.
   - Transition to energy miners and carriers as energy income stabilizes.
   - Introduce builders and upgraders to begin room development and controller upgrades.

2. **Mid Game**:
   - Scale mining operations by increasing the number of miners and carriers.
   - Deploy builders to accelerate room development and construct defenses.
   - Maintain a consistent upgrader count to ensure controller progress.
   - Plan roads and container placements to minimize creep travel time and energy waste.
   - working....

3. **Late Game**:
   - Havent live until this time....
   - Active attack?

