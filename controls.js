const Mpris = await Service.import("mpris");

function length2string(length) {
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
  onClicked: () => Mpris.getPlayer("mpd")?.previous(),
  child: Widget.Icon("media-skip-backward-symbolic"),
});

const playPauseButton = Widget.Button({
  onClicked: () => Mpris.getPlayer("mpd")?.playPause(),
  child: Widget.Icon({
    setup: (self) =>
      self.hook(Mpris, () => {
        const playbackStatus = Mpris.getPlayer("mpd")?.playBackStatus;
        self.icon = `media-playback-${playbackStatus === "Playing" ? "pause" : "start"}-symbolic`;
      }),
  }),
});

const nextButton = Widget.Button({
  onClicked: () => Mpris.getPlayer("mpd")?.next(),
  child: Widget.Icon("media-skip-forward-symbolic"),
});

const songInfoLabel = Widget.Label({
  truncate: "end",
  maxWidthChars: 36,
  setup: (self) =>
    self.hook(Mpris, () => {
      const artisits = Mpris.getPlayer("mpd")?.trackArtists.join(";");
      const title = Mpris.getPlayer("mpd")?.trackTitle;
      const album = Mpris.getPlayer("mpd")?.trackAlblum;
      self.label = `${artisits} - ${title} / ${album}`;
    }),
});

const positionLabel = Widget.Label({
  setup: (self) =>
    self.poll(1000, () => {
      const position = Mpris.getPlayer("mpd")?.position;
      const length = Mpris.getPlayer("mpd")?.length;
      self.label = `${length2string(position)} / ${length2string(length)}`;
    }),
});

const loopButton = Widget.Button({
  onClicked: () => Mpris.getPlayer("mpd")?.loop(),
  child: Widget.Icon({
    icon: "media-playlist-repeat-symbolic",
    setup: (self) =>
      self.hook(Mpris, () => {
        const loopStatus = Mpris.getPlayer("mpd")?.loopStatus;
      }),
  }),
});

const shuffleButton = Widget.Button({
  onClicked: () => Mpris.getPlayer("mpd")?.shuffle(),
  child: Widget.Icon("media-playlist-shuffle-symbolic"),
});

export const positionSlider = () => {
  const poll = Variable(0, {
    poll: [
      1000,
      () => {
        const mpd = Mpris.getPlayer("mpd");
        return mpd?.position / mpd?.length || 0;
      },
    ],
  });

  poll.stopPoll();
  return Widget.Slider({
    value: poll.bind(),
    drawValue: false,
    onChange: ({ value }) => {
      const mpd = Mpris.getPlayer("mpd");
      mpd.position = value * mpd?.length;
    },
    setup: (self) => {
      self.hook(
        Mpris,
        () => {
          Mpris.getPlayer("mpd") ? poll.startPoll() : poll.stopPoll();
        },
        "notify::players",
      );
    },
  });
};

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
