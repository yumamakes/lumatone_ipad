// Full 51-key frame for the iPad Air 4 (A2316), landscape, control strip along the top edge.
// - Plate (z 8 → 19.5) holds 51 bores with spring spiders; open window over the control strip.
// - Bezel band (z 0 → 8) rests on the glass outside the active screen area only.
// - Corner clips wrap the iPad's corners; ports and buttons along the edges stay clear.
// Print upside down (top face on the bed), no supports. Footprint 252.6 x 183.5 mm: needs a 256 mm bed.
include <common.scad>

WALL         = 2.5;   // outer wall thickness
CLEAR        = 0.3;   // clearance around the iPad
LIP          = 1.0;   // clip lip under the iPad's back edge
LIP_T        = 0.8;
BEZEL_MARGIN = 2.0;   // band stays this far outside the active screen
CLIP_X       = 40;    // clip length along the long edges, from each corner
CLIP_Y       = 20;    // clip length along the short edges, from each corner

OUT_W = IPAD_W + 2 * WALL;
OUT_H = IPAD_H + 2 * WALL;

module rrect(w, h, r, z) {
  linear_extrude(z) offset(r = r) square([w - 2 * r, h - 2 * r], center = true);
}

module plate() {
  translate([0, 0, SPIDER_Z]) rrect(OUT_W, OUT_H, IPAD_R + WALL, PLATE_TOP_Z - SPIDER_Z);
}

module bezel_band() {
  difference() {
    rrect(OUT_W, OUT_H, IPAD_R + WALL, SPIDER_Z + 0.01);
    translate([0, 0, -1]) linear_extrude(SPIDER_Z + 2)
      square([SCREEN_W + 2 * BEZEL_MARGIN, SCREEN_H + 2 * BEZEL_MARGIN], center = true);
  }
}

module corner_clips() {
  intersection() {
    difference() {
      translate([0, 0, -(IPAD_T + LIP_T)]) rrect(OUT_W, OUT_H, IPAD_R + WALL, IPAD_T + LIP_T + 0.01);
      // iPad body
      translate([0, 0, -IPAD_T]) rrect(IPAD_W + 2 * CLEAR, IPAD_H + 2 * CLEAR, IPAD_R + CLEAR, IPAD_T + 0.02);
      // opening inside the lip
      translate([0, 0, -(IPAD_T + LIP_T) - 1])
        rrect(IPAD_W - 2 * LIP, IPAD_H - 2 * LIP, IPAD_R - LIP, LIP_T + 2);
    }
    for (sx = [-1, 1], sy = [-1, 1])
      translate([sx * (OUT_W / 2 - CLIP_X / 2), sy * (OUT_H / 2 - CLIP_Y / 2), -20])
        cube([CLIP_X, CLIP_Y, 40], center = true);
  }
}

module strip_window() {
  translate([-SCREEN_W / 2, SCREEN_H / 2 - STRIP, SPIDER_Z - 1])
    cube([SCREEN_W, STRIP, PLATE_TOP_Z - SPIDER_Z + 2]);
}

module frame() {
  difference() {
    union() { plate(); bezel_band(); corner_clips(); }
    for (r = [0 : 5], j = [0 : (r % 2 == 1 ? 7 : 8)])
      translate(concat(key_pos(r, j), 0)) bore();
    strip_window();
  }
  for (r = [0 : 5], j = [0 : (r % 2 == 1 ? 7 : 8)])
    translate(concat(key_pos(r, j), 0)) spider();
}

frame();
