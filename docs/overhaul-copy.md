# Detail page copy

Part 2 of step 5 in `docs/overhaul.md`. New per-car fields for the detail page and the copy for all 13 cars,
written from the existing listings in `lib/cars.ts` so facts, flaws and modifications stay consistent. Status:
**approved by the user on 2026-10-08, with the user's own edits.** Use this text verbatim; it goes into `lib/cars.ts`
in shot 6a. Nothing here is in the code yet.

Voice: the house curator, as before. Short declarative sentences, specific numbers, a dry closing line, no hype words
("iconic", "legendary", "stunning"). Makes, models and specs are real; everything about the individual car (owners,
condition, history, seller) is fiction written to read like fact.

## The fields

| Field | Where it appears | Length | Notes |
| --- | --- | --- | --- |
| `heroName` | Hero, the big behind-layer name (frame 1) | 2–3 lines, 1–2 words each | The model as an enthusiast says it, split into lines by hand. The make and year sit under it. |
| `headline` | Section B, the magazine headline (frame 4) | 3 lines, ≤ 24 characters per line | About the model, not this car. Set in capitals by the theme. |
| `about` | Section B, the paragraph under the headline | 55–75 words | The model's story: what it was, why it mattered. |
| `summary` | Section C, the large scroll-to-reveal quote (frame 8) | 25–40 words | This car in one sentence, as the curator would say it out loud. |
| `ourTake` | Section C, "Our take" | 35–50 words | Advice to a buyer: why this one, what to do with it. |
| `toKeepInMind` | Section C, "To keep in mind" | 30–45 words | The honest part: flaws, modifications, quirks, drawn from the condition marks and modifications. |
| `bodyStyle` | Spec table | 1–2 words | Coupe, roadster, cabriolet, sedan, wagon. |
| `sellerType` | Spec table | 1 word | Private or Dealer. |
| `exteriorColor`, `interiorColor` | Spec table, bottom bar (colour) | — | The existing `colors.paint.name` and `colors.interior.name`; listed here for completeness. |

The existing `take` (the long paragraph) is retired from the page: its history moves into `about`, its advice into
`ourTake`. `highlights`, `equipment`, `modifications`, `condition` and `provenance` move into the equipment and
history overlay unchanged.

**Spec table rows** (section C, frame 7), all from existing data plus the two new fields: make, model (with chassis),
mileage, location, body style, drivetrain, transmission; engine, displacement, power and torque, exterior colour,
interior colour, seller type.

---

## 01 · 1975 Datsun 240K GT (C110)

- **heroName:** 240K / GT
- **headline:** THE SKYLINE / BEFORE THE / LEGEND.
- **about:** In Japan it was the Skyline, and a television campaign about a young couple, Ken and Mary, named a
  generation: Kenmeri. Export markets knew it as the Datsun 240K GT, with the 2.4-litre L24 six from the 240Z under a
  long bonnet. It introduced the round tail lights every Skyline has carried since, and in Japan a 197-car run of
  GT-Rs made it a collector's car before anyone was collecting.
- **summary:** A Kenmeri sold new in Kuwait, kept dry for most of its life, and honest enough to show its age where it
  should.
- **ourTake:** Japanese classics of this era are leaving their home markets fast, and an export-spec car with papers
  is the sensible way in. Drive it as it is. The automatic suits the car's pace, and the L24 asks for little more
  than oil and patience.
- **toKeepInMind:** Chips and light pitting on the front bumper chrome. The right front wing was repainted, a close
  match. Surface rust has started at the left rear valance and has been treated, but it wants watching.
- **bodyStyle:** Hardtop coupe · **sellerType:** Private

## 02 · 1972 Triumph TR6 (CP)

- **heroName:** TR6
- **headline:** KARMANN'S / FOURTEEN- / MONTH TRICK.
- **about:** Triumph needed a new TR and had no budget for one, so Karmann reworked the TR5 in fourteen months: a
  square nose, a flat cut-off tail, the same doors. Under the bonnet was a 2.5-litre straight six with Lucas
  mechanical fuel injection, 150 bhp in every market but America. The full-power engine lasted until 1972. After
  that, Triumph detuned it to 125 bhp.
- **summary:** One of the last full-power injected TR6s, a left-hand-drive European car in Pure White, with overdrive
  and a fuel system that has been properly sorted.
- **ourTake:** The injection is what makes a TR6 worth having, and on this car it has been overhauled by someone who
  understood it. Use good fuel, keep the revs up, and enjoy the overdrive switch on long roads.
- **toKeepInMind:** Stone chips on the front valance and a shallow dent low on the left door. Lucas injection rewards
  regular use and punishes long storage: drive it monthly.
- **bodyStyle:** Roadster · **sellerType:** Private

## 03 · 1976 Porsche 911 Turbo (930)

- **heroName:** 911 / TURBO
- **headline:** THE BENCHMARK / FOR ALL THAT / FOLLOWED.
- **about:** Porsche built the Turbo to homologate a racing car and expected to sell a few hundred. The 3.0-litre flat
  six made 260 PS and very little below 3,000 rpm; then the turbocharger arrived all at once. It had four gears
  because no five-speed of the day would hold the torque. Between 1975 and 1977, 2,819 three-litre Turbos were built.
- **summary:** A three-litre Turbo in Copper Brown over tan, matching numbers, with its whale tail and Fuchs wheels,
  and a service file that reads like a manual.
- **ourTake:** Early three-litre cars are the purest Turbos and the rarest. This one has had the expensive work done:
  heat exchangers, clutch, hoses. Keep to the service intervals, warm it properly, and respect the boost when the road
  is wet.
- **toKeepInMind:** Chips on the front valance, touched in, and polish marks on the right rear arch flare. The engine
  is original and dry, but a 930 always wants a specialist, not a general garage.
- **bodyStyle:** Coupe · **sellerType:** Dealer

## 04 · 1993 Peugeot 205 CJ

- **heroName:** 205 / CJ
- **headline:** PININFARINA'S / SUMMER / RUNABOUT.
- **about:** Pininfarina designed the 205's cabriolet and built its bodies, and the CJ was the version with nothing to
  prove: a 1.4-litre four with 75 PS, 905 kg, and a hood folded by hand in under a minute. The GTI took the headlines.
  The CJ took the coast roads, and was better company there.
- **summary:** A white 205 CJ that has spent its whole life in Barcelona, still on its steel wheels, with a new hood and
  an engine that has never been asked for more than it has.
- **ourTake:** Cheap to buy, cheap to run, and more fun at 60 than most cars are at 100. Fit a period radio, fold the
  hood, and keep it for the summer. It is the least serious car here, and the most honest.
- **toKeepInMind:** Scuffs across the rear bumper, light scratches on the left door and a small dent on the right rear
  wing. The interior is tired from the sun: the dashboard has faded and the cloth has worn.
- **bodyStyle:** Cabriolet · **sellerType:** Private

## 05 · 1991 Honda NSX (NA1)

- **heroName:** NSX
- **headline:** THE SUPERCAR / THAT HUMBLED / FERRARI.
- **about:** The NSX asked a question nobody else had: why should a supercar be hard to use? Honda built it in
  aluminium, put a 3.0-litre VTEC V6 behind the seats, drew the cockpit around a fighter jet's visibility and
  sharpened the chassis at the Nürburgring. Rivals spent the next decade answering it.
- **summary:** The automatic NSX, the one purists skip, in Formula Red over black, with pop-up headlights that work and
  a timing belt that was done last spring.
- **ourTake:** The automatic suits what the NSX does best: covering long distances quickly without wearing you out.
  Prices for manuals have run away; this is the clever way to own the car. Use it every week.
- **toKeepInMind:** Stone chips along the front bumper, touched in, and a small dent in the right door below the
  handle. The automatic changes gear gently rather than quickly; that is the point of it.
- **bodyStyle:** Coupe · **sellerType:** Dealer

## 06 · 1993 Jaguar XJ220

- **heroName:** XJ / 220
- **headline:** OXFORDSHIRE'S / PROOF OF / CRAFT AND FINESSE.
- **about:** Jaguar abd Tom Walkinshaw Racing showed the XJ220 with a V12 and four-wheel drive. It arrived with a twin-turbocharged 3.5-litre V6
  from racing, rear-wheel drive and 542 bhp, and some deposit holders never forgave it. In 1991 a prototype lapped the
  Nürburgring in 7:46.36, faster than any production car before it. 282 were built.
- **summary:** One of 282, in deep maroon over cream leather, with 3,900 miles from new, most of them driven to and from
  concours lawns.
- **ourTake:** The XJ220 has gone from punchline to blue chip, and low-mileage cars with complete records lead the way.
  This one needs nothing. It deserves a long weekend more than another trophy.
- **toKeepInMind:** Light marking on the rear diffuser from ramp loading. Its tyres are replaced on age, not wear, and
  the car is 2,009 mm wide: measure the garage first.
- **bodyStyle:** Coupe · **sellerType:** Dealer

## 07 · 1997 Honda Integra Type R (DB8)

- **heroName:** INTEGRA / TYPE R
- **headline:** THE PUNCH / FOR THE / GENERAL PUBLIC.
- **about:** Honda's engineers took out sound deadening, fitted thinner glass and a helical limited-slip differential,
  and hand-finished the B18C's ports. The result made 200 PS from 1.8 litres and revved to 8,600 rpm. Then they built
  a four-door version, for people with friends. They even beat GT-Rs and STIs doing so.
- **summary:** A Japanese-market four-door Type R in Championship White, unmodified, 1,100 kg and not a gram of it
  decorative.
- **ourTake:** The sedan is the rarer, cleverer Type R, and an unmodified one is rarer still. Now past 25 years old, it
  can be imported to the United States without fuss. Keep it standard; that is where the value is.
- **toKeepInMind:** Scratches on the left rear bumper corner, a shallow dent in the right rear door, and surface rust
  starting on the boot lid lip, treated. The interior plastics show their age.
- **bodyStyle:** Sedan · **sellerType:** Dealer

## 08 · 1999 Lotus Elise Sport 135 (S1)

- **heroName:** ELISE / 135
- **headline:** SIMPLICITY, / THEN ADD / LIGHTNESS.
- **about:** Lotus bonded the Elise rather than welding it: an extruded aluminium chassis, a fibreglass body, 755 kg in
  all. Julian Thomson drew it, and Romano Artioli named it after his granddaughter, Elisa. The Sport 135 added a hotter
  Rover K-series with 135 bhp, a close-ratio gearbox and Corbeau seats in a pink nobody forgets.
- **summary:** A silver Sport 135 with the hardtop and those pink seats, with the head gasket done properly and the
  steering still as talkative as the day it left Hethel.
- **ourTake:** The S1 is the purest Elise, and the Sport 135 is the S1 to have. With the K-series sorted it is reliable
  enough for weekends and sharp enough for track days. Take the long way home.
- **toKeepInMind:** Stone chips on the nose, touched in. The right rear clam was repaired after a car-park scrape, with
  some gelcoat crazing beneath the paint. Getting in and out takes practice.
- **bodyStyle:** Roadster · **sellerType:** Private

## 09 · 1998 Fiat Barchetta

- **heroName:** BARCHETTA
- **headline:** A LITTLE BOAT / FOR LONG / ITALIAN LUNCHES.
- **about:** Fiat built the Barchetta on the Punto's floor and had Maggiora assemble it, and nobody minded, because of
  how it looked: covered headlamps, door handles hidden in the bodywork, no fins at all. A 1.8-litre 16-valve four with
  variable valve timing made 131 PS. Fiat only ever made it with left-hand drive.
- **summary:** A Rosso Speed Barchetta from the Piedmont hills, two owners, a new hood, and a cambelt done on time.
- **ourTake:** It is the Italian roadster you can actually run: Fiat parts, a simple engine and a hood that works. Buy
  it for the shape and the sound of the twin-cam at 6,000 rpm, and keep the cambelt on schedule.
- **toKeepInMind:** Stone chips on the front bumper and scratches on the right rear bumper corner. Left-hand drive
  only, as all Barchettas were. Earlier hoods leak at the corners; this one was replaced in 2023.
- **bodyStyle:** Roadster · **sellerType:** Private

## 10 · 2002 Subaru Impreza WRX Wagon (GG)

- **heroName:** WRX / WAGON
- **headline:** RALLY BRED, / DOG / APPROVED.
- **about:** Enthusiasts called it the bug-eye, and Subaru redrew the nose within two years, but the round headlamps
  were never the point. Under the scoop sat a 2.0-litre turbocharged flat-four with 227 hp and symmetrical all-wheel
  drive, in an estate with a roof rack and room for the dog.
- **summary:** A WR Blue bug-eye wagon that has done autocross in Alberta, summer and winter, on its own set of wheels
  for each, and still does the school run on Mondays.
- **ourTake:** Wagons were the WRX's best-kept secret, and a manual one with a documented history is worth finding.
  This one has been used as intended and maintained like it. Keep both sets of wheels.
- **toKeepInMind:** Stone chips and a cone scuff on the front bumper, light scratches on the left rear door, and rust
  starting on the right rear arch lip, treated. It has a short shifter, roof bars and performance brake pads.
- **bodyStyle:** Wagon · **sellerType:** Private

## 11 · 2002 BMW M5 (E39)

- **heroName:** M5
- **headline:** THE FAMILY CAR / WITH 500 / NEWTON METRES.
- **about:** The E39 M5 is the car people mean when they say they want a fast saloon. A 4.9-litre V8, 400 PS and a
  six-speed manual, built on the same Dingolfing line as ordinary 5 Series, with nothing in its appearance to give any
  of it away. It was the first M5 with a V8, and the last with this much restraint.
- **summary:** Carbon Black over black leather, right-hand drive, six-speed manual, with every service stamped and the
  timing chain guides already done.
- **ourTake:** The guides and the VANOS are the big E39 M5 jobs, and both are done. That leaves a car you can drive
  every day. It is the least showy car here, and possibly the best.
- **toKeepInMind:** Scratches along the left doors from a car park, a dent in the boot lid near the lock, and light
  corrosion at the right rear arch lip, treated. At 96,000 miles, budget for suspension bushes.
- **bodyStyle:** Sedan · **sellerType:** Private

## 12 · 2008 Lamborghini Gallardo LP 560-4

- **heroName:** GALLARDO / LP 560-4
- **headline:** THE BABY LAMBO / THAT MADE / IT A BUSINESS.
- **about:** Built under Audi ownership, the Gallardo became Lamborghini's best-selling model of its time: 14,022 cars
  in a decade. The LP 560-4 was the revised car, with a new 5.2-litre V10 that fired evenly at last, 560 PS at
  8,000 rpm and four-wheel drive. It looks quieter than most Lamborghinis until it starts.
- **summary:** A black LP 560-4 on the e-gear, two owners, 21,400 miles, with the clutch measured at 82% and the
  paperwork to prove it.
- **ourTake:** The 560-4 is the Gallardo to have: the better engine and the revised chassis without later cars' prices.
  The e-gear divides opinion, but with its clutch in this health it is a known, budgeted quantity.
- **toKeepInMind:** A lip scrape under the nose, typical for the car. The e-gear clutch is a wear item; at 82% it has
  years left, but budget for it. Front-axle lift was not fitted, so mind steep driveways.
- **bodyStyle:** Coupe · **sellerType:** Dealer

## 13 · 2007 Mazda MX-5 (NC)

- **heroName:** MX-5
- **headline:** GROWN UP, / BUT NOT / OLD YET.
- **about:** The third MX-5 grew a little, and everyone worried. It needn't have: the NC shares much of its platform
  with the RX-8, carries a 2.0-litre four with 160 PS and a six-speed gearbox, and still weighs about as much as a
  family hatchback did in 1990. The hood still folds with one hand from the driver's seat.
- **summary:** A pre-facelift NC in Brilliant Black over black leather, two owners, the six-speed and a
  limited-slip differential, from Brisbane.
- **ourTake:** The NC is the most underrated MX-5: roomier, quieter, and every bit as willing. Prices are still low, so
  buy the best one you can find. Fit good tyres and keep the hood drains clear.
- **toKeepInMind:** Stone chips on the front bumper and a light scratch on the right door. The hood drains were renewed
  in 2025; blocked drains are the NC's one well-known weakness.
- **bodyStyle:** Roadster · **sellerType:** Private

---

## Notes for review

- **Facts to verify at build time:** the TR6's "fourteen months" for Karmann's restyle; the XJ220 build count (282,
  as in the current listing; some sources say 275 or 281); "the last with this much restraint" (M5) is opinion, not
  a claim. The Gallardo's "front-axle lift was not fitted" is fiction about this car (the option existed).
- **Headline lengths** follow the frame 4 measure (three lines at cap height 75 in cols 3–5). The build checks every
  headline fits at 1080 wide and adjusts line breaks, not wording.
- **Things invented for the new fields** (all fiction about the individual car): the Datsun's dry-climate history, the
  TR6's injection overhaul, the 930's heat exchangers, the 205's faded dashboard, the NSX's spring timing belt, the
  Integra's interior plastics, the WRX's school run, the M5's suspension bushes, the MX-5's hood drains. Each matches
  the existing service history or condition marks.
