// 7-key cluster housing (build step 3): a centre key and its six neighbours.
// Sits on the screen on six plastic legs. Print upside down (top face on the bed), no supports.
include <common.scad>

MARGIN = 4;
LEG = 5;
CENTRES = concat([[0, 0]], [for (a = [0 : 60 : 300]) [PITCH * cos(a), PITCH * sin(a)]]);
OUTER = 2 * PITCH + BORE_FLAT + 2 * MARGIN;   // outer hex flat-to-flat

module cluster7() {
  difference() {
    union() {
      translate([0, 0, SPIDER_Z]) hex(OUTER, PLATE_TOP_Z - SPIDER_Z);
      // legs at the outer corners, clear of every bore
      for (a = [30 : 60 : 330]) rotate([0, 0, a])
        translate([OUTER / sqrt(3) - 6 - LEG / 2, -LEG / 2, 0]) cube([LEG, LEG, SPIDER_Z]);
    }
    for (c = CENTRES) translate([c[0], c[1], 0]) bore();
  }
  for (c = CENTRES) translate([c[0], c[1], 0]) spider();
}

cluster7();
