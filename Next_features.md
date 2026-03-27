# PoC Next Features


## Performance✅
Very laggy. Is there a way to make it less laggy, and also a way to consistently test the lag?

IN other words in depth performance testing.

## Simple Fixes
✅Dev Nav Logs?: the coordinates of every stellar object displayed in a DIFFERENT LOG called the DEV LOG that can be toggled on and off in the settings.

⚠️(Maybe not, now that the titles are better)Stellar objects announce their name every time they are navigated to, like when they are discovered. They just don't give you gems the next time.

⚠️HUD showing upgrade status(I think we need to wait to see how we want to work movement. Maybe you can choose how many core's are activated. Maybe you can add engines to see how )
HUD object showing upgrade progress: Maybe different ships have different max stats.

## Medium Term Features

### ✅Enemies: 
Shoot at you, destroy for gems. Similar spawning system to asteroids.
Future: Differing difficulty, health and rewards.

### ✅Home Base and Docking
Add a new Stellar object type: Space Station. There is a Space Station Stellar Object at 0,0. 

Also add a new Docking action. Docking is done by the Player ship overlapping with the any Stellar Object. If a player docks at a space station their health slowly recharges. Docking at other Stellar objects do other things, but for now just let the player slowly gain gems.

### ✅New Enemy Types

I would like you to add some new enemy types. Make a Battleship class, that is large, moves slow and does a large amount of damage.

There should also be neutral ships that occasionally drop gems. They do not attack unless they are attacked first. They can still be destroyed.


### ✅Advanced Movement 

I'd like you to add a new type of engine. 

Two forms of engines. Boosted and Thruster engines. Thruster engines have a lower max speed. Boosted Engines have a higher max speed but take a second to charge up. Anythinb above a speed of 8 should probably be a boosted engine.

There is a HUD button that allows you to switch between engines, but also a hotkey on the keyboard. 

The player should be able to upgrade the speed for both.




### ✅Science points 

I would like you to add Science Points and Science Levels to the game. Science points are earned from discovering objects, regions, and docking at certain stellar objects including stars and nebulas. Each science point goes towards your next level. Each upgrade requires a certain science level as well as gems.

For example, a certain high level upgrade might cost 70 and recquire you to be at science level 15. This upgrade can not be purchased until you reach science level 15. 

Each Stellar object only has a finite amount of science points it can give you. This is represented in a progress bar underneath the title of the object. Once the progress bar is full, you can no longer earn science points from that object. 

Your science level should be visible in the HUD as well as progress to your next science level. Each Science level requires more science points to achieve.


Hmm I think its a little bit boring, but I really like it thematically. I wonder how I can make it more fun?



### ✅New Ships

Maybe each ship has their set 5 or so upgrades. When the player dies, the upgrades are reset. But New Ships have different Starting points and different max's.

For example the Base ship


OR Heck maybe, instead of upgrades, you just buy new ships??
is that crazy?




# Road to Gameplay PoC's


### Station Savers

2 stations and a planet that the player must save. 

Features neccesary: 
- ✅Corrupted Stellar object, that needs to be destroyed.
I'd like you to add a parasite feature. A Stellar object(usually planets or stations, but sometimes stars or nebulas too) has an enemy object on it that blocks the player from docking there and earning their effects. The enemy needs to be destroyed in order to be able to dock there. 

There are two types of parasites: blob parasites(green), and oppressors(red/orange. the same color as the enemy ships). They have different stats, and look slightly different.

Follow up: I think the. Blob one needs to be larger, and the oppressor needs to look slightly more intimidating. Like it is its own small space station oppressing the object. Add one of each blob to Polaris, and one oppressor to Johnsons Nebula


- ✅Ships that are on guard of a stellar object, or especially in the vicinity.
- ✅Variable difficulty for enemies.

OK I would like to implement two new features. Varying difficulty for enemies, and enemies guarding parasites(blobs and oppressors).
Around parasites, there should be a variable amount of guard ships. The number and type of guard ships is determined in the code. The ships should guard the parasite, and not leave its overall vicinity. In other words if the player runs away and gets far, the enemy ships should not attack.

I also would like to be able to specify and vary enemy difficulty. Meaning certain enemies have higher health and do more damage than others. This is also specified in the code. Our goal is to specify. Our goal is to be able to specify the difficulty level of each enemy. So that we can say enemies in this region are harder than enemies in this region. 

Make sure to integrate these features smoothly, and in a way that is easily scalable and follows best practices.



Discovering a clue to a station in a planet.
- ✅Messages from NPC's. Either comms in the HUD or message boxes near ships? Maybe game pauses for priority one stuff?
ooh what about this: Incoming hail that you can accept. This pauses the game maybe? They give you coordinates like there is something near [3,4]" or something like that.

Ok now lets add a new comms feature.
Add a new Communications tab to the HUD. This tab will display messages from NPC's. 
When an NPC flies within a certain vicinity to the player, they send a message that appears in the communications tab. Maybe there is a file that has a category for each ship. When a ship gets close enough a message is read from the file then put in the communications tab. Unless you can think of a better way to make this work


Now I would like you to implement a new feature: hailing communication. Planets, stations, and ships can send hailing communications. The player has to accept the hail in order to show it, then the message appears along with 2 options for the user to respond to. 

These types of communications will eventually happen whenever a major event happens like entering a region for the first time, after liberating a planet from a parasite/oppressor, seeing a or major story events. But now lets just do after liberating a planet from a parasite/oppressor.


There are two forms of communications, passive proximity based, and active hail based. 

For passive proximity comms, messages just show up when you are close enough to a ship, planet, or station. They disappear from the HUd after a few seconds.

For Active Hail based comms, you get a hail when a significant event has happened like entering a region for the first time, seeing a planet or station for the first time, or after liberating a planet. These messages will give the user 2 options to respond to.




I kind of like the idea of having a reputation score, so like if you choose one answer it gives a +1 to Peace, or +1 to intimidation. or something like that. Whether ships attack you or give you clues depends on each of your reputation scores.




- Do planet chains: Vulcan to tatoine to planet or someting like that.
- Maybe they give you within one coordinate of the planet.



OK I'd like to do an overhaul of proximity based comms. This is kind of a big change, so I want to make sure we're on the same page. Lets take a second to think it through and collaborate on how to do it in the most efficient, scalable way.

The new change is this: Planets, stations, and ships all have people you can talk to on them. Planets and stations have up to three, ships only have one. When you get close enough in proximity to a planet, station, or ship, the person shows up as an option to hail in the communications tab. You can then hail them to talk to them. 

Each person has some prewritten dialogue that is triggered based on what you have done in the game. For example, if vulcan has not been discovered yet Captain Yates from Deep Space 2 will say something like "I heard there is a planet called vulcan somewhere around here, Near (3,4)?" and if you have already discovered vulcan he might say something like "I heard you found vulcan, good job!"

So without making any changes, what are some possible ways that we could do this that are the most scalable, best practice, and efficient?


#### Add Artifact Stellar Objects

Ok I would like you to add 




### Fill In Regions




#### Future Region ideas:

The Star Empire has fighters and battleships and normal amount of asteroids.

The Frontier has a normal amount of asteroids and slightly more regular enemies. No battleships.

The Trade Federation has only neutral ships.

Random object frequency based on coordinates: Some coordinates are more likely to have objects like asteroids, or enemies than others.

Edges of the map. Named coordinates that you can't go past


Pop up discovery

### Adding more Stellar Objects

Deep Space 9
New Mombassa
Avolon Prime
Magnar

Or we could do more of a real star 

### Nav Hint Icons

Ok I would like to add a new feature called Nav Hints.

When the player enters a region, the discovered stellar objects in the region should show up as icons on the edge of the screen. These icons should point to their corresponding stellar objects. 

There also should be a nav hint icon for the other Regions of space. These icons should point to the center of the region. 

For example if the player is in the Badlands, there should be a nav hint icon pointing to each of the discovered, planets, stations, nebulas, and stars in the badlands. There should also be Nav hint icons for the other regions of space, pointing to the center of those regions.



### MAP


I would like you to add a map feature. The map should show regions, stellar objects, and the player. The map can be opened by pressing the 'M' key. Only regions and stellar objects that have been discovered should appear on the map.

I am not sure what the best way to implement this is. I think the map should only represent 30 points outward from 0,0.



A mini map that appears with regions, stellar objects, and the player in the corner of the screen. The map can be clicked on to open a new window that shows the entire map. Only regions and stellar objects that have been discovered should appear on the map.

The player should be able to select a way point on the map. Back in the main screen of the game, an arrow should point to the way point, on the edge of the screen.

I tried this once, it ended up being pretty tough. Gemini couldn't figure out how to get it to work. I tried once, and then gave it a prompt to debug it and it didn't work. SO maybe we'll come back to it.




### More complex

HyperSpace Travel: Expensive upgrade, allows you to travel to any object in nav logs? Or maybe lets you input any coordinate.

Build outposts? Space stations that you can dock at to earn science points and gems. Every time you visit them you earn points. For example, Docking at a space station, earns you 10 science points and 5 gems for however long you were gone.

Reputation Score: Determined by if you destroy other ships and stuff like that. Certain regions will attack you if you have a low enough reputation or something like that. And vice versa, evil regions might not, if you have a low enough reputation. Hyper spacing right near a planet might decrease it.



### Goal of the game:
Which is the goal of the game:
- Navigating complex relationships with Different regions and factions
ie: rescue missions, reputation, 
- Story mode: Evil bosses, a defined story. Doing quests like breath of the wild
- Build and Explore: find new planets, build outposts and station. Only fast travel to stations? 

Maybe a mix? Slightly open world. Real good guy and bad guy energy. Maybe mysterious blob people and blob world you must destroy?

Beat a boss in each region in order to unlock its benefits. For example, Beat the pirates in the trade federation, and they give you double gems at all of their planets.

Beat a boss in the Robotics region and earn double science from their planets.


Or maybe its like breath of the wild where your primary reason to upgrade your ships so you can survive in more difficult regions.


Each Region has a story quest, and a side quest?

### Future Features:
Space ship designs for purchase in the shop

NPC's: 
Clues of other discoveries given by travelers

