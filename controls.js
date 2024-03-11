import Mpd from "./mpd.js";

function lengthString(length) {
  return (
    `${Math.floor(length / 60)
      .toString()
      .padStart(2, "0")}:` +
    `${Math.floor(length % 60)
      .toString()
      .padStart(2, "0")}`
  );
}

const previousButton = Widget.Button({
  onClicked: () => Mpd.previous(),
  child: Widget.Icon("media-skip-backward-symbolic"),
});

const playPauseButton = Widget.Button({
  onClicked: () => Mpd.playPause(),
  child: Widget.Icon({
    setup: (self) =>
      self.hook(
        Mpd,
        () => {
          self.icon = `media-playback-${Mpd.state === "play" ? "pause" : "start"}-symbolic`;
        },
        "notify::state",
      ),
  }),
});

const nextButton = Widget.Button({
  onClicked: () => Mpd.next(),
  child: Widget.Icon("media-skip-forward-symbolic"),
});

const songInfoLabel = Widget.Label({
  truncate: "end",
  maxWidthChars: 36,
  setup: (self) =>
    self.hook(Mpd, () => {
      self.label = `${Mpd.Artist} - ${Mpd.Title} / ${Mpd.Album}`;
    }),
});

const positionLabel = Widget.Label({
  setup: (self) =>
    self.poll(500, () => {
      Mpd.send("status").then((msg) => {
        const elapsed = msg.match(/elapsed: (\d+\.\d+)/)[1];
        self.label = `${lengthString(elapsed || 0)} / ${lengthString(Mpd.duration || 0)}`;
      });
    }),
});

const loopButton = Widget.Button({
  onClicked: () => Mpd.toggleRepeat(),
  child: Widget.Icon({
    icon: "media-playlist-repeat-symbolic",
    setup: (self) =>
      self.hook(
        Mpd,
        () => self.toggleClassName("on", +Mpd.repeat),
        "notify::repeat",
      ),
  }),
});

const shuffleButton = Widget.Button({
  onClicked: () => Mpd.toggleShuffle(),
  child: Widget.Icon("media-playlist-shuffle-symbolic"),
  setup: (self) =>
    self.hook(
      Mpd,
      () => self.toggleClassName("on", +Mpd.random),
      "notify::random",
    ),
});

export const positionSlider = Widget.Slider({
  drawValue: false,
  onChange: ({ value }) => Mpd.seekCur(value * Mpd.duration),
  setup: (self) => {
    self.poll(500, () => {
      Mpd.send("status").then((msg) => {
        const elapsed = msg.match(/elapsed: (\d+\.\d+)/)[1];
        self.value = elapsed / Mpd.duration || 0;
      });
    });
  },
});

export const controls = Widget.Box({
  className: "controls",
  spacing: 24,
  children: [
    previousButton,
    playPauseButton,
    nextButton,
    songInfoLabel,
    positionLabel,
    loopButton,
    shuffleButton,
  ],
});
