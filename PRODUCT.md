# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Blank Life is for aspiring and early-career software developers who enjoy social simulation and exploration, including mobile-first players who want short sessions.

## Product Purpose

Blank Life combines island exploration and developer practice as equal parts of one multiplayer game. Players travel through a shared world, choose a software-development path, complete practical challenges, and grow their character and career progression.

## Positioning

Developer practice takes place inside a persistent-feeling 3D life-simulation world: players go to locations, use in-game devices, and complete quests as part of their character's everyday island life.

## Operating Context

The game runs in a browser and is installable as a Progressive Web App. Players may explore as guests; accounts save progress and enable online presence. Controls and menus must work on desktop and mobile.

## Capabilities and Constraints

The game has a procedurally generated island, on-foot and vehicle movement, enterable activity flows, a phone, a laptop with a simulated terminal, developer career paths, original coding drills, quests, and Socket.IO multiplayer. Terminal commands run only in the in-game simulated workspace. XP and currency are fictional game rewards. The backend currently runs as one Node.js process with local SQLite; capacity for hundreds of simultaneous players has not been established.

## Brand Commitments

The product is named Blank Life. The user wants the game world to be 3D with a 2D anime look. Keep all game art original and avoid copying proprietary maps, characters, models, or logos.

## Evidence on Hand

The codebase includes a playable Three.js island, React game UI, original learning content, and an existing product requirements document at `docs/PRD.md`. No licensed character or map assets are supplied.

## Product Principles

1. Balance world exploration and developer learning equally.
2. Let players discover the island through movement and place-based play.
3. Make practice interactive and connected to the player's chosen developer path.
4. Keep game rewards fictional and claims about multiplayer capacity accurate.
5. Design touch controls and readable interfaces for mobile as well as desktop.
