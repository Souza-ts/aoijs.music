const Player = require('./Player');

class MusicManager {
  constructor(client) {
    this.client = client;
    this.players = new Map();
  }

  async createPlayer(guildId) {
    const player = new Player(this, guildId);
    this.players.set(guildId, player);
    return player;
  }

  getPlayer(guildId) {
    return this.players.get(guildId);
  }

  async resolveTrack(query, platform = 'auto') {
  }
}

module.exports = MusicManager;