// Visual check only (not for printing): test housing cut in half with a key at rest, on the glass.
include <common.scad>
use <test_key.scad>

difference() {
  union() {
    color("white") test_key();
    key_assembly();
    color([0.1, 0.1, 0.12]) translate([-30, -30, -1]) cube([60, 60, 1]);  // glass
  }
  translate([-50, -50, -10]) cube([100, 50, 50]);  // cut away the front half
}
