# esi-fleet-tool
ESI Fleet Tool for EVE Online

Anything marked with a ? will be subject to inclusion if feasible. This document is to be used as a hard guideline for the building and maintenance of the application. As this document changes, so does the application. This document is subject to change without notice.

## Organization

The ESI Fleet Tool (herein called EsiFT) will be organized into individual pages and a discord bot that represent a GROUP of activities that can be performed by the EsiFT users.

#### GROUP 1
Group 1 activities will include the splash page that can serve as a login portal as well as a place to display basic information about EVE Online servers. Group 1 pages can be customized to fit the needs of the corp or alliance using the tool. Official EVE logos including corp logos and alliance logos can be inserted in predefined locations. The logo displayed can be managed by Group 4.

#### GROUP 2 - will interact with discord bot
Group 2 activities will take place separately from the site. These activities are available to any discord user with permission to see the discord channel that the bot operates in. Activities include:
1. Signing up for an available fleet.
2. Indicate fleet role preferences

#### GROUP 3
Group 3 activities are available to fleet commanders.
1. Cataloging members that request to join
2. Seeing fleet member skills
3. Assigning fleet members to roles based on their skills and indicated role preferences

#### GROUP 4
Group 4 activities are available to site administrators. Activities include:
1. Changing display logo
2. Changing site theme
3. Customizing site theme?
4. Choosing what Discord servers (guild)/member roles are able to access the site


## How it works
FC logs into the site and posts information about a fleet operation. Completion of this task triggers the discord bot to make a post in the appropriate fleet operations channel as determined by the site admins. Access to the site will be controlled. Only those belonging to a certain server and having a certain role in the discord will be allowed to access the site. Access to the site will be controlled by Discord Auth flow.

### How to determine who can access site:
* Admin user with admin username and password (set during initial setup process)
    * Admin dashboard will only be accessible when using the admin login flow
    * User logged in with admin login flow will not have access to normal FC processes
* User attempting to log in using discord auth flow will have FC privileges
* Site will check user id and guild (discord servers) that user is in
    * If guild ids contains the set guild id (set by site admin)
    * Check user id and guild member roles
    * If user’s guild member roles contain the set role id (set by site admin)
        * Allow the user to log in.
    * Else
        * Deny login, log the login attempt and possibly notify in a private chat channel?

### Once FC is logged in:
* Allow FC to determine Doctrine (dropdown list set by site admin? Type in box?)
* Pull list of corp fittings from ESI that contain the doctrine name
* Allow FC to choose which ships from that doctrine will be allowed to fly (in case doctrine contains placeholder ships like a frigate that only contains implants in the cargo, etc.)
* Enter information about fleet, date, time, description, title, etc. Once finished, the discord bot will post this in the fleet operations channel as an embed with buttons, dropdowns, bells, and whistles.
* Site can see what fleets FC is in
* Site can see who else is in the fleet?
* When a user joins the fleet, they will be in a list showing their preferred roles, how many are filling that role, etc.
* FC can select user to see what ships of the doctrine they can fly
* ???


### Fleet members can:
* Interact with discord bot:
    * Select preferred roles (determined by site admin? Determined by FC?)
        * Choose whether they are good with split-braining
        * Choose if they would like to be anchor for their role
        * Select how many they are bringing of each role
        * ???
    * Get a ping some time before fleet time. 1 hour? 30 minutes?
        * Ping will be in a thread, not in the main channel. Thread will be deleted after 24 hours? Should not require discord admins to have to delete each thread, but it might be nice to have historic data on who usually signs up and what roles they usually fill.

## Current DEV checklist
- [x] Develop DB with node-persist flatfile storage
    - [x] Users table
        - [x] Discord ID
        - [x] EVE Account
        - [x] Allow many-to-one EVE &harr; Discord relationship
    - [x] Characters table
    - [x] Fleets table
- [ ] Flesh out user system
- [ ] Create Discord Auth flow for users
    - [ ] Allow Discord users to stay logged in
- [ ] Create EVE Auth flow for users to register to their Discord accounts
- [ ] Build FC Dashboard
    - [ ] Pull corp fittings from ESI
    - [ ] Allow custom EFT for custom doctrine
    - [ ] Choose what fittings are allowed
    - [ ] Gather fleet information (doctrine, date, time, objective, etc)
    - [ ] Show fleet composition with preferred roles
    - [ ] Get skills needed to fly fitted ship.
    - [ ] Get player skills
- [ ] Build Discord Bot for
    - [ ] Fleet event notifications
        - [ ] Planned event
        - [ ] On-Demand event
    - [ ] Buttons, Dropdowns, Bells, and Whistles for interaction
    - [ ] Ping 1 hour before planned event
    - [ ] Ping for On-Demand event
