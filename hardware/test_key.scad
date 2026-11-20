// Single-key test housing (build step 1). Sits directly on the screen on four plastic legs
// (non-conductive, so they don't register as touches). Line the bore up with the hex outline in touch-test/.
// Print upside down (top face on the bed), no supports: the spider spokes bridge.
include <common.scad>

BLOCK = 40;
LEG = 5;

module test_key() {
  difference() {
    union() {
      translate([-BLOCK / 2, -BLOCK / 2, SPIDER_Z]) cube([BLOCK, BLOCK, PLATE_TOP_Z - SPIDER_Z]);
      for (x = [-1, 1], y = [-1, 1])
        translate([x * (BLOCK / 2 - LEG / 2) - LEG / 2, y * (BLOCK / 2 - LEG / 2) - LEG / 2, 0])
          cube([LEG, LEG, SPIDER_Z]);
    }
    bore();
    // alignment notches on the four sides, on the key centre lines
    for (a = [0, 90, 180, 270]) rotate([0, 0, a])
      translate([BLOCK / 2 - 1, -0.5, PLATE_TOP_Z - 2]) cube([2, 1, 3]);
  }
  spider();
}

test_key();
