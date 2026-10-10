// The thirteen listings. Makes, models and specs are real (sources in docs/shots/shot-0.md and
// docs/lineup.md); prices, mileage, owners, condition and history are fiction written to read like fact.
// Paint, years and locations follow each car's licensed photo set, so the 3D model, painted from
// `colors.paint`, shows the same car the photos do.
import emblems from "@/content/emblems.json";
import lineup from "@/content/lineup.json";
import photos from "@/content/photos.json";

export type FramePrimitive = "arch" | "circle" | "square" | "half-disc";
export type Drivetrain = "FR" | "MR" | "RR" | "FF" | "AWD";
export type PhotoKind = "exterior" | "interior" | "detail" | "flaw";

/** Japanese auction-sheet codes: A scratch, U dent, W repaired or wavy panel, S rust; the digit is severity. */
export interface ConditionMark {
  code: string;
  /** Position on the top-down outline: x 0 = left side, 1 = right side; y 0 = nose, 1 = tail. */
  x: number;
  y: number;
  note: string;
}

export interface Photo {
  src: string;
  width: number;
  height: number;
  kind: PhotoKind;
  alt: string;
  credit: string;
  license: string;
  licenseUrl: string | null;
  sourceUrl: string;
}

/** The detail page's copy (docs/overhaul.md step 5, approved text in docs/overhaul-copy.md). */
export interface DetailCopy {
  /** The big behind-layer name in the hero, one entry per line. */
  heroName: string[];
  /** Section B's magazine headline, three lines about the model; the theme sets the case. */
  headline: string[];
  /** Section B's paragraph: the model's story. */
  about: string;
  /** Section C's scroll-to-reveal quote: this car in one sentence. */
  summary: string;
  ourTake: string;
  toKeepInMind: string;
  bodyStyle: string;
  sellerType: "Private" | "Dealer";
}

export interface Car extends DetailCopy {
  slug: string;
  no: number;
  year: number;
  make: string;
  model: string;
  /** Market name when it differs from the model, e.g. Eunos Roadster. */
  marketName?: string;
  chassis: string;
  marketNameJa: string;
  frame: FramePrimitive;
  priceUsd: number;
  mileageMi: number;
  location: string;
  steering: "LHD" | "RHD";
  spec: {
    engine: string;
    displacementCc: number;
    powerPs: number;
    powerKw: number;
    powerHp: number;
    torqueNm: number;
    torqueLbFt: number;
    transmission: string;
    drivetrain: Drivetrain;
    weightKg: number;
    lengthMm: number;
    widthMm: number;
    heightMm: number;
    wheelbaseMm: number;
  };
  colors: {
    /** The 3D model's paint (lib/materials.ts); metallic and pearl paints keep flake under the clear coat. */
    paint: { name: string; hex: string; metallic: boolean };
    interior: { name: string };
    wheels: { name: string };
  };
  take: string;
  highlights: string[];
  equipment: string[];
  modifications?: string[];
  condition: { grade: string; interior: "A" | "B" | "C" | "D"; marks: ConditionMark[] };
  provenance: {
    owners: number;
    service: { date: string; mileageMi: number; work: string }[];
    itemsIncluded: string[];
  };
}

type Slug = keyof typeof lineup;
type Listing = Omit<Car, "slug" | keyof DetailCopy>;

const listings: Record<Slug, Listing> = {
  "datsun-240k-gt": {
    no: 1,
    year: 1975,
    make: "Datsun",
    model: "240K GT",
    chassis: "C110",
    marketNameJa: "ケンメリ スカイライン",
    frame: "arch",
    priceUsd: 38_500,
    mileageMi: 88_900,
    location: "Utrecht, Netherlands",
    steering: "LHD",
    spec: {
      engine: "2.4 L L24 SOHC inline-six",
      displacementCc: 2393,
      powerPs: 130,
      powerKw: 96,
      powerHp: 128,
      torqueNm: 196,
      torqueLbFt: 145,
      transmission: "3-speed automatic",
      drivetrain: "FR",
      weightKg: 1240,
      lengthMm: 4460,
      widthMm: 1625,
      heightMm: 1385,
      wheelbaseMm: 2610,
    },
    colors: {
      paint: { name: "Silver Blue Metallic", hex: "#7c86ad", metallic: true },
      interior: { name: "Black vinyl" },
      wheels: { name: "Steel wheels with chrome trims" },
    },
    take: "In Japan this was the Skyline, and a television campaign about a young couple, Ken and Mary, gave it a nickname that stuck: Kenmeri. Export markets got it as the Datsun 240K GT, with the 2.4-litre L24 six from the 240Z under a long bonnet and the round tail lights every Skyline since has kept. This one was sold new in Kuwait, where the dry air kept the steel honest, and came to the Netherlands in 2016. Silver blue over black vinyl, on an automatic that suits a car this unhurried. A Skyline before the Skyline was a legend.",
    highlights: ["Kuwait-delivered 240K GT, left-hand drive", "The L24 six shared with the 240Z", "Dry-climate car, minimal rust"],
    equipment: ["Twin round tail lights", "Chrome bumpers", "Bench-style rear seat", "AM radio"],
    condition: {
      grade: "3.5",
      interior: "B",
      marks: [
        { code: "A2", x: 0.5, y: 0.02, note: "Chips and light pitting on the front bumper chrome." },
        { code: "W1", x: 0.85, y: 0.3, note: "Right front wing repainted; a close match in shade." },
        { code: "S1", x: 0.18, y: 0.92, note: "Surface rust starting at the left rear valance, treated." },
      ],
    },
    provenance: {
      owners: 3,
      service: [
        { date: "2025-02", mileageMi: 88_600, work: "Carburettor rebuild and ignition tune" },
        { date: "2023-07", mileageMi: 87_400, work: "Automatic transmission service and new mounts" },
        { date: "2020-11", mileageMi: 85_900, work: "Brakes overhauled, new hoses" },
      ],
      itemsIncluded: ["Owner's handbook", "Two keys", "Original radio", "Kuwaiti export papers and Dutch registration"],
    },
  },
  "triumph-tr6": {
    no: 2,
    year: 1972,
    make: "Triumph",
    model: "TR6",
    chassis: "CP",
    marketNameJa: "トライアンフ TR6",
    frame: "circle",
    priceUsd: 34_000,
    mileageMi: 61_200,
    location: "Baden-Württemberg, Germany",
    steering: "LHD",
    spec: {
      engine: "2.5 L inline-six, Lucas mechanical fuel injection",
      displacementCc: 2498,
      powerPs: 152,
      powerKw: 112,
      powerHp: 150,
      torqueNm: 222,
      torqueLbFt: 164,
      transmission: "4-speed manual with overdrive",
      drivetrain: "FR",
      weightKg: 1130,
      lengthMm: 3950,
      widthMm: 1550,
      heightMm: 1270,
      wheelbaseMm: 2235,
    },
    colors: {
      paint: { name: "Pure White", hex: "#eeede6", metallic: false },
      interior: { name: "Black leather" },
      wheels: { name: "Steel wheels with Rostyle trims" },
    },
    take: "Triumph needed a new TR and had no money for one, so Karmann redrew the TR5 in fourteen months: square the nose, cut the tail off flat, keep the doors. It worked. Everywhere but America kept the Lucas petrol injection, 150 bhp from 2.5 litres and a straight-six that sounds like it means it. This is a 1972 CP car, the last year of the full-power injection engine, a left-hand-drive European car in Pure White over black leather, with overdrive on third and fourth. Fill it with good fuel and keep the revs up.",
    highlights: ["Full-power 150 bhp injection engine", "European left-hand-drive car", "Heritage certificate"],
    equipment: ["Overdrive on third and fourth", "Soft top and tonneau cover", "Rostyle wheel trims", "Wood dashboard", "Leather seats"],
    condition: {
      grade: "4",
      interior: "B",
      marks: [
        { code: "A1", x: 0.5, y: 0.02, note: "Stone chips on the front valance." },
        { code: "U1", x: 0.14, y: 0.55, note: "Shallow dent low on the left door." },
      ],
    },
    provenance: {
      owners: 4,
      service: [
        { date: "2025-04", mileageMi: 61_000, work: "Fuel pump, metering unit and injectors overhauled" },
        { date: "2023-03", mileageMi: 60_100, work: "Overdrive solenoid and gearbox oil" },
        { date: "2020-06", mileageMi: 58_800, work: "Rear trailing-arm bushes and brakes" },
      ],
      itemsIncluded: ["Heritage certificate", "Tonneau cover", "Workshop manual", "Two keys"],
    },
  },
  "porsche-930": {
    no: 3,
    year: 1976,
    make: "Porsche",
    model: "911 Turbo",
    chassis: "930",
    marketNameJa: "ポルシェ 930 ターボ",
    frame: "square",
    priceUsd: 245_000,
    mileageMi: 54_300,
    location: "Düsseldorf, Germany",
    steering: "LHD",
    spec: {
      engine: "3.0 L 930/50 turbocharged flat-six",
      displacementCc: 2993,
      powerPs: 260,
      powerKw: 191,
      powerHp: 256,
      torqueNm: 329,
      torqueLbFt: 243,
      transmission: "4-speed manual",
      drivetrain: "RR",
      weightKg: 1210,
      lengthMm: 4291,
      widthMm: 1775,
      heightMm: 1311,
      wheelbaseMm: 2272,
    },
    colors: {
      paint: { name: "Copper Brown Metallic", hex: "#6b3a22", metallic: true },
      interior: { name: "Tan leather" },
      wheels: { name: "Fuchs forged alloys, black centres" },
    },
    take: "Porsche built the Turbo to homologate a racing car and expected to sell a few hundred. The 3.0-litre flat-six makes 260 PS and very little of it below 3,000 rpm; then the turbocharger wakes and the rear tyres learn what the flared arches are for. It has four gears because no five-speed of the time would hold the torque. This is a 1976 car, one of 2,819 three-litre Turbos, in Copper Brown over tan, with its whale tail and Fuchs wheels. Respect the boost and it will repay you.",
    highlights: ["One of 2,819 three-litre Turbos", "Copper Brown over tan", "Matching-numbers engine"],
    equipment: ["Whale-tail rear spoiler", "Fuchs forged wheels", "Tan leather sports seats", "Electric windows", "Air conditioning"],
    condition: {
      grade: "4.5",
      interior: "B",
      marks: [
        { code: "A1", x: 0.5, y: 0.02, note: "Chips on the front valance, touched in." },
        { code: "A1", x: 0.83, y: 0.8, note: "Polish marks on the right rear arch flare." },
      ],
    },
    provenance: {
      owners: 3,
      service: [
        { date: "2025-03", mileageMi: 54_100, work: "Major service, valve adjustment and new boost hoses" },
        { date: "2022-09", mileageMi: 53_200, work: "Clutch and gearbox oil" },
        { date: "2019-05", mileageMi: 52_000, work: "Heat exchangers and exhaust" },
      ],
      itemsIncluded: ["Porsche certificate of authenticity", "Original tool kit", "Books and wallet", "Two keys"],
    },
  },
  "peugeot-205-cj": {
    no: 4,
    year: 1993,
    make: "Peugeot",
    model: "205 CJ",
    chassis: "741B",
    marketNameJa: "プジョー 205 カブリオレ",
    frame: "half-disc",
    priceUsd: 9_800,
    mileageMi: 68_400,
    location: "Barcelona, Spain",
    steering: "LHD",
    spec: {
      engine: "1.4 L TU3M inline-four",
      displacementCc: 1360,
      powerPs: 75,
      powerKw: 55,
      powerHp: 74,
      torqueNm: 116,
      torqueLbFt: 86,
      transmission: "5-speed manual",
      drivetrain: "FF",
      weightKg: 905,
      lengthMm: 3705,
      widthMm: 1572,
      heightMm: 1381,
      wheelbaseMm: 2420,
    },
    colors: {
      paint: { name: "Blanc Meije", hex: "#efeee8", metallic: false },
      interior: { name: "Grey cloth" },
      wheels: { name: "Steel wheels with full covers" },
    },
    take: "Pininfarina designed the 205 cabriolet and built its bodies, and the CJ is the version with nothing to prove: a 1.4-litre four, 75 PS, 905 kg and a hood you fold by hand in under a minute. It is not a GTI, and it is better company for it on a coast road at 60. This 1993 car is white with the grey interior, still on its steel wheels, and has spent its life in Barcelona, which explains the tan on the dashboard and not much else. Summer, solved.",
    highlights: ["Pininfarina-built body", "Manual hood in good order", "Low running costs"],
    equipment: ["Manual soft top", "Roll hoop", "Tinted glass", "Cassette radio"],
    condition: {
      grade: "3.5",
      interior: "C",
      marks: [
        { code: "A2", x: 0.5, y: 0.98, note: "Scuffs across the rear bumper." },
        { code: "A1", x: 0.12, y: 0.46, note: "Light scratches on the left door." },
        { code: "U1", x: 0.88, y: 0.7, note: "Small dent on the right rear wing." },
      ],
    },
    provenance: {
      owners: 3,
      service: [
        { date: "2025-05", mileageMi: 68_200, work: "Timing belt, water pump and coolant" },
        { date: "2023-06", mileageMi: 66_900, work: "New hood rear window and seals" },
        { date: "2021-04", mileageMi: 65_300, work: "Brakes and shock absorbers" },
      ],
      itemsIncluded: ["Spanish registration papers", "Hood cover", "Two keys"],
    },
  },
  "honda-nsx-na1": {
    no: 5,
    year: 1991,
    make: "Honda",
    model: "NSX",
    chassis: "NA1",
    marketNameJa: "ホンダ NSX",
    frame: "arch",
    priceUsd: 92_000,
    mileageMi: 58_600,
    location: "Leicestershire, England",
    steering: "RHD",
    spec: {
      engine: "3.0 L C30A DOHC VTEC V6",
      displacementCc: 2977,
      powerPs: 255,
      powerKw: 188,
      powerHp: 252,
      torqueNm: 285,
      torqueLbFt: 210,
      transmission: "4-speed automatic",
      drivetrain: "MR",
      weightKg: 1365,
      lengthMm: 4405,
      widthMm: 1810,
      heightMm: 1170,
      wheelbaseMm: 2530,
    },
    colors: {
      paint: { name: "Formula Red", hex: "#c41e2c", metallic: false },
      interior: { name: "Black leather" },
      wheels: { name: "Factory alloys" },
    },
    take: "The NSX was the supercar that asked to be driven every day. An aluminium body, a 3.0-litre V6 behind the seats and a cockpit drawn around a fighter jet's visibility made rivals rethink their own cars. This is the automatic, the version purists skip, which is exactly why it is here: 252 hp, four ratios that suit long roads, and the same chassis Honda sharpened at the Nürburgring. Formula Red over black, pop-up headlights working as they should. A daily supercar, as intended.",
    highlights: [
      "All-aluminium semi-monocoque",
      "Rare automatic, ideal for long distances",
      "Pop-up headlights fully functional",
    ],
    equipment: ["Black leather interior", "Climate control", "Electric seats", "Factory alloy wheels", "Removable boot lining"],
    condition: {
      grade: "4.5",
      interior: "B",
      marks: [
        { code: "A1", x: 0.5, y: 0.02, note: "Stone chips along the front bumper, touched in." },
        { code: "U1", x: 0.83, y: 0.5, note: "Small dent in the right door, below the handle." },
      ],
    },
    provenance: {
      owners: 4,
      service: [
        { date: "2025-03", mileageMi: 58_100, work: "Timing belt, water pump and all fluids" },
        { date: "2023-06", mileageMi: 55_300, work: "Automatic transmission fluid and brake fluid" },
        { date: "2020-10", mileageMi: 51_900, work: "Tyres and four-wheel alignment" },
      ],
      itemsIncluded: ["Original book pack", "Two keys", "Indoor car cover", "Service history folder"],
    },
  },
  "jaguar-xj220": {
    no: 6,
    year: 1993,
    make: "Jaguar",
    model: "XJ220",
    chassis: "XJ220",
    marketNameJa: "ジャガー XJ220",
    frame: "circle",
    priceUsd: 585_000,
    mileageMi: 3_900,
    location: "Lakeland, Florida",
    steering: "LHD",
    spec: {
      engine: "3.5 L JV6 twin-turbocharged V6",
      displacementCc: 3498,
      powerPs: 550,
      powerKw: 405,
      powerHp: 542,
      torqueNm: 644,
      torqueLbFt: 475,
      transmission: "5-speed manual",
      drivetrain: "MR",
      weightKg: 1470,
      lengthMm: 4930,
      widthMm: 2009,
      heightMm: 1150,
      wheelbaseMm: 2640,
    },
    colors: {
      paint: { name: "Maroon metallic", hex: "#4f1622", metallic: true },
      interior: { name: "Cream leather" },
      wheels: { name: "Factory alloys" },
    },
    take: "Jaguar showed the XJ220 with a V12 and four-wheel drive. It arrived with a twin-turbocharged 3.5-litre V6 from racing, rear-wheel drive and 542 bhp, and some deposit holders never forgave it. Time has been kinder. It is 4,930 mm long and 2,009 mm wide, and a 1991 prototype lapped the Nürburgring in 7:46.36, faster than any production car before it. Only 282 were built. This one wears deep maroon over cream leather and has covered 3,900 miles, mostly to concours lawns. It deserves a long weekend.",
    highlights: ["One of 282 built", "3,900 miles from new", "Concours-presented"],
    equipment: ["Cream leather interior", "Air conditioning", "Factory alloy wheels", "Rear diffuser"],
    condition: {
      grade: "5",
      interior: "A",
      marks: [{ code: "A1", x: 0.5, y: 0.98, note: "Light marking on the rear diffuser from ramp loading." }],
    },
    provenance: {
      owners: 2,
      service: [
        { date: "2025-01", mileageMi: 3_850, work: "Annual service and fluids" },
        { date: "2022-04", mileageMi: 3_610, work: "New tyres, replaced on age" },
        { date: "2019-06", mileageMi: 3_400, work: "Annual service and new battery" },
      ],
      itemsIncluded: ["Books and records", "Car cover", "Battery conditioner", "Two keys"],
    },
  },
  "honda-integra-type-r-db8": {
    no: 7,
    year: 1997,
    make: "Honda",
    model: "Integra Type R",
    chassis: "DB8",
    marketNameJa: "インテグラ タイプR",
    frame: "square",
    priceUsd: 46_000,
    mileageMi: 82_300,
    location: "Saitama, Japan",
    steering: "RHD",
    spec: {
      engine: "1.8 L B18C DOHC VTEC inline-four",
      displacementCc: 1797,
      powerPs: 200,
      powerKw: 147,
      powerHp: 197,
      torqueNm: 181,
      torqueLbFt: 134,
      transmission: "5-speed manual, helical limited-slip differential",
      drivetrain: "FF",
      weightKg: 1100,
      lengthMm: 4525,
      widthMm: 1695,
      heightMm: 1355,
      wheelbaseMm: 2620,
    },
    colors: {
      paint: { name: "Championship White", hex: "#f1f0ea", metallic: false },
      interior: { name: "Black" },
      wheels: { name: "Factory five-spoke alloys" },
    },
    take: "Honda's engineers removed sound deadening, used thinner glass and fitted a helical limited-slip differential, then built a four-door version for people with friends. The B18C makes 200 PS from 1.8 litres and runs to 8,600 rpm, which still reads like a misprint. This is the Japanese-market DB8 sedan in Championship White, 1,100 kg and not a gram of it decorative. Front-wheel drive has rarely felt this deliberate. Now past 25 years, it can be exported to the US without fuss.",
    highlights: ["Japanese-market four-door Type R", "Championship White", "Eligible for US import"],
    equipment: ["Type R rear wing", "Helical limited-slip differential", "Factory alloy wheels", "Power windows"],
    condition: {
      grade: "4",
      interior: "B",
      marks: [
        { code: "A2", x: 0.12, y: 0.86, note: "Scratches on the left rear bumper corner." },
        { code: "U1", x: 0.88, y: 0.56, note: "Shallow dent in the right rear door." },
        { code: "S1", x: 0.5, y: 0.97, note: "Surface rust starting on the boot lid lip, treated." },
      ],
    },
    provenance: {
      owners: 3,
      service: [
        { date: "2025-06", mileageMi: 82_000, work: "Timing belt and water pump" },
        { date: "2023-04", mileageMi: 78_600, work: "Clutch and flywheel" },
        { date: "2021-09", mileageMi: 74_900, work: "Valve clearance adjustment" },
      ],
      itemsIncluded: ["Two keys", "Owner's manual", "Export documents prepared on request"],
    },
  },
  "lotus-elise": {
    no: 8,
    year: 1999,
    make: "Lotus",
    model: "Elise Sport 135",
    chassis: "S1",
    marketNameJa: "ロータス エリーゼ",
    frame: "half-disc",
    priceUsd: 36_500,
    mileageMi: 47_800,
    location: "Norfolk, England",
    steering: "RHD",
    spec: {
      engine: "1.8 L Rover K-series inline-four",
      displacementCc: 1796,
      powerPs: 137,
      powerKw: 101,
      powerHp: 135,
      torqueNm: 175,
      torqueLbFt: 129,
      transmission: "5-speed manual",
      drivetrain: "MR",
      weightKg: 755,
      lengthMm: 3726,
      widthMm: 1719,
      heightMm: 1202,
      wheelbaseMm: 2300,
    },
    colors: {
      paint: { name: "Silver metallic", hex: "#b4b7ba", metallic: true },
      interior: { name: "Pink Corbeau seats, red Alcantara wheel" },
      wheels: { name: "Five-spoke alloys" },
    },
    take: "Lotus glued it together. The chassis is extruded aluminium, bonded rather than welded; the body is fibreglass; the whole car weighs 755 kg, so even the standard 118 bhp is plenty. The Sport 135 adds a hotter Rover K-series with 135 bhp, a close-ratio gearbox and Corbeau seats in a pink nobody forgets. There is no servo for the steering and no need for one. Julian Thomson drew it, and Romano Artioli named it after his granddaughter, Elisa. This 1999 car is silver, with the hardtop, and has had its head gasket done properly. Take the long way home.",
    highlights: ["Sport 135, one of the first factory-built batch", "Hardtop and soft top", "Head gasket and cooling refreshed"],
    equipment: ["Hardtop", "Corbeau sports seats", "Red Alcantara steering wheel", "Exposed aluminium sills", "Five-spoke alloy wheels"],
    condition: {
      grade: "4",
      interior: "B",
      marks: [
        { code: "A1", x: 0.5, y: 0.02, note: "Stone chips on the nose, touched in." },
        { code: "W1", x: 0.82, y: 0.86, note: "Right rear clam repaired after a car-park scrape; gelcoat crazing beneath the paint." },
      ],
    },
    provenance: {
      owners: 5,
      service: [
        { date: "2025-04", mileageMi: 47_500, work: "Head gasket, steel dowels and uprated thermostat" },
        { date: "2023-05", mileageMi: 45_900, work: "Cambelt and water pump" },
        { date: "2020-08", mileageMi: 43_100, work: "Geometry, new tyres and brake pads" },
      ],
      itemsIncluded: ["Soft top and side screens", "Sport 135 build certificate", "Service history", "Two keys"],
    },
  },
  "fiat-barchetta": {
    no: 9,
    year: 1998,
    make: "Fiat",
    model: "Barchetta",
    chassis: "183",
    marketNameJa: "フィアット バルケッタ",
    frame: "arch",
    priceUsd: 12_500,
    mileageMi: 54_100,
    location: "Pinerolo, Italy",
    steering: "LHD",
    spec: {
      engine: "1.8 L 16V inline-four, variable valve timing",
      displacementCc: 1747,
      powerPs: 131,
      powerKw: 96,
      powerHp: 129,
      torqueNm: 164,
      torqueLbFt: 121,
      transmission: "5-speed manual",
      drivetrain: "FF",
      weightKg: 1056,
      lengthMm: 3916,
      widthMm: 1640,
      heightMm: 1265,
      wheelbaseMm: 2275,
    },
    colors: {
      paint: { name: "Rosso Speed", hex: "#c8161e", metallic: false },
      interior: { name: "Black cloth" },
      wheels: { name: "Factory alloys" },
    },
    take: "Fiat built the Barchetta on the Punto's floor and had Maggiora assemble it, and nobody minded, because it looked like this: a little boat with covered headlamps, door handles hidden in the bodywork and no fins at all. The 1.8-litre 16-valve four has variable valve timing and 131 PS, and front-wheel drive suits a car meant for lunch rather than lap times. Fiat only ever made it left-hand drive. This one is Rosso Speed and lives in the Piedmont hills, which it was made for.",
    highlights: ["Maggiora-built, pre-facelift", "Rosso Speed", "Hood replaced 2023"],
    equipment: ["Manual soft top", "Hidden door handles", "Factory alloy wheels", "Electric windows"],
    condition: {
      grade: "4",
      interior: "B",
      marks: [
        { code: "A1", x: 0.5, y: 0.01, note: "Stone chips on the front bumper." },
        { code: "A2", x: 0.86, y: 0.88, note: "Scratches on the right rear bumper corner." },
      ],
    },
    provenance: {
      owners: 2,
      service: [
        { date: "2025-05", mileageMi: 53_800, work: "Cambelt, variator and water pump" },
        { date: "2023-04", mileageMi: 52_100, work: "New hood and rear screen" },
        { date: "2020-09", mileageMi: 49_500, work: "Brakes and tyres" },
      ],
      itemsIncluded: ["Libretto and service book", "Two keys", "Hood cover"],
    },
  },
  "subaru-wrx-wagon-gg": {
    no: 10,
    year: 2002,
    make: "Subaru",
    model: "Impreza WRX Wagon",
    chassis: "GG",
    marketNameJa: "インプレッサ WRX ワゴン",
    frame: "circle",
    priceUsd: 14_900,
    mileageMi: 118_400,
    location: "Edmonton, Canada",
    steering: "LHD",
    spec: {
      engine: "2.0 L EJ205 turbocharged flat-four",
      displacementCc: 1994,
      powerPs: 230,
      powerKw: 169,
      powerHp: 227,
      torqueNm: 294,
      torqueLbFt: 217,
      transmission: "5-speed manual",
      drivetrain: "AWD",
      weightKg: 1420,
      lengthMm: 4415,
      widthMm: 1730,
      heightMm: 1485,
      wheelbaseMm: 2525,
    },
    colors: {
      paint: { name: "WR Blue Pearl", hex: "#1d3c8f", metallic: true },
      interior: { name: "Black cloth" },
      wheels: { name: "Factory alloys; winter set on steels" },
    },
    take: "Enthusiasts called it the bug eye, and Subaru redrew the nose within two years, but the round headlamps were never the point. Under the scoop is a 2.0-litre turbocharged flat-four with 227 hp and symmetrical all-wheel drive, in an estate with a roof rack and room for a dog. This 2002 wagon has done autocross in Alberta, summer and winter, on its own set of wheels for each, and the seller has the timing slips to prove it. It still does the school run on Mondays.",
    highlights: ["Bug-eye WRX wagon, five-speed manual", "Summer and winter wheel sets", "Autocross history, never tracked hard"],
    equipment: ["Roof rack", "Bonnet scoop", "Factory alloy wheels", "Winter wheels and tyres", "Fog lights"],
    modifications: ["Short-throw gear shifter", "Roof cross bars", "Performance brake pads"],
    condition: {
      grade: "3.5",
      interior: "C",
      marks: [
        { code: "A2", x: 0.5, y: 0.01, note: "Stone chips and a cone scuff on the front bumper." },
        { code: "A1", x: 0.15, y: 0.6, note: "Light scratches on the left rear door." },
        { code: "S1", x: 0.85, y: 0.82, note: "Surface rust on the right rear arch lip, treated." },
      ],
    },
    provenance: {
      owners: 2,
      service: [
        { date: "2025-05", mileageMi: 117_900, work: "Timing belt, water pump and head-gasket check" },
        { date: "2023-10", mileageMi: 113_600, work: "Clutch and rear differential oil" },
        { date: "2021-04", mileageMi: 108_200, work: "Turbo oil feed line and brakes" },
      ],
      itemsIncluded: ["Winter wheels and tyres", "Autocross timing slips", "Two keys", "Owner's manual"],
    },
  },
  "bmw-m5-e39": {
    no: 11,
    year: 2002,
    make: "BMW",
    model: "M5",
    chassis: "E39",
    marketNameJa: "BMW M5",
    frame: "square",
    priceUsd: 36_500,
    mileageMi: 96_200,
    location: "Kent, England",
    steering: "RHD",
    spec: {
      engine: "4.9 L S62 V8",
      displacementCc: 4941,
      powerPs: 400,
      powerKw: 294,
      powerHp: 394,
      torqueNm: 500,
      torqueLbFt: 369,
      transmission: "6-speed manual (Getrag 420G)",
      drivetrain: "FR",
      weightKg: 1795,
      lengthMm: 4783,
      widthMm: 1801,
      heightMm: 1412,
      wheelbaseMm: 2830,
    },
    colors: {
      paint: { name: "Carbon Black Metallic", hex: "#1a1e29", metallic: true },
      interior: { name: "Black leather" },
      wheels: { name: "Multi-spoke alloys" },
    },
    take: "The E39 M5 is the car people mean when they say they want a fast saloon. A 4.9-litre V8, 400 PS, a six-speed manual and nothing in its appearance to give any of it away. It was the first M5 with a V8, built on the same Dingolfing line as ordinary 5 Series, which is rather the point: a family car with 500 N·m. This one is Carbon Black over black leather, right-hand drive, with satellite navigation and every service stamped. It is the least showy car in the room and possibly the best.",
    highlights: ["First V8 M5", "Six-speed manual", "Full stamped service history"],
    equipment: ["Black leather", "Satellite navigation", "Xenon headlights", "Multi-spoke alloy wheels"],
    condition: {
      grade: "3.5",
      interior: "B",
      marks: [
        { code: "A2", x: 0.15, y: 0.42, note: "Scratches along the left doors from a car park." },
        { code: "U1", x: 0.5, y: 0.95, note: "Dent in the boot lid near the lock." },
        { code: "S1", x: 0.86, y: 0.86, note: "Light corrosion at the right rear arch lip, treated." },
      ],
    },
    provenance: {
      owners: 4,
      service: [
        { date: "2025-01", mileageMi: 95_800, work: "VANOS service and oil" },
        { date: "2023-02", mileageMi: 91_400, work: "Timing chain guides and tensioners" },
        { date: "2020-06", mileageMi: 86_900, work: "Clutch and brakes" },
      ],
      itemsIncluded: ["Stamped service book", "Two keys", "Navigation CD"],
    },
  },
  "lamborghini-gallardo": {
    no: 12,
    year: 2008,
    make: "Lamborghini",
    model: "Gallardo LP 560-4",
    chassis: "LP 560-4",
    marketNameJa: "ランボルギーニ ガヤルド",
    frame: "half-disc",
    priceUsd: 129_000,
    mileageMi: 21_400,
    location: "Flanders, Belgium",
    steering: "LHD",
    spec: {
      engine: "5.2 L V10",
      displacementCc: 5204,
      powerPs: 560,
      powerKw: 412,
      powerHp: 552,
      torqueNm: 540,
      torqueLbFt: 398,
      transmission: "6-speed e-gear",
      drivetrain: "AWD",
      weightKg: 1501,
      lengthMm: 4345,
      widthMm: 1900,
      heightMm: 1165,
      wheelbaseMm: 2560,
    },
    colors: {
      paint: { name: "Nero", hex: "#0e0e10", metallic: true },
      interior: { name: "Nero leather" },
      wheels: { name: "Factory alloys" },
    },
    take: "The Gallardo is the Lamborghini that made Lamborghini a business. Built under Audi ownership, it became the company's best-selling model of its time, 14,022 cars over a decade. The LP 560-4 is the revised car: a new 5.2-litre V10 with an uneven firing order, 560 PS at 8,000 rpm and four-wheel drive. This one is black, with the e-gear transmission, and it is quieter-looking than most Lamborghinis until you start it. Then it isn't.",
    highlights: ["Revised 5.2-litre LP 560-4", "Four-wheel drive", "Two owners"],
    equipment: ["E-gear with paddle shift", "Factory alloy wheels", "Leather interior", "Glass engine cover"],
    condition: {
      grade: "4.5",
      interior: "A",
      marks: [{ code: "A1", x: 0.5, y: 0.01, note: "Lip scrape under the nose, typical for the car." }],
    },
    provenance: {
      owners: 2,
      service: [
        { date: "2025-04", mileageMi: 21_200, work: "Annual service and e-gear calibration" },
        { date: "2023-05", mileageMi: 19_800, work: "Clutch measured at 82% remaining; fluids" },
        { date: "2021-06", mileageMi: 17_500, work: "Annual service and tyres" },
      ],
      itemsIncluded: ["Car cover", "Battery conditioner", "Books", "Two keys"],
    },
  },
  "mazda-mx-5-nc": {
    no: 13,
    year: 2007,
    make: "Mazda",
    model: "MX-5",
    chassis: "NC",
    marketNameJa: "マツダ ロードスター",
    frame: "arch",
    priceUsd: 11_900,
    mileageMi: 52_700,
    location: "Brisbane, Australia",
    steering: "RHD",
    spec: {
      engine: "2.0 L MZR LF-VE DOHC inline-four",
      displacementCc: 1999,
      powerPs: 160,
      powerKw: 118,
      powerHp: 158,
      torqueNm: 188,
      torqueLbFt: 139,
      transmission: "6-speed manual",
      drivetrain: "FR",
      weightKg: 1110,
      lengthMm: 4000,
      widthMm: 1720,
      heightMm: 1245,
      wheelbaseMm: 2330,
    },
    colors: {
      paint: { name: "Brilliant Black", hex: "#111214", metallic: false },
      interior: { name: "Black leather" },
      wheels: { name: "Dark-finish 17-inch alloys" },
    },
    take: "The third MX-5 grew, a little, and everyone worried. It needn't have: the NC shares its platform with the RX-8, carries a 2.0-litre four with 160 PS and a six-speed gearbox, and still weighs about as much as a family hatchback did in 1990. The hood still folds with one hand from the driver's seat. This is a 2007 Australian car, before the facelift, in Brilliant Black over black leather. It is the sensible choice in this room, and it will make you grin anyway.",
    highlights: ["2.0-litre with the six-speed manual", "Pre-facelift NC1", "Two owners from new"],
    equipment: ["Black leather heated seats", "Six-speed manual", "Limited-slip differential", "Dark-finish 17-inch alloys"],
    condition: {
      grade: "4",
      interior: "B",
      marks: [
        { code: "A1", x: 0.5, y: 0.02, note: "Stone chips on the front bumper." },
        { code: "A1", x: 0.85, y: 0.5, note: "Light scratch on the right door." },
      ],
    },
    provenance: {
      owners: 2,
      service: [
        { date: "2025-03", mileageMi: 52_400, work: "Annual service and new hood drain tubes" },
        { date: "2023-03", mileageMi: 49_800, work: "Coolant, brake fluid and spark plugs" },
        { date: "2021-02", mileageMi: 46_500, work: "Tyres and four-wheel alignment" },
      ],
      itemsIncluded: ["Service book", "Two keys", "Wind deflector"],
    },
  },
};

// Kept apart from the listings so the approved copy diffs line for line against docs/overhaul-copy.md.
// `take` stays on the listing until section C replaces it (shot 6f).
const detailCopy: Record<Slug, DetailCopy> = {
  "datsun-240k-gt": {
    heroName: ["240K", "GT"],
    headline: ["THE SKYLINE", "BEFORE THE", "LEGEND."],
    about:
      "In Japan it was the Skyline, and a television campaign about a young couple, Ken and Mary, named a generation: Kenmeri. Export markets knew it as the Datsun 240K GT, with the 2.4-litre L24 six from the 240Z under a long bonnet. It introduced the round tail lights every Skyline has carried since, and in Japan a 197-car run of GT-Rs made it a collector's car before anyone was collecting.",
    summary: "A Kenmeri sold new in Kuwait, kept dry for most of its life, and honest enough to show its age where it should.",
    ourTake:
      "Japanese classics of this era are leaving their home markets fast, and an export-spec car with papers is the sensible way in. Drive it as it is. The automatic suits the car's pace, and the L24 asks for little more than oil and patience.",
    toKeepInMind:
      "Chips and light pitting on the front bumper chrome. The right front wing was repainted, a close match. Surface rust has started at the left rear valance and has been treated, but it wants watching.",
    bodyStyle: "Hardtop coupe",
    sellerType: "Private",
  },
  "triumph-tr6": {
    heroName: ["TR6"],
    headline: ["KARMANN'S", "FOURTEEN-", "MONTH TRICK."],
    about:
      "Triumph needed a new TR and had no budget for one, so Karmann reworked the TR5 in fourteen months: a square nose, a flat cut-off tail, the same doors. Under the bonnet was a 2.5-litre straight six with Lucas mechanical fuel injection, 150 bhp in every market but America. The full-power engine lasted until 1972. After that, Triumph detuned it to 125 bhp.",
    summary:
      "One of the last full-power injected TR6s, a left-hand-drive European car in Pure White, with overdrive and a fuel system that has been properly sorted.",
    ourTake:
      "The injection is what makes a TR6 worth having, and on this car it has been overhauled by someone who understood it. Use good fuel, keep the revs up, and enjoy the overdrive switch on long roads.",
    toKeepInMind:
      "Stone chips on the front valance and a shallow dent low on the left door. Lucas injection rewards regular use and punishes long storage: drive it monthly.",
    bodyStyle: "Roadster",
    sellerType: "Private",
  },
  "porsche-930": {
    heroName: ["911", "TURBO"],
    headline: ["THE BENCHMARK", "FOR ALL THAT", "FOLLOWED."],
    about:
      "Porsche built the Turbo to homologate a racing car and expected to sell a few hundred. The 3.0-litre flat six made 260 PS and very little below 3,000 rpm; then the turbocharger arrived all at once. It had four gears because no five-speed of the day would hold the torque. Between 1975 and 1977, 2,819 three-litre Turbos were built.",
    summary:
      "A three-litre Turbo in Copper Brown over tan, matching numbers, with its whale tail and Fuchs wheels, and a service file that reads like a manual.",
    ourTake:
      "Early three-litre cars are the purest Turbos and the rarest. This one has had the expensive work done: heat exchangers, clutch, hoses. Keep to the service intervals, warm it properly, and respect the boost when the road is wet.",
    toKeepInMind:
      "Chips on the front valance, touched in, and polish marks on the right rear arch flare. The engine is original and dry, but a 930 always wants a specialist, not a general garage.",
    bodyStyle: "Coupe",
    sellerType: "Dealer",
  },
  "peugeot-205-cj": {
    heroName: ["205", "CJ"],
    headline: ["PININFARINA'S", "SUMMER", "RUNABOUT."],
    about:
      "Pininfarina designed the 205's cabriolet and built its bodies, and the CJ was the version with nothing to prove: a 1.4-litre four with 75 PS, 905 kg, and a hood folded by hand in under a minute. The GTI took the headlines. The CJ took the coast roads, and was better company there.",
    summary:
      "A white 205 CJ that has spent its whole life in Barcelona, still on its steel wheels, with a new hood and an engine that has never been asked for more than it has.",
    ourTake:
      "Cheap to buy, cheap to run, and more fun at 60 than most cars are at 100. Fit a period radio, fold the hood, and keep it for the summer. It is the least serious car here, and the most honest.",
    toKeepInMind:
      "Scuffs across the rear bumper, light scratches on the left door and a small dent on the right rear wing. The interior is tired from the sun: the dashboard has faded and the cloth has worn.",
    bodyStyle: "Cabriolet",
    sellerType: "Private",
  },
  "honda-nsx-na1": {
    heroName: ["NSX"],
    headline: ["THE SUPERCAR", "THAT HUMBLED", "FERRARI."],
    about:
      "The NSX asked a question nobody else had: why should a supercar be hard to use? Honda built it in aluminium, put a 3.0-litre VTEC V6 behind the seats, drew the cockpit around a fighter jet's visibility and sharpened the chassis at the Nürburgring. Rivals spent the next decade answering it.",
    summary:
      "The automatic NSX, the one purists skip, in Formula Red over black, with pop-up headlights that work and a timing belt that was done last spring.",
    ourTake:
      "The automatic suits what the NSX does best: covering long distances quickly without wearing you out. Prices for manuals have run away; this is the clever way to own the car. Use it every week.",
    toKeepInMind:
      "Stone chips along the front bumper, touched in, and a small dent in the right door below the handle. The automatic changes gear gently rather than quickly; that is the point of it.",
    bodyStyle: "Coupe",
    sellerType: "Dealer",
  },
  "jaguar-xj220": {
    heroName: ["XJ", "220"],
    // Rebalanced from the approved ["OXFORDSHIRE'S", "PROOF OF", "CRAFT AND FINESSE."]: the third line didn't
    // fit section B's headline column at any width (docs/overhaul-copy.md authorizes adjusting line breaks,
    // not wording, when a headline doesn't fit). Same words, same punctuation, just regrouped.
    headline: ["OXFORDSHIRE'S", "PROOF OF CRAFT", "AND FINESSE."],
    about:
      "Jaguar and Tom Walkinshaw Racing showed the XJ220 with a V12 and four-wheel drive. It arrived with a twin-turbocharged 3.5-litre V6 from racing, rear-wheel drive and 542 bhp, and some deposit holders never forgave it. In 1991 a prototype lapped the Nürburgring in 7:46.36, faster than any production car before it. 282 were built.",
    summary:
      "One of 282, in deep maroon over cream leather, with 3,900 miles from new, most of them driven to and from concours lawns.",
    ourTake:
      "The XJ220 has gone from punchline to blue chip, and low-mileage cars with complete records lead the way. This one needs nothing. It deserves a long weekend more than another trophy.",
    toKeepInMind:
      "Light marking on the rear diffuser from ramp loading. Its tyres are replaced on age, not wear, and the car is 2,009 mm wide: measure the garage first.",
    bodyStyle: "Coupe",
    sellerType: "Dealer",
  },
  "honda-integra-type-r-db8": {
    heroName: ["INTEGRA", "TYPE R"],
    headline: ["THE PUNCH", "FOR THE", "GENERAL PUBLIC."],
    about:
      "Honda's engineers took out sound deadening, fitted thinner glass and a helical limited-slip differential, and hand-finished the B18C's ports. The result made 200 PS from 1.8 litres and revved to 8,600 rpm. Then they built a four-door version, for people with friends. They even beat GT-Rs and STIs doing so.",
    summary:
      "A Japanese-market four-door Type R in Championship White, unmodified, 1,100 kg and not a gram of it decorative.",
    ourTake:
      "The sedan is the rarer, cleverer Type R, and an unmodified one is rarer still. Now past 25 years old, it can be imported to the United States without fuss. Keep it standard; that is where the value is.",
    toKeepInMind:
      "Scratches on the left rear bumper corner, a shallow dent in the right rear door, and surface rust starting on the boot lid lip, treated. The interior plastics show their age.",
    bodyStyle: "Sedan",
    sellerType: "Dealer",
  },
  "lotus-elise": {
    heroName: ["ELISE", "135"],
    headline: ["SIMPLICITY,", "THEN ADD", "LIGHTNESS."],
    about:
      "Lotus bonded the Elise rather than welding it: an extruded aluminium chassis, a fibreglass body, 755 kg in all. Julian Thomson drew it, and Romano Artioli named it after his granddaughter, Elisa. The Sport 135 added a hotter Rover K-series with 135 bhp, a close-ratio gearbox and Corbeau seats in a pink nobody forgets.",
    summary:
      "A silver Sport 135 with the hardtop and those pink seats, with the head gasket done properly and the steering still as talkative as the day it left Hethel.",
    ourTake:
      "The S1 is the purest Elise, and the Sport 135 is the S1 to have. With the K-series sorted it is reliable enough for weekends and sharp enough for track days. Take the long way home.",
    toKeepInMind:
      "Stone chips on the nose, touched in. The right rear clam was repaired after a car-park scrape, with some gelcoat crazing beneath the paint. Getting in and out takes practice.",
    bodyStyle: "Roadster",
    sellerType: "Private",
  },
  "fiat-barchetta": {
    heroName: ["BARCHETTA"],
    headline: ["A LITTLE BOAT", "FOR LONG", "ITALIAN LUNCHES."],
    about:
      "Fiat built the Barchetta on the Punto's floor and had Maggiora assemble it, and nobody minded, because of how it looked: covered headlamps, door handles hidden in the bodywork, no fins at all. A 1.8-litre 16-valve four with variable valve timing made 131 PS. Fiat only ever made it with left-hand drive.",
    summary: "A Rosso Speed Barchetta from the Piedmont hills, two owners, a new hood, and a cambelt done on time.",
    ourTake:
      "It is the Italian roadster you can actually run: Fiat parts, a simple engine and a hood that works. Buy it for the shape and the sound of the twin-cam at 6,000 rpm, and keep the cambelt on schedule.",
    toKeepInMind:
      "Stone chips on the front bumper and scratches on the right rear bumper corner. Left-hand drive only, as all Barchettas were. Earlier hoods leak at the corners; this one was replaced in 2023.",
    bodyStyle: "Roadster",
    sellerType: "Private",
  },
  "subaru-wrx-wagon-gg": {
    heroName: ["WRX", "WAGON"],
    headline: ["RALLY BRED,", "DOG", "APPROVED."],
    about:
      "Enthusiasts called it the bug-eye, and Subaru redrew the nose within two years, but the round headlamps were never the point. Under the scoop sat a 2.0-litre turbocharged flat-four with 227 hp and symmetrical all-wheel drive, in an estate with a roof rack and room for the dog.",
    summary:
      "A WR Blue bug-eye wagon that has done autocross in Alberta, summer and winter, on its own set of wheels for each, and still does the school run on Mondays.",
    ourTake:
      "Wagons were the WRX's best-kept secret, and a manual one with a documented history is worth finding. This one has been used as intended and maintained like it. Keep both sets of wheels.",
    toKeepInMind:
      "Stone chips and a cone scuff on the front bumper, light scratches on the left rear door, and rust starting on the right rear arch lip, treated. It has a short shifter, roof bars and performance brake pads.",
    bodyStyle: "Wagon",
    sellerType: "Private",
  },
  "bmw-m5-e39": {
    heroName: ["M5"],
    headline: ["THE FAMILY CAR", "WITH 500", "NEWTON METRES."],
    about:
      "The E39 M5 is the car people mean when they say they want a fast saloon. A 4.9-litre V8, 400 PS and a six-speed manual, built on the same Dingolfing line as ordinary 5 Series, with nothing in its appearance to give any of it away. It was the first M5 with a V8, and the last with this much restraint.",
    summary:
      "Carbon Black over black leather, right-hand drive, six-speed manual, with every service stamped and the timing chain guides already done.",
    ourTake:
      "The guides and the VANOS are the big E39 M5 jobs, and both are done. That leaves a car you can drive every day. It is the least showy car here, and possibly the best.",
    toKeepInMind:
      "Scratches along the left doors from a car park, a dent in the boot lid near the lock, and light corrosion at the right rear arch lip, treated. At 96,000 miles, budget for suspension bushes.",
    bodyStyle: "Sedan",
    sellerType: "Private",
  },
  "lamborghini-gallardo": {
    heroName: ["GALLARDO", "LP 560-4"],
    headline: ["THE BABY LAMBO", "THAT MADE", "IT A BUSINESS."],
    about:
      "Built under Audi ownership, the Gallardo became Lamborghini's best-selling model of its time: 14,022 cars in a decade. The LP 560-4 was the revised car, with a new 5.2-litre V10 that fired evenly at last, 560 PS at 8,000 rpm and four-wheel drive. It looks quieter than most Lamborghinis until it starts.",
    summary:
      "A black LP 560-4 on the e-gear, two owners, 21,400 miles, with the clutch measured at 82% and the paperwork to prove it.",
    ourTake:
      "The 560-4 is the Gallardo to have: the better engine and the revised chassis without later cars' prices. The e-gear divides opinion, but with its clutch in this health it is a known, budgeted quantity.",
    toKeepInMind:
      "A lip scrape under the nose, typical for the car. The e-gear clutch is a wear item; at 82% it has years left, but budget for it. Front-axle lift was not fitted, so mind steep driveways.",
    bodyStyle: "Coupe",
    sellerType: "Dealer",
  },
  "mazda-mx-5-nc": {
    heroName: ["MX-5"],
    headline: ["GROWN UP,", "BUT NOT", "OLD YET."],
    about:
      "The third MX-5 grew a little, and everyone worried. It needn't have: the NC shares much of its platform with the RX-8, carries a 2.0-litre four with 160 PS and a six-speed gearbox, and still weighs about as much as a family hatchback did in 1990. The hood still folds with one hand from the driver's seat.",
    summary:
      "A pre-facelift NC in Brilliant Black over black leather, two owners, the six-speed and a limited-slip differential, from Brisbane.",
    ourTake:
      "The NC is the most underrated MX-5: roomier, quieter, and every bit as willing. Prices are still low, so buy the best one you can find. Fit good tyres and keep the hood drains clear.",
    toKeepInMind:
      "Stone chips on the front bumper and a light scratch on the right door. The hood drains were renewed in 2025; blocked drains are the NC's one well-known weakness.",
    bodyStyle: "Roadster",
    sellerType: "Private",
  },
};

const sketchfab = (uid: string) => `https://sketchfab.com/3d-models/${uid}`;

export type CarWithAssets = Car & {
  photos: Photo[];
  model3d: { title: string; author: string; license: string; sourceUrl: string; src: string };
  /** The make's emblem; absent when no freely licensed mark exists (Lotus). */
  emblem?: (typeof emblems)[keyof typeof emblems];
};

export const cars: CarWithAssets[] = (Object.keys(listings) as Slug[])
  .map((slug) => {
    const model = lineup[slug];
    return {
      ...listings[slug],
      ...detailCopy[slug],
      slug,
      photos: (photos as Record<string, Photo[]>)[slug] ?? [],
      model3d: { title: model.title, author: model.author, license: model.license, sourceUrl: sketchfab(model.uid), src: `/models/${slug}.glb` },
      emblem: (emblems as Partial<Record<Slug, (typeof emblems)[keyof typeof emblems]>>)[slug],
    };
  })
  .sort((a, b) => a.no - b.no);

export function getCar(slug: string): CarWithAssets | undefined {
  return cars.find((car) => car.slug === slug);
}
