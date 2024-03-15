import Gio from "gi://Gio";

Gio._promisify(Gio.DataInputStream.prototype, "read_line_async");

class Mpd extends Service {
  static {
    Service.register(
      this,
      {},
      {
        //TODO: parse some properties like duration into number?
        partition: ["string", "r"],
        volume: ["string", "r"],
        repeat: ["string", "r"],
        random: ["string", "r"],
        single: ["string", "r"],
        consume: ["string", "r"],
        playlist: ["string", "r"],
        playlistlength: ["string", "r"],
        state: ["string", "r"],
        song: ["string", "r"],
        songid: ["string", "r"],
        nextsong: ["string", "r"],
        nextsongid: ["string", "r"],
        elapsed: ["string", "r"],
        duration: ["string", "r"],
        bitrate: ["string", "r"],
        mixrampdb: ["string", "r"],
        audio: ["string", "r"],

        file: ["string", "r"],
        "Last-Modified": ["string", "r"],
        Artist: ["string", "r"],
        Title: ["string", "r"],
        Album: ["string", "r"],
        Pos: ["string", "r"],
        Id: ["string", "r"],
      },
    );
  }

  #socket;

  #inputStream;
  #outputStream;

  _decoder = new TextDecoder();
  _encoder = new TextEncoder();
  _messageHandlerQueue = [];

  //TODO: more properties?

  // Status
  _partition;
  _volume;
  _repeat;
  _random;
  _single;
  _consume;
  _playlist;
  _playlistlength;
  _state;
  _song;
  _songid;
  _nextsong;
  _nextsongid;
  _elapsed;
  _duration;
  _bitrate;
  _mixrampdb;
  _audio;

  _file;
  _LastModified;
  _Artist;
  _Title;
  _Album;
  _Pos;
  _Id;

  get partition() {
    return this._partition;
  }

  get volume() {
    return this._volume;
  }

  get repeat() {
    return this._repeat;
  }

  get random() {
    return this._random;
  }

  get single() {
    return this._single;
  }

  get consume() {
    return this._consume;
  }

  get playlist() {
    return this._playlist;
  }

  get playlistlength() {
    return this._playlistlength;
  }

  get state() {
    return this._state;
  }

  get song() {
    return this._song;
  }

  get songid() {
    return this._songid;
  }

  get nextsong() {
    return this._nextsong;
  }

  get nextsongid() {
    return this._nextsongid;
  }

  get elapsed() {
    return this._elapsed;
  }

  get duration() {
    return this._duration;
  }

  get bitrate() {
    return this._bitrate;
  }

  get mixrampdb() {
    return this._mixrampdb;
  }

  get audio() {
    return this._audio;
  }

  get file() {
    return this._file;
  }

  get Last_Modified() {
    return this._LastModified;
  }

  get Artist() {
    return this._Artist;
  }

  get Title() {
    return this._Title;
  }

  get Album() {
    return this._Album;
  }

  get Pos() {
    return this._Pos;
  }

  get Id() {
    return this._Id;
  }

  constructor() {
    super();
    this._initSocket();
  }

  async _initSocket() {
    try {
      this.#socket = new Gio.SocketClient().connect_to_host(
        "localhost",
        6600,
        null,
      );

      this.#inputStream = new Gio.DataInputStream({
        base_stream: this.#socket.get_input_stream(),
      });

      this.#outputStream = new Gio.DataOutputStream({
        base_stream: this.#socket.get_output_stream(),
      });

      this._watchSocket();

      //init properties
      //TODO: init more properties?

      this.send("status")
        .then(this._updateProperties.bind(this))
        .catch(logError);
      this.send("currentsong")
        .then(this._updateProperties.bind(this))
        .catch(logError);
    } catch (e) {
      logError(e);
    }
  }

  async _watchSocket() {
    let bufferedLines = [];
    while (true) {
      const [rawData] = await this.#inputStream.read_line_async(0, null);
      const data = this._decoder.decode(rawData);
      if (data == null) continue;
      bufferedLines.push(data);
      const { response, remain } = this._parseResponse(bufferedLines);
      bufferedLines = remain;

      if (!response) continue;
      switch (response.type) {
        case "version":
          console.log(`MPD Server Version ${response.payload}`);
          break;
        case "error":
          this._handleMessage(new Error(response.payload), null);
          break;
        case "data":
          this._handleMessage(null, response.payload);
          break;
      }
    }
  }

  _parseResponse(lines) {
    let response;
    let beginLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const version = line.match(/^OK MPD (.+)/);
      const error = line.match(/^ACK \[.*] {.*} (.+)/);

      if (version) {
        response = { type: "version", payload: version[1] };
        beginLine = i + 1;
      } else if (error) {
        response = { type: "error", payload: error[1] };
        beginLine = i + 1;
      } else if (line === "OK") {
        response = {
          type: "data",
          payload: lines.slice(beginLine, i).join("\n"),
        };
        beginLine = i + 1;
      }
    }

    return { response, remain: lines.slice(beginLine) };
  }

  _handleMessage(err, msg) {
    const { func } = this._messageHandlerQueue.shift();
    func(err, msg);
    if (this._messageHandlerQueue.length === 0) {
      this._idle();
    }
  }

  async send(data) {
    data = data.trim();
    const isIdle = data === "idle";

    if (this._messageHandlerQueue[0]?.isIdle) {
      this.#outputStream.write(this._encoder.encode("noidle\n"), null);
    }
    this.#outputStream.write(this._encoder.encode(`${data}\n`), null);

    return new Promise((resolve, reject) => {
      this._messageHandlerQueue.push({
        isIdle,
        func: (err, msg) => {
          if (err != null) reject(err);
          resolve(msg);
        },
      });
    });
  }

  _idle() {
    this.send("idle")
      .then((msg) => {
        for (const line of msg.split("\n")) {
          const subsystem = /changed: (\w+)/.exec(line);
          if (subsystem == null) continue;

          //TODO: only update those things that could have
          //changed using a switch over the subsystems
          this.send("status")
            .then(this._updateProperties.bind(this))
            .catch(logError);
          this.send("currentsong")
            .then(this._updateProperties.bind(this))
            .catch(logError);
          /*
          switch(subsystem[1]) {
            case "player":
              break;
          }*/
        }
      })
      .catch(logError);
  }

  _updateProperties(msg) {
    for (const line of msg.split("\n")) {
      const keyValue = line.match(/(.*): (.*)/);
      if (keyValue == null) continue;
      const deprecatedKeys = [
        "time",
        "Time", //deprecated
        "Format", //same as audio
      ];
      if (deprecatedKeys.includes(keyValue[1])) continue;
      if (!this.hasOwnProperty(`_${keyValue[1]}`)) continue;
      this.updateProperty(keyValue[1], keyValue[2]);
      this.emit("changed");
    }
  }

  setCrossfade = (seconds) => this.send(`crossfade ${seconds}`);
  setVolume = (volume) => this.send(`setvol ${volume}`);

  toggleShuffle = () => this.send(`random ${+this._random ? "0" : "1"}`);
  toggleRepeat = () => this.send(`repeat ${+this._repeat ? "0" : "1"}`);

  next = () => this.send("next");
  playPause = () => this.send(`pause ${this._state === "pause" ? "0" : "1"}`);
  pause = () => this.send("pause 1");
  play = () => this.send("pause 0");
  playSong = (songpos) => this.send(`play ${songpos}`);
  playSongId = (songid) => this.send(`playid ${songid}`);
  seekSong = (songpos, time) => this.send(`seek ${songpos} ${time}`);
  seekSongId = (songid, time) => this.send(`seekid ${songid} ${time}`);
  seekCur = (time) => this.send(`seekcur ${time}`);
  previous = () => this.send("previous");
  stop = () => this.send("stop");

  clearQueue = () => this.send("clear");
}

const service = new Mpd();
export default service;
