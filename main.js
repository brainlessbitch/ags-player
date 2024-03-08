#!/usr/bin/env -S ags -b "ncmpcpp" -c

const { Gtk } = imports.gi;

const Window = Widget.subclass(Gtk.Window, "Window");

import { ncmpcpp } from "./ncmpcpp.js";
import { cover } from "./cover.js";
import { positionSlider, controls } from "./controls.js";

Window({
  child: Widget.Box({
    vertical: true,
    children: [
      Widget.Box({
        vexpand: true,
        children: [cover, ncmpcpp],
      }),
      positionSlider(),
      controls,
    ],
  }),
  setup: (self) => {
    self.show_all();

    self.on("destroy", App.quit);
  },
});

App.iconTheme = "adwaita";
export default {
  style: "./style.css",
};
