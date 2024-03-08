const { Gtk, Gdk, GLib, Vte, Pango } = imports.gi;

const VteTerminal = Widget.subclass(Vte.Terminal);

const colors = {
  foreground: "#dfdfe0",
  background: "#292a30",

  regular: [
    "#414453",
    "#ff8170",
    "#78c2b3",
    "#d9c97c",
    "#4eb0cc",
    "#ff7ab2",
    "#b281eb",
    "#dfdfe0",
  ],

  bright: [
    "#7f8c98",
    "#ffaea4",
    "#acf2e4",
    "#e4d9a4",
    "#6bdfff",
    "#ffadd0",
    "#dabaff",
    "#f9f9f9",
  ],
};

function hex2rgb(hex) {
  hex = hex.replace(/^#/, "");

  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return [r, g, b];
}

function rgbaColor(red, green, blue, alpha = 1.0) {
  const r = red / 255.0;
  const g = green / 255.0;
  const b = blue / 255.0;

  const rgba = new Gdk.RGBA();
  rgba.red = r;
  rgba.green = g;
  rgba.blue = b;
  rgba.alpha = alpha;

  return rgba;
}

export const ncmpcpp = VteTerminal({
  hexpand: true,
  setup: (self) => {
    self.spawn_sync(
      Vte.PtyFlags.DEFAULT,
      null,
      ["ncmpcpp"],
      null,
      GLib.SpawnFlags.SEARCH_PATH,
      null,
      null,
    );
    self.set_colors(
      rgbaColor(...hex2rgb(colors.foreground)),
      rgbaColor(...hex2rgb(colors.background)),
      [...colors.regular, ...colors.bright].map((color) => {
        return rgbaColor(...hex2rgb(color));
      }),
    );
    self.set_font(Pango.FontDescription.from_string("UbuntuMonoNerdFont 12"));
    self.on("child_exited", App.quit);
  },
});
