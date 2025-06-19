const { AudioPlayer, createAudioResource, joinVoiceChannel, entersState, VoiceConnectionStatus, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');
const { formatTime } = require('../utils/helpers');

class Player {
  constructor(manager, guildId) {
    this.manager = manager;
    this.guildId = guildId;
    this.voiceChannel = null;
    this.textChannel = null;
    this.connection = null;
    this.audioPlayer = new AudioPlayer();
    this.queue = new Queue();
    this.currentTrack = null;
    this.repeatMode = 'off'; // 'off', 'track', 'queue'
    this.volume = 100;
    this.paused = false;
    this.position = 0;
    this.positionInterval = null;

    this._setupEventListeners();
  }

  _setupEventListeners() {
    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      if (!this.currentTrack) return;
      
      if (this.repeatMode === 'track') {
        this.play(this.currentTrack);
      } else {
        this.playNext();
      }
    });

    this.audioPlayer.on('error', error => {
      console.error('Player error:', error);
      this.playNext();
    });
  }

  async connect(channelId) {
    const guild = this.manager.client.guilds.cache.get(this.guildId);
    if (!guild) throw new Error('Guild not found');

    const channel = guild.channels.cache.get(channelId);
    if (!channel) throw new Error('Voice channel not found');

    this.voiceChannel = channelId;
    this.connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
    });

    this.connection.subscribe(this.audioPlayer);

    try {
      await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
      return true;
    } catch (error) {
      this.connection.destroy();
      throw new Error('Failed to connect to voice channel');
    }
  }

  async play(track = null) {
    if (track) this.currentTrack = track;
    if (!this.currentTrack) return false;

    try {
      const stream = await play.stream(this.currentTrack.url, {
        quality: 2,
        discordPlayerCompatibility: true
      });

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true
      });

      resource.volume.setVolume(this.volume / 100);
      this.audioPlayer.play(resource);
      this._startPositionTracker();
      this.paused = false;

      return true;
    } catch (error) {
      console.error('Play error:', error);
      this.playNext();
      return false;
    }
  }

  async playNext() {
    this._stopPositionTracker();
    this.currentTrack = this.queue.next();
    
    if (this.currentTrack) {
      return this.play();
    } else if (this.repeatMode === 'queue' && this.queue.tracks.length > 0) {
      this.queue.reset();
      return this.playNext();
    } else {
      this.manager.emit('queueEnd', this.guildId);
      return false;
    }
  }

  pause() {
    if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
      this.audioPlayer.pause();
      this.paused = true;
      this._stopPositionTracker();
      return true;
    }
    return false;
  }

  resume() {
    if (this.audioPlayer.state.status === AudioPlayerStatus.Paused) {
      this.audioPlayer.unpause();
      this.paused = false;
      this._startPositionTracker();
      return true;
    }
    return false;
  }

  stop() {
    this.audioPlayer.stop();
    this.queue.clear();
    this.currentTrack = null;
    this._stopPositionTracker();
    return true;
  }

  skip() {
    this.audioPlayer.stop();
    return true;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(volume, 200));
    if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
      const resource = this.audioPlayer.state.resource;
      if (resource.volume) {
        resource.volume.setVolume(this.volume / 100);
      }
    }
    return this.volume;
  }

  seek(position) {
  
  }

  _startPositionTracker() {
    this._stopPositionTracker();
    this.position = 0;
    this.positionInterval = setInterval(() => {
      this.position += 1;
    }, 1000);
  }

  _stopPositionTracker() {
    if (this.positionInterval) {
      clearInterval(this.positionInterval);
      this.positionInterval = null;
    }
  }

  destroy() {
    this._stopPositionTracker();
    this.stop();
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }
    this.manager.players.delete(this.guildId);
  }
}

module.exports = Player;