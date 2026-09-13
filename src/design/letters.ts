/**
 * letters.ts — the wordmark, one shape per letter.
 *
 * GENERATED from the source artwork by extracting each shape and taking its
 * bounding box from the browser. Do not hand-edit; re-run the extractor.
 *
 * The logo was already drawn as eight separate shapes, one per letter, which is
 * the only reason this is possible — a single outline path would have to be cut
 * apart analytically. Each letter keeps its own tight viewBox so it can be
 * positioned as an independent object, which is what an animation needs.
 *
 * `home` is the letter's place in the original mark, in the mark's own
 * coordinate space. The animation starts there and returns there.
 */
export type Letter = {
  char: string;
  viewBox: string;
  home: { x: number; y: number; w: number; h: number };
  shape: { kind: 'path' | 'polygon'; data: string };
};

/** The mark's own coordinate space, so positions can be expressed as fractions. */
export const WORDMARK_CANVAS = { w: 1745.239990234375, h: 1296 };

export const WORDMARK_LETTERS: Letter[] = [
  {
    char: "Y",
    viewBox: "72.16 147.78 402.19 607.81",
    // position within the original 1745x1296 mark, so the letters start in the
    // real composition rather than in a layout this file invents
    home: { x: 78.16, y: 153.78, w: 390.19, h: 595.81 },
    shape: { kind: "polygon", data: "78.16 334.79 200.16 519.67 203.79 749.59 253.05 719.36 250.95 525.64 468.35 223.13 456.39 153.78 226.96 469.23 109.57 290.37 78.16 334.79" },
  },
  {
    char: "A",
    viewBox: "306.29 438.57 271.44 382.78",
    // position within the original 1745x1296 mark, so the letters start in the
    // real composition rather than in a layout this file invents
    home: { x: 312.29, y: 444.57, w: 259.44, h: 370.78 },
    shape: { kind: "path", data: "M425.8,444.57l-113.51,341.02,41.04,29.76,44.16-129.35,103.44-4.8,35.76,111.36,35.04-54-87.84-269.51-58.08-24.48ZM415.66,634.65s34.83-105.61,34.83-105.61c.28,1.06,33.43,101.54,33.14,102.6-.14.33-67.99,2.92-67.97,3.01Z" },
  },
  {
    char: "M",
    viewBox: "538.9 231.62 355.6 393.11",
    // position within the original 1745x1296 mark, so the letters start in the
    // real composition rather than in a layout this file invents
    home: { x: 544.9, y: 237.62, w: 343.6, h: 381.11 },
    shape: { kind: "polygon", data: "753.23 496.08 816.71 336.44 842.36 597.2 888.5 543.57 860.05 255.45 802.87 237.62 716.21 446.58 614.59 275.78 560.62 298.23 544.9 558.63 591.44 618.73 607.77 365.1 694.37 508.09 753.23 496.08" },
  },
  {
    char: "A",
    viewBox: "669.87 511.38 366.42 418.98",
    // position within the original 1745x1296 mark, so the letters start in the
    // real composition rather than in a layout this file invents
    home: { x: 675.87, y: 517.38, w: 354.42, h: 406.98 },
    shape: { kind: "polygon", data: "947.3 601.96 988.17 837.3 1030.29 792.36 991.36 565.87 930.49 517.38 843.26 709.37 775.66 541.98 717.62 584.98 675.87 886.85 720.1 924.36 760.45 640.18 811.76 770.77 871.21 767.59 947.3 601.96" },
  },
  {
    char: "M",
    viewBox: "825.46 745.16 363.28 382.97",
    // position within the original 1745x1296 mark, so the letters start in the
    // real composition rather than in a layout this file invents
    home: { x: 831.46, y: 751.16, w: 351.28, h: 370.97 },
    shape: { kind: "polygon", data: "1089.34 751.16 985.7 942.58 918.04 789.11 867.59 810.89 831.46 1070.19 877.65 1101.86 907.09 891.36 953.66 997.54 1020.34 985.25 1103.8 829.15 1138.18 1122.13 1182.74 1071.63 1147.75 780.86 1089.34 751.16" },
  },
  {
    char: "M",
    viewBox: "1034.17 326.62 260.11 381.11",
    // position within the original 1745x1296 mark, so the letters start in the
    // real composition rather than in a layout this file invents
    home: { x: 1040.17, y: 332.62, w: 248.11, h: 369.11 },
    shape: { kind: "path", data: "M1123.87,533.63l86.26,28.75,40.55,139.35,37.6-48.66-81.04-286.04-66.33-34.41-100.74,289.45,27.67,67.49,56.03-155.94ZM1167.28,410.38l26.28,93.53-52.94-17.84,26.67-75.69Z" },
  },
  {
    char: "A",
    viewBox: "1188.63 664.79 286.52 397.83",
    // position within the original 1745x1296 mark, so the letters start in the
    // real composition rather than in a layout this file invents
    home: { x: 1194.63, y: 670.79, w: 274.52, h: 385.83 },
    shape: { kind: "path", data: "M1317.14,670.79l-122.51,244.27,33.24,42.21,38.47-73.58,115.04,16.06,44.07,156.87,43.7-28.76-90.76-320.46-61.25-36.6ZM1289.93,835.63l47.14-92.47,28.67,102.9-75.81-10.43Z" },
  },
  {
    char: "N",
    viewBox: "1446.01 502.59 278.2 407.64",
    // position within the original 1745x1296 mark, so the letters start in the
    // real composition rather than in a layout this file invents
    home: { x: 1452.01, y: 508.59, w: 266.2, h: 395.64 },
    shape: { kind: "polygon", data: "1680.11 508.59 1631.83 810.96 1520.88 607.25 1475.45 636.07 1452.01 863.69 1496.94 904.23 1516.9 703.38 1623.6 898.47 1675.72 858.8 1718.21 579.41 1680.11 508.59" },
  },
];
