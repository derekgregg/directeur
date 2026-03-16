# Garmin FIT File Format — Comprehensive Reference

## 1. Overview

### What is FIT?

FIT (Flexible and Interoperable Data Transfer) is a compact binary file format designed for storing and sharing data from sports, fitness, and health devices. Unlike text-based formats like GPX or TCX, FIT uses binary encoding that minimizes file size while supporting a rich, extensible set of data fields.

**File extension:** `.fit`

### Who Created It?

FIT was developed by **Garmin** (through its subsidiary **Dynastream Innovations**, now the ANT Wireless division of Garmin Canada Inc.). The protocol was first released around **2008** alongside the Garmin Edge cycling computers. In **2011**, Garmin opened the FIT SDK to third-party developers, allowing other manufacturers to adopt the format.

The specification is maintained at [developer.garmin.com/fit](https://developer.garmin.com/fit/) and historically at [thisisant.com](https://www.thisisant.com/).

### What Devices/Apps Produce FIT Files?

FIT has become the de facto standard for fitness data interchange:

- **Garmin** — All modern watches (Forerunner, fenix, Venu, Enduro), cycling computers (Edge series), and fitness devices
- **Wahoo** — ELEMNT cycling computers, KICKR trainers
- **Suunto** — Watches and dive computers
- **COROS** — PACE, VERTIX, APEX watches
- **Hammerhead** — Karoo cycling computers
- **Zwift** — Virtual cycling/running platform (exports FIT)
- **TrainerRoad** — Indoor training platform (exports FIT)
- **Stages** — Cycling power meters and head units
- **Bryton** — Cycling computers
- **Polar** — Some models support FIT export
- **Peloton** — Activity exports available as FIT

---

## 2. File Structure

### Binary Format Overview

A FIT file is a stream of binary data with no fixed block sizes or pointers. The structure is:

```
[File Header] [Data Records...] [CRC]
```

Where Data Records alternate between **Definition Messages** (schema declarations) and **Data Messages** (actual values).

### File Header (14 bytes)

The preferred header is 14 bytes (minimum 12 bytes):

| Offset | Size | Description |
|--------|------|-------------|
| 0 | 1 byte | Header size (12 or 14; typically `0x0E` = 14) |
| 1 | 1 byte | Protocol version (e.g., `0x10` = v1.0, `0x20` = v2.0) |
| 2–3 | 2 bytes | Profile version (value × 100, e.g., 2132 = v21.32) |
| 4–7 | 4 bytes | Data size in bytes (excludes header and trailing CRC) |
| 8–11 | 4 bytes | ASCII string ".FIT" (`0x2E464954`) |
| 12–13 | 2 bytes | Header CRC (optional; `0x0000` if not computed) |

After the header comes the data section, followed by a 2-byte file CRC (CRC-16).

### Record Headers (1 byte each)

Every data record starts with a 1-byte header. There are two types:

**Normal Header** (bit 7 = 0):
```
Bit 7: 0 (normal header)
Bit 6: 0 = Data Message, 1 = Definition Message
Bit 5: 0 (normal), 1 = Developer Data flag (Protocol v2+)
Bits 0–3: Local Message Type (0–15)
```

**Compressed Timestamp Header** (bit 7 = 1):
```
Bit 7: 1 (compressed timestamp)
Bits 5–6: Local Message Type (0–3 only)
Bits 0–4: Timestamp offset (0–31 seconds from last full timestamp)
```

Compressed timestamps save space by avoiding a full 4-byte timestamp field in every record. They can only reference local message types 0–3.

### Definition Messages

Define the schema for subsequent data messages. Structure after the record header byte:

| Offset | Size | Description |
|--------|------|-------------|
| 0 | 1 byte | Reserved |
| 1 | 1 byte | Architecture: `0` = Little Endian, `1` = Big Endian |
| 2–3 | 2 bytes | Global Message Number (identifies the message type) |
| 4 | 1 byte | Number of fields |
| 5+ | 3 bytes each | Field definitions |

Each **Field Definition** is 3 bytes:

| Byte | Description |
|------|-------------|
| 0 | Field Definition Number (identifies which field within the message) |
| 1 | Size in bytes |
| 2 | Base Type (data type identifier) |

**Base Types:**

| Value | Type | Size |
|-------|------|------|
| 0x00 | enum | 1 |
| 0x01 | sint8 | 1 |
| 0x02 | uint8 | 1 |
| 0x83 | sint16 | 2 |
| 0x84 | uint16 | 2 |
| 0x85 | uint32 | 4 |
| 0x86 | sint32 | 4 |
| 0x07 | string | variable |
| 0x88 | float32 | 4 |
| 0x89 | float64 | 8 |
| 0x0A | uint8z | 1 |
| 0x8B | uint16z | 2 |
| 0x8C | uint32z | 4 |
| 0x0D | byte (array) | variable |
| 0x8E | sint64 | 8 |
| 0x8F | uint64 | 8 |
| 0x90 | uint64z | 8 |

### Data Messages

Contain actual field values in the order defined by the most recent Definition Message for that local message type. The total size of a data message = sum of all field sizes from its definition.

### Developer Fields (Protocol v2+)

Protocol version 2.0 introduced Developer Data fields, allowing device apps (e.g., Connect IQ) to write custom fields. These are defined via `developer_data_id` and `field_description` messages. Support varies across parsers — some libraries silently discard developer fields.

### CRC

A CRC-16 checksum at the end of the file, computed over the entire data section. The algorithm uses a 16-entry lookup table. Computing the header CRC is optional (can be set to `0x0000`).

---

## 3. Key Message Types and Data Fields

### Global Message Numbers (Common)

| Number | Name | Description |
|--------|------|-------------|
| 0 | file_id | File type identifier (required) |
| 18 | session | Overall activity summary |
| 19 | lap | Per-lap/split summaries |
| 20 | record | Per-second time-series data points |
| 21 | event | Start/stop/pause events |
| 23 | device_info | Recording device and sensor details |
| 49 | file_creator | Software/hardware that created the file |
| 101 | length | Swimming length data |
| 78 | hrv | Heart rate variability (R-R intervals) |
| 206 | split | Activity splits (newer firmware) |

For a valid activity file uploaded to Garmin Connect, you must have definition + data messages for: **file_id**, **event**, **lap**, **session**, and **activity**.

### Record Message (Global Message 20) — Per-Point Data

The core time-series message. Fields available per data point:

| Field # | Name | Type | Units | Notes |
|---------|------|------|-------|-------|
| 253 | timestamp | uint32 | seconds | FIT epoch (Dec 31, 1989 00:00:00 UTC) |
| 0 | position_lat | sint32 | semicircles | Degrees = value × (180 / 2³¹) |
| 1 | position_long | sint32 | semicircles | Degrees = value × (180 / 2³¹) |
| 2 | altitude | uint16 | m | Scale: 5, Offset: 500. **Being deprecated.** |
| 3 | heart_rate | uint8 | bpm | |
| 4 | cadence | uint8 | rpm | |
| 5 | distance | uint32 | m | Scale: 100 (cumulative from start) |
| 6 | speed | uint16 | m/s | Scale: 1000. **Being deprecated.** |
| 7 | power | uint16 | watts | |
| 8 | compressed_speed_distance | byte[] | — | 3-byte compressed encoding |
| 13 | temperature | sint8 | °C | |
| 30 | left_right_balance | uint8 | % | L/R power balance |
| 33 | calories | uint16 | kcal | Cumulative |
| 39 | vertical_oscillation | uint16 | mm | Scale: 10 (running dynamics) |
| 40 | stance_time_percent | uint16 | % | Scale: 100 |
| 41 | stance_time | uint16 | ms | Scale: 10 |
| 46 | vertical_ratio | uint16 | % | Scale: 100 |
| 47 | stance_time_balance | uint16 | % | Scale: 100 |
| 48 | step_length | uint16 | mm | Scale: 10 |
| 53 | fractional_cadence | uint8 | rpm | Scale: 128 |
| 62 | enhanced_altitude | uint32 | m | Scale: 5, Offset: 500. 32-bit precision. |
| 73 | enhanced_speed | uint32 | m/s | Scale: 1000. 32-bit precision. |
| 78 | grade | sint16 | % | Scale: 100 |
| — | vertical_speed | sint16 | m/s | Scale: 1000 |

**Important: Enhanced Fields.** Garmin is deprecating the 16-bit `speed` (field 6) and `altitude` (field 2) in favor of 32-bit `enhanced_speed` (field 73) and `enhanced_altitude` (field 62). Newer firmware writes only the enhanced versions. Parsers should check for enhanced fields first, then fall back to legacy fields.

**Invalid value:** `0x7FFFFFFF` for sint32, `0xFFFF` for uint16, `0xFF` for uint8 — indicates no data (e.g., GPS not locked).

**Coordinate conversion formula:**
```
degrees = semicircles × (180 / 2^31)
```

### Session Message (Global Message 18) — Activity Summary

One session per activity (or per sport in multi-sport). Key fields:

| Name | Type | Units | Notes |
|------|------|-------|-------|
| timestamp | uint32 | s | End time |
| start_time | uint32 | s | |
| total_elapsed_time | uint32 | s | Scale: 1000 (wall clock) |
| total_timer_time | uint32 | s | Scale: 1000 (moving time) |
| total_distance | uint32 | m | Scale: 100 |
| total_calories | uint16 | kcal | |
| avg_speed / enhanced_avg_speed | uint16/uint32 | m/s | Scale: 1000 |
| max_speed / enhanced_max_speed | uint16/uint32 | m/s | Scale: 1000 |
| avg_heart_rate | uint8 | bpm | |
| max_heart_rate | uint8 | bpm | |
| min_heart_rate | uint8 | bpm | |
| avg_cadence | uint8 | rpm | |
| max_cadence | uint8 | rpm | |
| avg_power | uint16 | watts | |
| max_power | uint16 | watts | |
| normalized_power | uint16 | watts | |
| total_ascent | uint16 | m | |
| total_descent | uint16 | m | |
| avg_temperature | sint8 | °C | |
| max_temperature | sint8 | °C | |
| max_altitude / enhanced_max_altitude | uint16/uint32 | m | |
| min_altitude / enhanced_min_altitude | uint16/uint32 | m | |
| sport | enum | — | cycling, running, swimming, etc. |
| sub_sport | enum | — | road, trail, indoor_cycling, etc. |
| training_stress_score | uint16 | — | TSS |
| intensity_factor | uint16 | — | IF |
| threshold_power | uint16 | watts | FTP |
| total_training_effect | uint8 | — | Scale: 10 |
| total_anaerobic_training_effect | uint8 | — | Scale: 10 |
| avg_left_right_balance | uint16 | % | |
| total_work | uint32 | J | Total kilojoules |

### Lap Message (Global Message 19) — Per-Lap/Split Data

Same structure as Session but scoped to a single lap or auto-split. Additional fields:

| Name | Description |
|------|-------------|
| lap_trigger | manual, distance, position_start, session_end, fitness_equipment |
| event / event_type | What triggered the lap |
| start_position_lat/long | Lap start coordinates |
| end_position_lat/long | Lap end coordinates |
| swim_stroke | Stroke type for swimming laps |

All the same aggregate fields as Session (total_distance, avg_heart_rate, etc.) are available per lap.

### Event Message (Global Message 21)

Marks activity lifecycle events:

| Event Type | Description |
|------------|-------------|
| timer | Start, stop, pause, resume |
| session | Session boundaries |
| lap | Lap markers |
| power_up / power_down | Device on/off |
| off_course | Navigation deviation |
| front_gear_change / rear_gear_change | Electronic shifting |
| rider_position_change | Seated/standing (cycling) |

### Device Info Message (Global Message 23)

Records details about the recording device and connected sensors:
- Device type, manufacturer, serial number
- Software version, hardware version
- Battery status and voltage
- ANT+ device number and transmission type
- Sensor type (heart rate strap, power meter, speed sensor, etc.)

---

## 4. Per-Second / Per-Record Data Granularity

### Recording Modes

Garmin devices offer two recording modes:

**Every-Second Recording (1 Hz)**
- Writes one Record message per second
- Provides maximum data granularity
- A 1-hour activity produces ~3,600 records
- Recommended for serious training analysis, especially power-based cycling

**Smart Recording (Variable Interval)**
- Records key points where the device detects a change in direction, speed, heart rate, or elevation
- Logs approximately one data point every 3–7 seconds (typically ~5–6 seconds)
- Significantly reduces file size and memory usage
- Default mode on most Garmin watches

**Key nuance:** Smart Recording does NOT affect the device's internal sampling rate. GPS, heart rate, and other sensors still sample every second internally. Smart Recording only affects what gets *written to the file*. Calculated metrics (pace, distance, avg HR) are computed from the full internal data, not just the recorded points. The difference is in track visualization fidelity and per-second data availability for post-hoc analysis.

### Other Devices

- **Wahoo ELEMNT:** Records every second by default
- **COROS:** Records every second by default
- **Hammerhead Karoo:** Records every second by default
- **Suunto:** Configurable; some models default to 1-second
- **Zwift/TrainerRoad:** Typically 1-second intervals for indoor activities

### Variable Intervals in Practice

Even with every-second recording, gaps can occur:
- GPS signal loss produces records with `0x7FFFFFFF` for lat/long
- Sensor dropouts result in invalid values for HR, power, cadence
- Paused time may or may not produce records depending on device settings
- Some devices write records at slightly irregular intervals (e.g., 0.9s to 1.1s)

---

## 5. Parsing FIT Files in JavaScript / Node.js

### Option A: Official SDK — `@garmin/fitsdk`

The official Garmin FIT JavaScript SDK. Most comprehensive and up-to-date with the latest profile.

```bash
npm install @garmin/fitsdk
```

**Full parsing example:**

```javascript
import fs from 'node:fs';
import { Decoder, Stream, Profile } from '@garmin/fitsdk';

// Read the FIT file into a buffer
const buffer = fs.readFileSync('./activity.fit');

// Create a Stream from the buffer
const stream = Stream.fromBuffer(buffer);

// Create a Decoder
const decoder = new Decoder(stream);

// Validate the file
if (!decoder.isFIT()) {
  console.error('Not a valid FIT file');
  process.exit(1);
}

// Optional: check file integrity (header + CRC)
if (!decoder.checkIntegrity()) {
  console.warn('FIT file integrity check failed, attempting to parse anyway...');
}

// Decode with options
const { messages, errors } = decoder.read({
  applyScaleAndOffset: true,       // Convert raw values (e.g., semicircles → degrees)
  expandSubFields: true,           // Expand sub-fields based on parent values
  expandComponents: true,          // Expand bit-packed components
  convertTypesToStrings: true,     // Convert enums to readable strings (e.g., sport → "cycling")
  convertDateTimesToDates: true,   // Convert FIT timestamps to JS Date objects
  includeUnknownData: false,       // Discard unrecognized fields
  mergeHeartRates: true,           // Merge HR broadcast data into record messages
});

if (errors.length > 0) {
  console.warn('Parse errors:', errors);
}

// --- Activity Summary (Session) ---
const sessions = messages.sessionMesgs;
if (sessions && sessions.length > 0) {
  const session = sessions[0];
  console.log('=== Activity Summary ===');
  console.log('Sport:', session.sport);                          // "cycling"
  console.log('Sub-sport:', session.subSport);                   // "road"
  console.log('Start time:', session.startTime);                 // Date object
  console.log('Total time:', session.totalTimerTime, 's');       // seconds (scaled)
  console.log('Total distance:', session.totalDistance, 'm');     // meters (scaled)
  console.log('Total calories:', session.totalCalories, 'kcal');
  console.log('Avg HR:', session.avgHeartRate, 'bpm');
  console.log('Max HR:', session.maxHeartRate, 'bpm');
  console.log('Avg power:', session.avgPower, 'W');
  console.log('Max power:', session.maxPower, 'W');
  console.log('Normalized power:', session.normalizedPower, 'W');
  console.log('Total ascent:', session.totalAscent, 'm');
  console.log('Total descent:', session.totalDescent, 'm');
  console.log('Avg cadence:', session.avgCadence, 'rpm');
  console.log('Avg speed:', session.enhancedAvgSpeed, 'm/s');
  console.log('Avg temp:', session.avgTemperature, '°C');
}

// --- Laps ---
const laps = messages.lapMesgs;
if (laps) {
  console.log(`\n=== ${laps.length} Laps ===`);
  laps.forEach((lap, i) => {
    console.log(`Lap ${i + 1}: ${lap.totalDistance}m in ${lap.totalTimerTime}s, ` +
      `avg HR ${lap.avgHeartRate} bpm, avg power ${lap.avgPower}W`);
  });
}

// --- Per-Second Records ---
const records = messages.recordMesgs;
if (records) {
  console.log(`\n=== ${records.length} Records ===`);
  console.log('First record:', records[0]);
  // Each record contains (when available):
  // {
  //   timestamp: Date,
  //   positionLat: number (degrees, after scale/offset),
  //   positionLong: number (degrees),
  //   enhancedAltitude: number (meters),
  //   enhancedSpeed: number (m/s),
  //   heartRate: number (bpm),
  //   cadence: number (rpm),
  //   power: number (watts),
  //   distance: number (meters, cumulative),
  //   temperature: number (°C),
  //   grade: number (%),
  //   calories: number (kcal, cumulative),
  //   verticalSpeed: number (m/s),
  //   leftRightBalance: number,
  //   ...
  // }
}

// --- Events ---
const events = messages.eventMesgs;
if (events) {
  events.forEach(e => {
    console.log(`Event: ${e.event} — ${e.eventType} at ${e.timestamp}`);
  });
}

// --- Device Info ---
const devices = messages.deviceInfoMesgs;
if (devices) {
  devices.forEach(d => {
    console.log(`Device: ${d.manufacturer} ${d.product}, serial: ${d.serialNumber}`);
  });
}
```

**Decoder.read() options reference:**

| Option | Default | Description |
|--------|---------|-------------|
| `applyScaleAndOffset` | true | Applies profile-defined scale/offset to raw integer values |
| `expandSubFields` | true | Creates sub-fields based on parent field values |
| `expandComponents` | true | Expands bit-packed components into separate fields |
| `convertTypesToStrings` | true | Maps integer enums to human-readable strings |
| `convertDateTimesToDates` | true | Converts FIT epoch timestamps to JS `Date` objects |
| `includeUnknownData` | true | Stores unrecognized fields using field ID as key |
| `mergeHeartRates` | true | Integrates separate HR messages into Record messages |

**Callback listeners:**

```javascript
const { messages, errors } = decoder.read({
  mesgListener: (messageNumber, message) => {
    // Called for every decoded message — inspect or modify in-flight
    if (messageNumber === Profile.MesgNum.Record) {
      // Process each record as it's decoded (memory-efficient for huge files)
    }
  },
  mesgDefinitionListener: (mesgDefinition) => {
    // Monitor definition messages during decoding
  },
});
```

### Option B: Community Library — `fit-file-parser`

Popular, well-maintained community library with unit conversion and hierarchical output.

```bash
npm install fit-file-parser
```

**Full parsing example:**

```javascript
import fs from 'node:fs/promises';
import FitParser from 'fit-file-parser';

const fitParser = new FitParser({
  force: true,                    // Continue parsing on errors
  speedUnit: 'km/h',             // 'm/s' | 'km/h' | 'mph'
  lengthUnit: 'km',              // 'm' | 'km' | 'mi'
  temperatureUnit: 'celsius',    // 'celsius' | 'kelvin' | 'fahrenheit'
  pressureUnit: 'bar',           // 'bar' | 'cbar' | 'psi'
  elapsedRecordField: true,      // Add elapsed_time & timer_time to each record
  mode: 'cascade',               // 'cascade' | 'list' | 'both'
});

const buffer = await fs.readFile('./activity.fit');

// Async/await approach
const fitData = await fitParser.parseAsync(buffer);

// --- OR callback approach ---
// fitParser.parse(buffer, (error, fitData) => { ... });

// Activity summary
console.log('Activity:', fitData.activity);

// Sessions (cascade mode: sessions contain laps which contain records)
fitData.activity.sessions.forEach((session, si) => {
  console.log(`Session ${si + 1}:`, session.sport);
  console.log('  Distance:', session.total_distance);
  console.log('  Duration:', session.total_timer_time);
  console.log('  Calories:', session.total_calories);
  console.log('  Avg HR:', session.avg_heart_rate);

  session.laps.forEach((lap, li) => {
    console.log(`  Lap ${li + 1}:`, lap.total_distance, 'in', lap.total_timer_time);

    // In cascade mode, records are nested under their parent lap
    lap.records.forEach((record) => {
      console.log('    ', record.timestamp, record.heart_rate, record.speed);
    });
  });
});

// In 'list' mode, data is flat:
// fitData.activity.sessions  — array of sessions
// fitData.activity.laps      — array of all laps
// fitData.activity.records   — array of all records
```

**Parsing modes explained:**

| Mode | Structure |
|------|-----------|
| `cascade` | `sessions[] → laps[] → records[]` (hierarchical, default) |
| `list` | Flat arrays: `sessions[]`, `laps[]`, `records[]` (no nesting) |
| `both` | Hierarchical tree AND flat `records[]` at the root level |

### Option C: Other Libraries

| Package | Notes |
|---------|-------|
| `easy-fit` | Original library that `fit-file-parser` forked from. Less maintained. |
| `fit-decoder` | Converts binary FIT to JSON using the global FIT profile. |
| `@samijaber/fit-sdk` | Community wrapper around Garmin's SDK. |
| `@markw65/fit-file-writer` | Write/encode FIT files (not a parser). |

### Recommendation

- Use **`@garmin/fitsdk`** if you need the latest FIT profile support, developer fields, or are building production infrastructure. It tracks Garmin's official profile updates.
- Use **`fit-file-parser`** if you want a simpler API with built-in unit conversion and hierarchical session/lap/record output. Good for quick prototyping.

---

## 6. File Sizes

FIT's binary encoding makes it significantly more compact than text-based formats. A FIT file is roughly **5–20x smaller** than an equivalent TCX file (a 250KB FIT file ≈ 5MB TCX).

### Estimated Sizes (Every-Second Recording, Cycling with GPS + HR + Power + Cadence)

Each record with a full sensor suite (timestamp, lat, long, altitude, HR, speed, cadence, power, distance, temperature) is approximately **25–40 bytes** depending on which fields are present and whether compressed timestamps are used.

At 1 Hz recording:

| Duration | Records | Estimated File Size |
|----------|---------|-------------------|
| 1 hour | ~3,600 | **100–250 KB** |
| 2 hours | ~7,200 | **200–500 KB** |
| 4 hours | ~14,400 | **400 KB – 1 MB** |
| 8 hours (ultra) | ~28,800 | **0.8 – 2 MB** |

### Size Modifiers

These increase file size significantly:

- **Running dynamics** (vertical oscillation, ground contact time, etc.): adds ~10–15 bytes/record
- **Cycling dynamics** (L/R balance, pedal smoothness, torque effectiveness): adds ~8–12 bytes/record
- **HRV data** (R-R intervals): can add substantial data; a 1-hour activity with HRV may be 2–5 MB
- **Developer fields** (Connect IQ apps writing custom data): variable
- **Multi-sport activities** with transitions: multiple sessions in one file
- **GPS metadata messages** (newer Garmin firmware): adds enhanced position data

With Smart Recording, file sizes shrink to roughly **30–50%** of every-second recording sizes.

### Extremes

Forum reports show some activities generating 25–40 MB files, particularly when many developer fields or HRV data are enabled on long-duration activities with every-second recording.

---

## 7. Limitations and Gotchas

### Binary Format / Not Human-Readable

FIT files cannot be inspected with a text editor. You need a parser or the FIT SDK's `FitCSVTool` to examine contents. This makes debugging harder than with GPX/TCX.

### Enhanced vs. Legacy Fields

Garmin is actively deprecating 16-bit `speed` (field 6) and `altitude` (field 2) in Record messages. Newer firmware writes only `enhanced_speed` (field 73) and `enhanced_altitude` (field 62), which use 32-bit precision. **Your parser MUST check for enhanced fields first and fall back to legacy fields.** If you only read field 6/2, you will get empty data from modern devices.

### Semicircle Coordinate Encoding

GPS coordinates are stored as signed 32-bit integers in "semicircles," not degrees. Conversion:
```
degrees = semicircles × (180 / 2^31)
```
The invalid/missing GPS sentinel value is `0x7FFFFFFF` (2,147,483,647). Always check for this before converting.

### FIT Epoch

Timestamps use the FIT epoch: **December 31, 1989, 00:00:00 UTC** (not Unix epoch). To convert to Unix timestamp:
```
unix_timestamp = fit_timestamp + 631065600
```
Most parsers handle this automatically when `convertDateTimesToDates` is enabled.

### Scale and Offset

Many fields store scaled integer values rather than floats for space efficiency:
- `altitude`: raw value × (1/5) − 500 = meters
- `speed`: raw value × (1/1000) = m/s
- `distance`: raw value × (1/100) = meters
- `position_lat/long`: semicircles → degrees formula above

If your parser doesn't apply scale/offset, you get raw integer values that look wrong.

### Local Message Types (0–15 Max)

Only 16 local message types can be active at once. Definitions can be redefined (overwrite a previous local type), so parsers must track the current definition for each local type slot.

### Compressed Timestamps

- Only apply to local message types 0–3
- Encode a 5-bit offset (0–31 seconds) from the last full timestamp
- If a gap exceeds 31 seconds, a full timestamp field is required
- Reduce file size but complicate parsing logic

### Developer Data Fields (Protocol v2)

- Not all parsers support them fully
- The official `@garmin/fitsdk` supports them; many community parsers silently discard them
- Connect IQ apps can write arbitrary developer fields, so you may encounter unknown data

### Chained FIT Files

Some devices write multiple FIT files concatenated into one (e.g., multi-sport activities or monitoring files). Each sub-file has its own header and CRC. Most parsers handle the first file only — you may need to split chained files before parsing.

### Smart Recording Data Gaps

If a file was recorded with Smart Recording, records are NOT evenly spaced. You cannot assume 1-second intervals between records. Always use the `timestamp` field to determine actual timing. Interpolation may be needed for visualization.

### Device-Specific Quirks

- Different manufacturers implement the FIT spec with varying levels of completeness
- Some devices write non-standard fields or use field numbers differently
- Wahoo files may have slightly different session/lap structures than Garmin files
- Indoor activities (treadmill, trainer) may lack GPS data entirely
- Swimming activities use `length` messages (global message 101) instead of `record` messages for pool swim

### Maximum Field Count

The FIT format supports a maximum of 255 fields per message (1-byte field count in the definition).

### File Corruption

FIT files can be corrupted by:
- Interrupted writes (device battery death mid-activity)
- USB disconnection during file transfer
- Incomplete Bluetooth/WiFi sync

The CRC check helps detect corruption. Most parsers can optionally continue past errors (`force: true` in fit-file-parser, or error collection in `@garmin/fitsdk`).

---

## Sources

- [FIT Protocol — Garmin Developers](https://developer.garmin.com/fit/protocol/)
- [FIT File Types: Activity — Garmin Developers](https://developer.garmin.com/fit/file-types/activity/)
- [FIT Cookbook: Decoding Activity Files — Garmin Developers](https://developer.garmin.com/fit/cookbook/decoding-activity-files/)
- [FIT SDK Programming Languages: JavaScript — Garmin Developers](https://developer.garmin.com/fit/example-projects/javascript/)
- [Garmin FIT JavaScript SDK — GitHub](https://github.com/garmin/fit-javascript-sdk)
- [@garmin/fitsdk — npm](https://www.npmjs.com/package/@garmin/fitsdk)
- [fit-file-parser — npm](https://www.npmjs.com/package/fit-file-parser)
- [fit-parser (fit-file-parser source) — GitHub](https://github.com/jimmykane/fit-parser)
- [FIT File Structure for Dummies — pinns.co.uk](https://www.pinns.co.uk/osm/fit-for-dummies.html)
- [The Structure of a FIT File — Auuki Wiki (GitHub)](https://github.com/dvmarinoff/Auuki/wiki/The-structure-of-a-FIT-file.)
- [FIT File Description — Suunto API Zone](https://apizone.suunto.com/fit-description)
- [FIT Protocol Rev 1.8 Specification (PDF) — Scribd](https://www.scribd.com/document/317201594/D00001275-Flexible-Interoperable-Data-Transfer-FIT-Protocol-Rev-1-8)
- [Smart Recording vs. Every Second Recording — Garmin Support](https://support.garmin.com/en-US/?faq=s4w6kZmbmK0P6l20SgpW28)
- [Activity FIT Files: Deprecating Speed and Altitude — Garmin Developer Portal](https://developerportal.garmin.com/blog/activity-fit-files-deprecating-speed-and-altitude)
- [Beyond the SDK: Undocumented Garmin FIT File Information — HarryOnline](https://www.harryonline.net/blog-en/beyond-the-sdk-uncovering-undocumented-garmin-fit-file-information/14727/)
- [FIT File Format — FileFormat.com](https://docs.fileformat.com/gis/fit/)
- [FIT — OpenStreetMap Wiki](https://wiki.openstreetmap.org/wiki/FIT)
