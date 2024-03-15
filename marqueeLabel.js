const { Gtk, cairo } = imports.gi;
const register = Widget.register;

class MarqueeLabel extends Gtk.DrawingArea {
  static {
    register(this, {
      properties: {
        label: ["string", "rw"],
        "scroll-speed": ["int", "rw"],
      },
    });
  }

  #xOffset;
  #scrollDirection;

  get label() {
    return this._label;
  }

  set label(label) {
    this._label = label;
    this.queue_draw();
    this.notify("label");
  }

  get scroll_speed() {
    return this._scrollSpeed;
  }

  set scroll_speed(speed) {
    this._scrollSpeed = speed;
    this.notify("scroll-speed");
  }

  constructor(props) {
    super(props);

    this._reset();

    this.poll(this._scrollSpeed * 10, () => this.queue_draw());

    this.on("size-allocate", () => this._reset());
    this.on("notify::label", () => this._reset());
  }

  _reset() {
    this.#xOffset = 0;
    this.#scrollDirection = -1;
  }

  vfunc_draw(cr) {
    const allocation = this.get_allocation();
    const styles = this.get_style_context();
    const width = allocation.width;
    const height = allocation.height;
    const color = styles.get_color(Gtk.StateFlags.NORMAL);
    const [fontFamily] = styles.get_property(
      "font-family",
      Gtk.StateFlags.NORMAL,
    );
    const fontSize = Math.floor(
      styles.get_property("font-size", Gtk.StateFlags.NORMAL),
    );

    cr.setSourceRGB(color.red, color.green, color.blue);
    cr.selectFontFace(fontFamily, null, null);
    cr.setFontSize(fontSize);

    const labelWidth = cr.textExtents(this._label).width;

    if (labelWidth > width) {
      this.#xOffset += this.#scrollDirection * this._scrollSpeed;

      if (this.#xOffset >= 0 || this.#xOffset <= width - labelWidth) {
        this.#scrollDirection *= -1;
      }
    } else {
      this.#xOffset = (width - labelWidth) / 2;
    }

    cr.moveTo(this.#xOffset, fontSize);
    cr.showText(this._label);
  }
}

export default MarqueeLabel;
