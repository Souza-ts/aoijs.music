const MusicManager = require('./classes/MusicManager');

module.exports = {
  MusicManager,
  initialize: (client) => {
    client.music = new MusicManager(client);
  }
};