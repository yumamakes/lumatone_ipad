// Hexboard overlay — shared dimensions and part modules.
// All values hardcoded in mm. z = 0 is the iPad glass. Hexes are pointy-top (a vertex points along +Y),
// matching the app's key grid (app/js/geometry.js).

$fn = 48;

// ---------- grid ----------
PITCH   = 24.15;                 // key centre-to-centre
ROW     = PITCH * sqrt(3) / 2;   // 20.914 between rows

// ---------- cap (translucent PETG) ----------
CAP_FLAT   = 21.0;   // outer flat-to-flat
CAP_H      = 9.0;
CAP_WALL   = 1.2;
CAP_TOP    = 1.6;    // top thickness
CAP_HOLE   = 4.3;    // stem through-hole
CB_D       = 8.4;    // counterbore for plunger head
CB_DEPTH   = 1.2;

// ---------- plunger (conductive PLA) ----------
HEAD_D     = 8.0;
HEAD_H     = 1.2;
STEM_D     = 4.0;
STEM_L     = 14.3;   // below the head

// ---------- tip cup (conductive PLA) + conductive foam ----------
CUP_D      = 7.5;
CUP_H      = 4.5;
SOCKET_D   = 4.05;   // press fit on the stem
SOCKET_DEPTH = 2.0;
POCKET_D   = 6.2;    // holds a 6 mm conductive foam disc
POCKET_DEPTH = 2.0;
FOAM_PROTRUDE = 1.5; // foam below the cup (foam disc 6 x 3.5 mm)

// ---------- vertical stack (rest position) ----------
REST_GAP     = 2.0;                                  // foam to glass at rest
CUP_TOP_Z    = REST_GAP + FOAM_PROTRUDE + CUP_H;     // 8.0: cup stops under the spider
SPIDER_Z     = CUP_TOP_Z;                            // spider bottom = plate bottom
SPIDER_T     = 1.5;
TRAVEL_STOP  = 3.0;                                  // cap bottom to spider at rest
CAP_BOTTOM_Z = SPIDER_Z + SPIDER_T + TRAVEL_STOP;    // 12.5
CAP_TOP_Z    = CAP_BOTTOM_Z + CAP_H;                 // 21.5
PLATE_TOP_Z  = CAP_TOP_Z - 2.0;                      // 19.5: caps stand 2 mm proud
// Pressed to the stop: foam is 1 mm into the glass (compressed), which is the pressure range.

// ---------- bore + spider (part of each housing) ----------
BORE_FLAT    = 21.4;  // 0.2 mm clearance per side
SPIDER_RING_ID = 4.6; // stem slides through
SPIDER_RING_OD = 9.0; // spring seat (spring: 0.5 mm wire, 7 mm OD, ~15 mm free length)
SPOKE_W      = 1.2;

// ---------- iPad Air 4 (A2316) ----------
IPAD_W   = 247.6;
IPAD_H   = 178.5;
IPAD_T   = 6.1;
IPAD_R   = 18.0;     // corner radius (approximate: measure yours)
SCREEN_W = 227.06;   // 2360 px / 264 ppi
SCREEN_H = 157.79;   // 1640 px / 264 ppi
STRIP    = 18.0;     // uncovered control strip along the top edge of the screen
// Key grid centre relative to screen centre (y up): matches app geometry.
GRID_Y   = -(SCREEN_H + STRIP) / 2 + SCREEN_H / 2;   // -9.0

// ---------- helpers ----------
module hex(flat, h) { rotate([0, 0, 30]) cylinder(r = flat / sqrt(3), h = h, $fn = 6); }

// Key centres for the 51-key grid: 6 rows of 9 / 8 keys, row 0 nearest the player.
function key_q(r, j) = (r % 2 == 1) ? j - 3.5 : j - 4;
function key_pos(r, j) = [key_q(r, j) * PITCH, GRID_Y + (r - 2.5) * ROW];

// ---------- parts ----------
// Cap: hollow hex, open at the bottom. Print top-down (top face on the bed).
module cap() {
  difference() {
    hex(CAP_FLAT, CAP_H);
    translate([0, 0, -0.01]) hex(CAP_FLAT - 2 * CAP_WALL, CAP_H - CAP_TOP);
    translate([0, 0, -1]) cylinder(d = CAP_HOLE, h = CAP_H + 2);
    translate([0, 0, CAP_H - CB_DEPTH]) cylinder(d = CB_D, h = CB_DEPTH + 1);
    // soft top edge
    translate([0, 0, CAP_H - 0.8])
      difference() { hex(CAP_FLAT + 2, 2); hex_chamfer(); }
  }
}
module hex_chamfer() {
  rotate([0, 0, 30]) cylinder(r1 = CAP_FLAT / sqrt(3), r2 = (CAP_FLAT - 1.6) / sqrt(3), h = 0.8, $fn = 6);
}

// Plunger: head sits flush in the cap's counterbore; stem runs down through the spider.
// Print head-down.
module plunger() {
  cylinder(d = HEAD_D, h = HEAD_H);
  cylinder(d = STEM_D, h = HEAD_H + STEM_L);
}

// Tip cup: socket on top (stem), pocket underneath (foam). Print socket-up.
module tip_cup() {
  difference() {
    cylinder(d = CUP_D, h = CUP_H);
    translate([0, 0, -0.01]) cylinder(d = POCKET_D, h = POCKET_DEPTH);
    translate([0, 0, CUP_H - SOCKET_DEPTH]) cylinder(d = SOCKET_D, h = SOCKET_DEPTH + 1);
  }
}

// Spider: three spokes from the bore wall to the spring-seat ring. Positioned at z = SPIDER_Z.
module spider() {
  translate([0, 0, SPIDER_Z]) {
    difference() {
      cylinder(d = SPIDER_RING_OD, h = SPIDER_T);
      translate([0, 0, -1]) cylinder(d = SPIDER_RING_ID, h = SPIDER_T + 2);
    }
    for (a = [0, 120, 240]) rotate([0, 0, a])   // toward the bore's flat sides
      translate([SPIDER_RING_OD / 2 - 0.5, -SPOKE_W / 2, 0])
        cube([BORE_FLAT / 2 - SPIDER_RING_OD / 2 + 1.5, SPOKE_W, SPIDER_T]);
  }
}

// Bore cut-out (through the plate), used with difference().
module bore() { translate([0, 0, SPIDER_Z - 1]) hex(BORE_FLAT, PLATE_TOP_Z - SPIDER_Z + 2); }

// Whole key assembly at rest, for previews.
module key_assembly() {
  color([0.6, 0.9, 0.8, 0.6]) translate([0, 0, CAP_BOTTOM_Z]) cap();
  color("dimgray") translate([0, 0, CAP_TOP_Z]) mirror([0, 0, 1]) plunger();
  color("dimgray") translate([0, 0, CUP_TOP_Z - CUP_H]) tip_cup();
  color("black") translate([0, 0, REST_GAP]) cylinder(d = 6, h = FOAM_PROTRUDE + POCKET_DEPTH);
}
