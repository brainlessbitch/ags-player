const { Gtk } = imports.gi;

const Mpris = await Service.import("mpris");

const AspectFrame = Widget.subclass(Gtk.AspectFrame);

export const cover = Widget.Box({
  className: "coverBox",
  child: AspectFrame({
    hexpand: true,
    ratio: 1,
    child: Widget.Box({
      className: "cover",
      setup: (self) =>
        self.hook(Mpris, () => {
          const mpd = Mpris.getPlayer("mpd");
          self.css = `background-image: url("${mpd?.coverPath}");`;
        }),
    }),
  }),
});
