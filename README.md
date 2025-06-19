# aoi-music

Advanced music package for aoi.js with multi-platform support (YouTube, Spotify, SoundCloud and more).

## Features

- 🎵 Multi-platform support (YouTube, Spotify, SoundCloud)
- 🔄 Queue system with repeat modes
- 🔊 Audio filters and volume control
- ⚡ Efficient caching system
- 🤖 Easy integration with aoi.js

## Installation

```bash
npm install aoi-music
```

## Basic Usage

```js
const { AoiClient } = require("aoi.js");
const { AoiVoice, PlayerEvents, PluginName, Cacher, Filter } = require("@aoijs.music");


const client = new AoiClient({
    token: "Discord Bot Token", // Here goes the Token you copied earlier!
    prefix: "!", // Here goes the prefix you want to use for your bot!
    intents: ["MessageContent", "Guilds", "GuildMessages"],
    events: ["onMessage", "onInteractionCreate"],
    database: {
        type: "aoi.db",
        db: require("@aoijs/aoi.db"),
        dbType: "KeyValue",
        tables: ["main"],
        securityKey: "a-32-characters-long-string-here"
    }
});

const voice = new AoiVoice(client, {
    searchOptions: {
        soundcloudClientId: "YOUR_SOUNDCLOUD_CLIENT_ID",
        spotifyAuth: {
            clientId: "YOUR_SPOTIFY_CLIENT_ID",
            clientSecret: "YOUR_SPOTIFY_CLIENT_SECRET"
        }
    },
    devOptions: {
        debug: true
    }
});

// Example command
bot.command({
    name: "play",
    code: `
    $createPlayer[$guildID]
    $playTrack[$message;youtube.com/watch?v=dQw4w9WgXcQ]
    Now playing: $getTrackInfo[title]
    `
});
```