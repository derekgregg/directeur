# GPS & Fitness File Formats Reference

Comprehensive reference covering GPX, TCX, FIT, and other activity/GPS file formats used in fitness devices, apps, and platforms.

---

## Table of Contents

1. [GPX (GPS Exchange Format)](#gpx-gps-exchange-format)
2. [TCX (Training Center XML)](#tcx-training-center-xml)
3. [FIT (Flexible and Interoperable Data Transfer)](#fit-flexible-and-interoperable-data-transfer)
4. [Other Formats](#other-formats)
5. [Format Comparison Matrix](#format-comparison-matrix)
6. [JavaScript/Node.js Parsing Libraries](#javascriptnodejs-parsing-libraries)

---

## GPX (GPS Exchange Format)

### Overview

GPX is a light-weight, open XML schema for interchange of GPS data -- waypoints, routes, and tracks -- between applications and web services. It has been the de-facto XML standard for GPS data interchange since its initial release.

- **Created by:** TopoGrafix (Dan Foster)
- **First release:** GPX 1.0, 2002
- **Current version:** GPX 1.1, released August 9, 2004
- **Schema namespace:** `http://www.topografix.com/GPX/1/1`
- **File extension:** `.gpx`
- **MIME type:** `application/gpx+xml`
- **Encoding:** XML (human-readable, UTF-8)
- **Coordinate system:** WGS 84 (same datum used by GPS)
- **Time format:** ISO 8601 / UTC (e.g., `2024-03-15T14:30:00Z`)

**Who produces GPX files:** Garmin devices, Wahoo, Coros, Suunto, Polar, Strava (export), Komoot, AllTrails, Ride with GPS, MapMyRun, phone GPS apps, virtually all GPS devices and fitness platforms.

**Typical file sizes:** ~2.8 MB for a 1-hour trail run recorded at 1-second intervals. Size scales linearly with duration and recording frequency. A 4-hour cycling ride can be 8-12 MB.

### Version Differences: GPX 1.0 vs 1.1

| Feature | GPX 1.0 | GPX 1.1 |
|---------|---------|---------|
| `<metadata>` element | Not present (fields at root level) | Wraps file-level info (name, desc, author, time, etc.) |
| `<extensions>` element | Not supported | Supported at multiple levels (gpx, wpt, trk, trkseg, trkpt) |
| `<link>` element | `<url>` + `<urlname>` | `<link href="..."><text/><type/></link>` |
| `<author>` element | Simple string | Complex `personType` with name, email, link |
| `<email>` element | Simple string | Structured with `id` and `domain` attributes |
| `<speed>` and `<course>` | Supported natively in `wptType` | **Accidentally dropped** (restored via Garmin TrackPointExtension v2) |
| `<type>` on trk/rte | Not present | Added as optional string field |

GPX 1.1 is the current standard. GPX 1.0 is still encountered in older devices and legacy exports.

### XML Structure

#### Root Element: `<gpx>`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx
  version="1.1"
  creator="Garmin Connect"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v2"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1
    http://www.topografix.com/GPX/1/1/gpx.xsd">

  <metadata>...</metadata>    <!-- 0..1 -->
  <wpt>...</wpt>              <!-- 0..* waypoints -->
  <rte>...</rte>              <!-- 0..* routes -->
  <trk>...</trk>              <!-- 0..* tracks -->
  <extensions>...</extensions> <!-- 0..1 -->
</gpx>
```

**Required attributes on `<gpx>`:**
- `version` -- must be `"1.1"`
- `creator` -- string identifying the application that created the file

#### `<metadata>` (metadataType)

File-level information about the GPX document.

```xml
<metadata>
  <name>Morning Run</name>                          <!-- 0..1 string -->
  <desc>Easy recovery run</desc>                     <!-- 0..1 string -->
  <author>                                           <!-- 0..1 personType -->
    <name>John Doe</name>
    <email id="john" domain="example.com"/>
    <link href="https://example.com"><text>Homepage</text></link>
  </author>
  <copyright author="John Doe">                     <!-- 0..1 -->
    <year>2024</year>
    <license>https://creativecommons.org/licenses/by/4.0/</license>
  </copyright>
  <link href="https://www.strava.com/activities/123"> <!-- 0..* linkType -->
    <text>View on Strava</text>
    <type>text/html</type>
  </link>
  <time>2024-03-15T14:30:00Z</time>                 <!-- 0..1 dateTime -->
  <keywords>running, training</keywords>             <!-- 0..1 string -->
  <bounds minlat="40.7" minlon="-74.0"              <!-- 0..1 boundsType -->
          maxlat="40.8" maxlon="-73.9"/>
  <extensions>...</extensions>                       <!-- 0..1 -->
</metadata>
```

#### `<wpt>` -- Waypoint (wptType)

A waypoint is a point of interest or named feature on a map. Each `<wpt>` has the same type as `<trkpt>` and `<rtept>`.

```xml
<wpt lat="40.748817" lon="-73.985428">
  <!-- Position info (all optional) -->
  <ele>10.5</ele>                    <!-- elevation in meters -->
  <time>2024-03-15T14:30:00Z</time>  <!-- ISO 8601 UTC -->
  <magvar>12.3</magvar>              <!-- magnetic variation in degrees -->
  <geoidheight>-32.5</geoidheight>  <!-- height of geoid above WGS84 ellipsoid -->

  <!-- Description info (all optional) -->
  <name>Empire State Building</name>  <!-- string -->
  <cmt>Start point</cmt>             <!-- comment, string -->
  <desc>Meeting location</desc>       <!-- description, string -->
  <src>Garmin eTrex</src>            <!-- source device/app -->
  <link href="https://...">          <!-- 0..* linkType -->
    <text>Link text</text>
    <type>text/html</type>
  </link>
  <sym>Flag</sym>                    <!-- symbol name for display -->
  <type>Waypoint</type>              <!-- classification string -->

  <!-- Accuracy info (all optional) -->
  <fix>3d</fix>                      <!-- none | 2d | 3d | dgps | pps -->
  <sat>8</sat>                       <!-- number of satellites -->
  <hdop>1.2</hdop>                   <!-- horizontal dilution of precision -->
  <vdop>2.1</vdop>                   <!-- vertical dilution of precision -->
  <pdop>2.4</pdop>                   <!-- position dilution of precision -->
  <ageofdgpsdata>1.5</ageofdgpsdata> <!-- seconds since last DGPS update -->
  <dgpsid>42</dgpsid>               <!-- DGPS station ID (0-1023) -->

  <extensions>...</extensions>        <!-- 0..1 -->
</wpt>
```

**Required attributes:** `lat` (decimal degrees, -90 to 90) and `lon` (decimal degrees, -180 to 180).

#### `<rte>` -- Route (rteType)

An ordered list of waypoints representing a planned path with turn points leading to a destination.

```xml
<rte>
  <name>Central Park Loop</name>     <!-- 0..1 -->
  <cmt>Clockwise direction</cmt>    <!-- 0..1 -->
  <desc>5K route</desc>             <!-- 0..1 -->
  <src>Ride with GPS</src>          <!-- 0..1 -->
  <link href="https://..."/>        <!-- 0..* -->
  <number>1</number>                <!-- 0..1 nonNegativeInteger, route number -->
  <type>running</type>              <!-- 0..1 string -->
  <extensions>...</extensions>      <!-- 0..1 -->
  <rtept lat="40.77" lon="-73.97"> <!-- 0..* route points (same wptType) -->
    <ele>15.0</ele>
    <name>Turn Left</name>
  </rtept>
  <rtept lat="40.78" lon="-73.96">
    <ele>18.0</ele>
    <name>Water Stop</name>
  </rtept>
</rte>
```

**Routes vs tracks:** A route is a planned path (turn-by-turn), while a track is a recorded path (breadcrumb trail of where you actually went).

#### `<trk>` -- Track (trkType)

An ordered list of points describing a recorded path. This is the primary element for fitness activity data.

```xml
<trk>
  <name>Morning Run</name>           <!-- 0..1 -->
  <cmt>Felt good today</cmt>        <!-- 0..1 -->
  <desc>Recovery run</desc>          <!-- 0..1 -->
  <src>Garmin Forerunner 955</src>   <!-- 0..1 -->
  <link href="https://..."/>        <!-- 0..* -->
  <number>1</number>                <!-- 0..1 nonNegativeInteger -->
  <type>running</type>              <!-- 0..1 string -->
  <extensions>...</extensions>      <!-- 0..1 -->

  <trkseg>                          <!-- 0..* track segments -->
    <trkpt lat="40.748817" lon="-73.985428">  <!-- 0..* track points -->
      <ele>10.5</ele>
      <time>2024-03-15T14:30:00Z</time>
      <extensions>
        <gpxtpx:TrackPointExtension>
          <gpxtpx:hr>145</gpxtpx:hr>
          <gpxtpx:cad>88</gpxtpx:cad>
          <gpxtpx:atemp>18.0</gpxtpx:atemp>
        </gpxtpx:TrackPointExtension>
      </extensions>
    </trkpt>
    <trkpt lat="40.748900" lon="-73.985500">
      <ele>11.2</ele>
      <time>2024-03-15T14:30:01Z</time>
      <extensions>...</extensions>
    </trkpt>

    <extensions>...</extensions>    <!-- 0..1 segment-level extensions -->
  </trkseg>
</trk>
```

**Track segments:** A `<trkseg>` holds a list of logically connected points. A new segment is created when the GPS signal is lost (e.g., entering a tunnel) and reacquired. Multiple segments in one track indicate signal gaps during a continuous activity.

### Key Data Fields Summary

| Field | Element | Type | Units | Notes |
|-------|---------|------|-------|-------|
| Latitude | `lat` attribute | decimal | degrees | -90.0 to 90.0, WGS 84 |
| Longitude | `lon` attribute | decimal | degrees | -180.0 to <180.0, WGS 84 |
| Elevation | `<ele>` | decimal | meters | Above mean sea level |
| Time | `<time>` | dateTime | ISO 8601 | UTC, fractional seconds allowed |
| Magnetic variation | `<magvar>` | decimal | degrees | 0.0 to 360.0 |
| Geoid height | `<geoidheight>` | decimal | meters | Geoid above WGS84 ellipsoid |
| Fix type | `<fix>` | enum | -- | none, 2d, 3d, dgps, pps |
| Satellites | `<sat>` | integer | count | Satellites used for fix |
| HDOP | `<hdop>` | decimal | -- | Horizontal dilution of precision |
| VDOP | `<vdop>` | decimal | -- | Vertical dilution of precision |
| PDOP | `<pdop>` | decimal | -- | Position (3D) dilution of precision |

### GPX Extensions

GPX 1.1's `<extensions>` element allows embedding vendor-specific data from other XML namespaces at multiple levels: root, metadata, waypoint, track, track segment, and track point.

#### Garmin TrackPointExtension v2

The most widely used GPX extension. Supersedes v1 (which lacked speed, course, bearing).

- **Namespace:** `http://www.garmin.com/xmlschemas/TrackPointExtension/v2`
- **Schema:** `https://www8.garmin.com/xmlschemas/TrackPointExtensionv2.xsd`
- **Prefix convention:** `gpxtpx` or `ns3`

**Fields:**

| Element | Type | Units | Description |
|---------|------|-------|-------------|
| `<atemp>` | double | degrees C | Air temperature |
| `<wtemp>` | double | degrees C | Water temperature |
| `<depth>` | double | meters | Water depth |
| `<hr>` | unsigned byte | bpm | Heart rate (min: 1) |
| `<cad>` | unsigned byte | rpm | Cadence (max: 254) |
| `<speed>` | double | m/s | Speed over ground (v2 only) |
| `<course>` | decimal | degrees | Course/heading, 0-360 (v2 only) |
| `<bearing>` | decimal | degrees | Bearing, 0-360 (v2 only) |

**Example with extensions:**

```xml
<trkpt lat="40.748817" lon="-73.985428">
  <ele>10.5</ele>
  <time>2024-03-15T14:30:00Z</time>
  <extensions>
    <gpxtpx:TrackPointExtension>
      <gpxtpx:atemp>18.0</gpxtpx:atemp>
      <gpxtpx:hr>152</gpxtpx:hr>
      <gpxtpx:cad>90</gpxtpx:cad>
      <gpxtpx:speed>3.45</gpxtpx:speed>
      <gpxtpx:course>275.3</gpxtpx:course>
    </gpxtpx:TrackPointExtension>
  </extensions>
</trkpt>
```

#### Garmin TrackPointExtension v1

- **Namespace:** `http://www.garmin.com/xmlschemas/TrackPointExtension/v1`
- **Schema:** `https://www8.garmin.com/xmlschemas/TrackPointExtensionv1.xsd`
- **Fields:** `atemp`, `wtemp`, `depth`, `hr`, `cad` only (no speed, course, bearing)

#### ClueTrust GPX Extensions

Used by some applications as an alternative to Garmin extensions.

- **Namespace:** `http://www.cluetrust.com/XML/GPXDATA/1/0`
- **Schema:** `https://www.cluetrust.com/Schemas/gpxdata10.xsd`

**Fields:**

| Element | Type | Units | Description |
|---------|------|-------|-------------|
| `<hr>` | -- | bpm | Heart rate |
| `<cadence>` | -- | rpm | Cadence |
| `<temp>` | -- | degrees C | Temperature |
| `<distance>` | -- | meters | Cumulative distance |

**Note:** COROS devices use ClueTrust namespace but deviate from the spec -- they write `<heartrate>` instead of `<hr>` and omit namespace prefixes, which can cause parsing issues.

#### Power Data in GPX

There is no widely standardized extension for power (watts) in GPX. Different tools handle it differently:
- Some use a custom `<power>` element in a proprietary namespace
- Strava exports power in GPX using `<power>` in the `<extensions>` block
- The lack of a standard power extension is one reason TCX and FIT are preferred for cycling with power meters

### Unique Data in GPX (Not in Other Formats)

- Waypoints as first-class objects (POIs with names, symbols, descriptions)
- Routes as planned navigation paths (separate from recorded tracks)
- Accuracy metadata (HDOP, VDOP, PDOP, satellite count, fix type, DGPS info)
- Magnetic variation
- The `<extensions>` mechanism for arbitrary vendor data

---

## TCX (Training Center XML)

### Overview

TCX is a training-focused XML data exchange format created by Garmin. Unlike GPX which treats data as generic GPS points, TCX treats a recording as an **Activity** composed of structured training data with laps, calories, and sensor metrics as first-class fields.

- **Created by:** Garmin (as part of Garmin Training Center software)
- **Introduced:** 2007
- **Current schema:** TrainingCenterDatabase v2
- **Schema namespace:** `http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2`
- **File extension:** `.tcx`
- **Encoding:** XML (human-readable, UTF-8)
- **Coordinate system:** WGS 84
- **Time format:** ISO 8601 / UTC

**Who produces TCX files:** Garmin devices (via Garmin Connect export), Wahoo, Polar (export), Strava (export), Peloton (export), Zwift, TrainingPeaks, most fitness platforms as an export option.

**Typical file sizes:** ~4.8 MB for a 1-hour trail run at 1-second recording. TCX files are generally larger than GPX for the same activity because they include additional structured data (lap summaries, distance, calories, intensity).

### How TCX Differs from GPX

| Aspect | GPX | TCX |
|--------|-----|-----|
| Philosophy | Generic GPS data interchange | Training/fitness activity data |
| Top-level concept | Tracks, routes, waypoints | Activities with sport type |
| Lap support | None (no concept of laps) | First-class: lap summaries with aggregates |
| Heart rate | Extension only | Native `<HeartRateBpm>` field |
| Cadence | Extension only | Native `<Cadence>` field |
| Calories | Not supported | Native per-lap `<Calories>` field |
| Distance | Not natively per-point | Native `<DistanceMeters>` per trackpoint |
| Intensity | Not supported | `<Intensity>` per lap (Active/Resting) |
| Sport type | Not standardized | `Sport` attribute (Running/Biking/Other) |
| Waypoints | Full support | Not supported |
| Routes | Full support | Courses (separate from activities) |
| Multi-sport | Not designed for it | Native support for multi-sport activities |
| Accuracy data | HDOP, VDOP, satellites, fix | Not supported |

### XML Structure

#### Root Element: `<TrainingCenterDatabase>`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase
  xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:ax="http://www.garmin.com/xmlschemas/ActivityExtension/v2"
  xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2
    https://www8.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">

  <Activities>
    <Activity Sport="Running">...</Activity>
  </Activities>
</TrainingCenterDatabase>
```

The root can contain: `<Folders>`, `<Activities>`, `<Workouts>`, `<Courses>`, `<Author>`, `<Extensions>`.

#### Activity Hierarchy: Activities > Activity > Lap > Track > Trackpoint

```
TrainingCenterDatabase
  └── Activities
       └── Activity (Sport="Running|Biking|Other")
            ├── Id (dateTime -- activity start time, acts as unique ID)
            ├── Lap* (StartTime attribute)
            │    ├── TotalTimeSeconds
            │    ├── DistanceMeters
            │    ├── MaximumSpeed (optional)
            │    ├── Calories
            │    ├── AverageHeartRateBpm (optional)
            │    ├── MaximumHeartRateBpm (optional)
            │    ├── Intensity (Active | Resting)
            │    ├── Cadence (optional, 0-254)
            │    ├── TriggerMethod (Manual|Distance|Location|Time|HeartRate)
            │    ├── Track* (optional)
            │    │    └── Trackpoint*
            │    ├── Notes (optional)
            │    └── Extensions (optional)
            ├── Notes (optional)
            ├── Training (optional)
            ├── Creator (optional)
            └── Extensions (optional)
```

#### Complete Activity Example

```xml
<Activities>
  <Activity Sport="Running">
    <Id>2024-03-15T14:30:00Z</Id>

    <Lap StartTime="2024-03-15T14:30:00Z">
      <!-- Lap Summary Data -->
      <TotalTimeSeconds>1845.0</TotalTimeSeconds>
      <DistanceMeters>5012.34</DistanceMeters>
      <MaximumSpeed>4.5</MaximumSpeed>
      <Calories>385</Calories>
      <AverageHeartRateBpm><Value>152</Value></AverageHeartRateBpm>
      <MaximumHeartRateBpm><Value>178</Value></MaximumHeartRateBpm>
      <Intensity>Active</Intensity>
      <Cadence>88</Cadence>
      <TriggerMethod>Distance</TriggerMethod>

      <Track>
        <Trackpoint>
          <Time>2024-03-15T14:30:00Z</Time>
          <Position>
            <LatitudeDegrees>40.748817</LatitudeDegrees>
            <LongitudeDegrees>-73.985428</LongitudeDegrees>
          </Position>
          <AltitudeMeters>10.5</AltitudeMeters>
          <DistanceMeters>0.0</DistanceMeters>
          <HeartRateBpm><Value>145</Value></HeartRateBpm>
          <Cadence>86</Cadence>
          <SensorState>Present</SensorState>
          <Extensions>
            <ax:TPX>
              <ax:Speed>3.45</ax:Speed>
              <ax:Watts>215</ax:Watts>
              <ax:RunCadence>88</ax:RunCadence>
            </ax:TPX>
          </Extensions>
        </Trackpoint>

        <Trackpoint>
          <Time>2024-03-15T14:30:01Z</Time>
          <Position>
            <LatitudeDegrees>40.748900</LatitudeDegrees>
            <LongitudeDegrees>-73.985500</LongitudeDegrees>
          </Position>
          <AltitudeMeters>11.2</AltitudeMeters>
          <DistanceMeters>12.5</DistanceMeters>
          <HeartRateBpm><Value>148</Value></HeartRateBpm>
          <Cadence>88</Cadence>
          <SensorState>Present</SensorState>
        </Trackpoint>
      </Track>

      <!-- Lap-level extensions -->
      <Extensions>
        <ax:LX>
          <ax:AvgSpeed>2.72</ax:AvgSpeed>
          <ax:AvgRunCadence>87</ax:AvgRunCadence>
          <ax:MaxRunCadence>96</ax:MaxRunCadence>
          <ax:AvgWatts>210</ax:AvgWatts>
          <ax:MaxWatts>385</ax:MaxWatts>
          <ax:Steps>4520</ax:Steps>
        </ax:LX>
      </Extensions>
    </Lap>

    <Creator xsi:type="Device_t">
      <Name>Garmin Forerunner 955</Name>
      <UnitId>3978432100</UnitId>
      <ProductID>3869</ProductID>
    </Creator>
  </Activity>
</Activities>
```

### Trackpoint Fields

| Field | Element | Type | Units | Required |
|-------|---------|------|-------|----------|
| Time | `<Time>` | dateTime | ISO 8601 UTC | Yes |
| Latitude | `<Position><LatitudeDegrees>` | double | degrees | No |
| Longitude | `<Position><LongitudeDegrees>` | double | degrees | No |
| Altitude | `<AltitudeMeters>` | double | meters | No |
| Distance | `<DistanceMeters>` | double | meters | No (cumulative from activity start) |
| Heart rate | `<HeartRateBpm><Value>` | unsigned byte | bpm | No |
| Cadence | `<Cadence>` | unsigned byte | rpm (0-254) | No |
| Sensor state | `<SensorState>` | enum | Present/Absent | No |

### Lap Summary Fields (ActivityLap_t)

These aggregate fields give per-lap statistics without needing to compute them from trackpoints:

| Field | Element | Type | Units | Required |
|-------|---------|------|-------|----------|
| Duration | `<TotalTimeSeconds>` | double | seconds | Yes |
| Distance | `<DistanceMeters>` | double | meters | Yes |
| Max speed | `<MaximumSpeed>` | double | m/s | No |
| Calories | `<Calories>` | unsigned short | kcal | Yes |
| Avg heart rate | `<AverageHeartRateBpm><Value>` | unsigned byte | bpm | No |
| Max heart rate | `<MaximumHeartRateBpm><Value>` | unsigned byte | bpm | No |
| Intensity | `<Intensity>` | enum | Active/Resting | Yes |
| Cadence | `<Cadence>` | unsigned byte | rpm (0-254) | No |
| Trigger | `<TriggerMethod>` | enum | see below | Yes |

**TriggerMethod values:** Manual, Distance, Location, Time, HeartRate.

**StartTime attribute** on `<Lap>` is required (dateTime).

### Garmin ActivityExtension v2 (Power, Speed, Run Cadence)

Power data is NOT part of the base TCX schema. It requires the Garmin ActivityExtension v2.

- **Namespace:** `http://www.garmin.com/xmlschemas/ActivityExtension/v2`
- **Schema:** `https://www8.garmin.com/xmlschemas/ActivityExtensionv2.xsd`

#### Trackpoint Extension (TPX)

| Element | Type | Units | Description |
|---------|------|-------|-------------|
| `<Speed>` | double | m/s | Instantaneous speed |
| `<RunCadence>` | unsigned byte | spm (0-254) | Running cadence (steps/min) |
| `<Watts>` | unsigned short | watts | Power output |
| `CadenceSensor` attribute | enum | -- | Footpod or Bike |

#### Lap Extension (LX)

| Element | Type | Units | Description |
|---------|------|-------|-------------|
| `<AvgSpeed>` | double | m/s | Average speed for lap |
| `<MaxBikeCadence>` | unsigned byte | rpm (0-254) | Max bike cadence |
| `<AvgRunCadence>` | unsigned byte | spm (0-254) | Avg running cadence |
| `<MaxRunCadence>` | unsigned byte | spm (0-254) | Max running cadence |
| `<Steps>` | unsigned short | count | Total step count |
| `<AvgWatts>` | unsigned short | watts | Average power |
| `<MaxWatts>` | unsigned short | watts | Maximum power |

### Unique Data in TCX (Not in Other Formats)

- Lap summaries with pre-computed aggregates (avg/max HR, calories, distance, duration)
- Intensity classification per lap (Active vs Resting)
- Trigger method for laps (what caused the lap split)
- Cumulative distance per trackpoint (not just lat/lon)
- Sport type as structured enum
- Native multi-sport activity support
- Calories burned per lap

---

## FIT (Flexible and Interoperable Data Transfer)

### Overview

FIT is a compact binary protocol designed specifically for sport, fitness, and health devices. It is the native format for Garmin devices and the most data-rich of all fitness file formats.

- **Created by:** Garmin / ANT+ Alliance (Dynastream Innovations)
- **File extension:** `.fit`
- **Encoding:** Binary (NOT human-readable)
- **Design goals:** Compact, interoperable, forward-compatible, endianness-agnostic

**Who produces FIT files:** All modern Garmin devices (Edge, Forerunner, Fenix, Venu, etc.), Wahoo ELEMNT/KICKR, Zwift, Hammerhead Karoo, Bryton, Stages, Favero Assioma pedals, most ANT+ and Bluetooth-enabled fitness devices.

**Typical file sizes:** ~0.32 MB for a 1-hour trail run. FIT files are roughly **8-15x smaller** than equivalent GPX/TCX files because of binary encoding.

### Structure

FIT uses a message-based architecture:
- **Definition messages** describe the structure of upcoming data
- **Data messages** contain the actual field values
- Messages are defined in the Global FIT Profile (Profile.xlsx in the SDK)

**Key message types for activities:**
- `file_id` -- file metadata
- `activity` -- overall activity summary
- `session` -- session-level aggregates
- `lap` -- lap summaries
- `record` -- per-second data points (equivalent to trackpoints)
- `event` -- start/stop/pause events
- `device_info` -- sensor and device metadata
- `hrv` -- heart rate variability (R-R intervals)
- `developer_field` -- custom manufacturer data

### Data Fields Available

FIT records can contain over 100 fields per data point. Key fields include:
- Position (lat/lon in semicircles, not degrees)
- Altitude, enhanced altitude
- Heart rate, cadence, power
- Speed, enhanced speed
- Temperature
- Left/right balance (power meters)
- Torque effectiveness, pedal smoothness
- Stance time, vertical oscillation (running dynamics)
- Stroke count (swimming)
- Training stress score, intensity factor
- Saturated hemoglobin (muscle oxygen sensors)

### Parsing

Garmin provides official FIT SDKs in 8 languages: **C, C++, C#, Java, JavaScript, Objective-C, Python, Swift**.

The **FitCSVTool** (included in the SDK) converts binary FIT files to human-readable CSV for inspection.

### Unique Data in FIT (Not in Other Formats)

- Heart rate variability (R-R intervals)
- Running dynamics (ground contact time, vertical oscillation, stance time)
- Left/right power balance
- Pedal smoothness and torque effectiveness
- Muscle oxygen (SmO2) from sensors like Moxy
- Training effect, training load
- Performance condition
- Developer fields for manufacturer-specific data
- Extremely compact file size

---

## Other Formats

### KML/KMZ (Keyhole Markup Language)

- **Created by:** Keyhole, Inc. (acquired by Google); now an OGC standard
- **File extension:** `.kml` (XML), `.kmz` (ZIP-compressed KML + assets)
- **Purpose:** Geographic visualization, primarily for Google Earth
- **Encoding:** XML (KML) or ZIP (KMZ)
- **Typical file size:** ~5.4 MB for a 1-hour activity (largest of the XML formats)

**What it contains:**
- Placemarks, paths (LineString), polygons
- Rich styling (colors, line widths, icons)
- 3D model embedding
- Time-based animation
- Ground overlays and screen overlays
- Camera positions and fly-to tours

**What it lacks:** No native fitness data (heart rate, cadence, power, calories, laps). Purely geographic/visual.

**Who uses it:** Google Earth, Google Maps (import), GIS applications, geographic visualization. NOT used as a primary fitness file format, but some platforms offer KML export for route visualization.

**Unique to KML:** Rich visual styling, 3D model support, time-based animations, polygon/region support, network links for dynamic content.

### PWX (Peaksware XML)

- **Created by:** Peaksware (parent company of TrainingPeaks)
- **File extension:** `.pwx`
- **Encoding:** XML
- **Namespace:** `http://www.peaksware.com/PWX/1/0`

**Structure:** Root `<pwx>` element containing `<workout>` elements. Each workout has:
- `<athlete>` -- athlete info
- `<sportType>` -- activity type
- `<title>`, `<goal>`, `<cmt>` -- metadata
- `<sample>` elements (time-series data points) with fields for:
  - `<timeoffset>` -- seconds from start
  - `<hr>` -- heart rate
  - `<spd>` -- speed
  - `<pwr>` -- power
  - `<cad>` -- cadence
  - `<dist>` -- distance
  - `<lat>`, `<lon>` -- position
  - `<alt>` -- altitude
  - `<temp>` -- temperature

**Who uses it:** TrainingPeaks, WKO (workout analysis software), some coaching platforms. Structurally similar to TCX.

**Unique to PWX:** Tight integration with TrainingPeaks training plans and coaching features.

### SRM (Schoberer Rad Messtechnik)

- **Created by:** SRM (German power meter manufacturer)
- **File extension:** `.srm`
- **Encoding:** Binary (proprietary)

**What it contains:**
- Power (watts) -- this is the primary data
- Cadence
- Heart rate
- Speed
- Altitude
- Temperature
- Recording interval (commonly 0.5s or 1s)

**Who uses it:** SRM PowerControl head units (PC7, PC8, PM9). Historically important in professional cycling as SRM was the first commercially available cycling power meter.

**Unique to SRM:** Originated the concept of recording power data in cycling. Sub-second recording intervals (0.5s). Very focused on power metrics. Limited ecosystem -- primarily requires SRM's own software (SRMWin) or tools like Golden Cheetah for analysis.

### JSON Activity Exports

#### Strava API JSON

Strava's API returns activity data as JSON. Key fields in a DetailedActivity response:

```json
{
  "id": 1234567890,
  "name": "Morning Run",
  "type": "Run",
  "sport_type": "Run",
  "start_date": "2024-03-15T14:30:00Z",
  "elapsed_time": 1845,
  "moving_time": 1780,
  "distance": 5012.34,
  "total_elevation_gain": 52.0,
  "average_speed": 2.72,
  "max_speed": 4.5,
  "average_heartrate": 152.3,
  "max_heartrate": 178,
  "average_cadence": 87.5,
  "average_watts": 210,
  "max_watts": 385,
  "kilojoules": 420.5,
  "calories": 385,
  "map": {
    "summary_polyline": "encoded_polyline_string"
  }
}
```

Strava also provides **Streams API** for time-series data (arrays of lat/lon, altitude, heartrate, cadence, watts, etc. at each recording interval).

**Strava bulk export** includes: `activities.csv` (summary), individual `.gpx` or `.fit` files per activity, and a `profile.json`.

#### Wahoo API JSON

Wahoo's Cloud API returns workout data as JSON with similar fields (duration, distance, heart rate, power, cadence) plus device-specific information. Wahoo devices (ELEMNT BOLT, ELEMNT ROAM) natively record in FIT format.

**JSON is not a standardized fitness file format** -- each platform defines its own schema. JSON exports are API responses, not interchange files.

---

## Format Comparison Matrix

| Feature | GPX | TCX | FIT | KML | PWX | SRM |
|---------|-----|-----|-----|-----|-----|-----|
| **Encoding** | XML | XML | Binary | XML | XML | Binary |
| **Human-readable** | Yes | Yes | No | Yes | Yes | No |
| **Open standard** | Yes | No (Garmin) | No (Garmin) | Yes (OGC) | No (Peaksware) | No (SRM) |
| **File size (1hr run)** | ~2.8 MB | ~4.8 MB | ~0.32 MB | ~5.4 MB | ~3 MB | ~0.5 MB |
| **GPS coordinates** | Yes | Yes | Yes | Yes | Yes | Sometimes |
| **Elevation** | Yes | Yes | Yes | Yes | Yes | Yes |
| **Heart rate** | Extension | Native | Native | No | Native | Yes |
| **Cadence** | Extension | Native | Native | No | Native | Yes |
| **Power (watts)** | No standard | Extension | Native | No | Native | Native |
| **Calories** | No | Native | Native | No | Yes | No |
| **Lap data** | No | Native | Native | No | Yes | No |
| **Waypoints/POIs** | Native | No | Limited | Yes | No | No |
| **Planned routes** | Native | Courses | Courses | Paths | No | No |
| **Multi-sport** | No | Native | Native | No | No | No |
| **Accuracy (DOP)** | Native | No | No | No | No | No |
| **Running dynamics** | No | No | Native | No | No | No |
| **L/R power balance** | No | No | Native | No | No | No |
| **HRV (R-R intervals)** | No | No | Native | No | No | No |
| **Visual styling** | No | No | No | Native | No | No |
| **Temperature** | Extension | No | Native | No | Native | Yes |
| **Speed per point** | Extension (v2) | Extension | Native | No | Native | Yes |

---

## JavaScript/Node.js Parsing Libraries

### GPX Libraries

#### @we-gold/gpxjs (Recommended)

Modern, actively maintained GPX parser with TypeScript support. Fork of the unmaintained GPXParser.js with significant improvements.

```bash
npm install @we-gold/gpxjs
```

```javascript
import { parseGPX } from "@we-gold/gpxjs";

const gpxString = fs.readFileSync("activity.gpx", "utf-8");
const [parsedGPX, error] = parseGPX(gpxString);

if (error) throw error;

// Access tracks
for (const track of parsedGPX.tracks) {
  console.log(`Track: ${track.name}`);
  console.log(`Distance: ${track.distance.total} meters`);
  console.log(`Duration: ${track.duration} seconds`);
  console.log(`Elevation gain: ${track.elevation.positive} meters`);

  for (const point of track.points) {
    console.log(point.lat, point.lon, point.ele, point.time);
    // Extensions are available in point.extensions
  }
}

// Access waypoints
for (const wpt of parsedGPX.waypoints) {
  console.log(wpt.name, wpt.lat, wpt.lon);
}

// Convert to GeoJSON
const geoJSON = parsedGPX.toGeoJSON();
```

**Features:** TypeScript types, extension parsing, GeoJSON conversion, distance/elevation/slope calculations, Node.js compatible (use `xmldom-qsa` for non-browser environments).

#### gpxparser

The original widely-used GPX parser. No longer actively maintained but still functional.

```bash
npm install gpxparser
```

```javascript
import gpxParser from "gpxparser";

const gpx = new gpxParser();
gpx.parse(gpxString);

console.log(gpx.tracks);    // Array of track objects
console.log(gpx.waypoints); // Array of waypoint objects
console.log(gpx.routes);    // Array of route objects

// Each track has: name, cmt, desc, src, number, type, link,
//   points (array of {lat, lon, ele, time, extensions})
//   distance (total in meters), elevation (min, max, pos, neg, avg),
//   slopes (array of grade percentages)
```

#### gpx-parser-builder

Parses GPX to a JavaScript object and can also build GPX XML from an object. Uses `fast-xml-parser` under the hood. ES Module.

```bash
npm install gpx-parser-builder
```

```javascript
import GPX from "gpx-parser-builder";

// Parse
const gpx = GPX.parse(gpxString);
console.log(gpx.trk); // tracks array
console.log(gpx.wpt); // waypoints array
console.log(gpx.rte); // routes array

// Build
const xmlString = GPX.build(gpx);
```

#### Using fast-xml-parser Directly

For maximum control over parsing (especially for extensions), use a generic XML parser.

```bash
npm install fast-xml-parser
```

```javascript
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  // Preserve namespace prefixes for extensions
  removeNSPrefix: false,
});

const result = parser.parse(gpxString);
const tracks = result.gpx.trk;

// Access track points
const trkpts = tracks.trkseg.trkpt; // or tracks[0].trkseg[0].trkpt
for (const pt of trkpts) {
  const lat = pt["@_lat"];
  const lon = pt["@_lon"];
  const ele = pt.ele;
  const time = pt.time;

  // Access Garmin extensions
  const ext = pt.extensions?.["gpxtpx:TrackPointExtension"];
  const hr = ext?.["gpxtpx:hr"];
  const cad = ext?.["gpxtpx:cad"];
  const temp = ext?.["gpxtpx:atemp"];
}
```

### TCX Libraries

#### tcx-js

The most feature-rich TCX parser for Node.js. Rewritten in TypeScript (2019). Uses `node-expat` (SAX-based) for fast parsing.

```bash
npm install tcx-js
```

```javascript
import { Parser } from "tcx-js";

const parser = new Parser();
parser.parse_file("activity.tcx", (error, result) => {
  if (error) throw error;

  const activities = result.activities;
  for (const activity of activities) {
    console.log(`Sport: ${activity.sport}`);
    for (const lap of activity.laps) {
      console.log(`Lap time: ${lap.totalTimeSeconds}s`);
      console.log(`Distance: ${lap.distanceMeters}m`);
      console.log(`Calories: ${lap.calories}`);
      console.log(`Avg HR: ${lap.averageHeartRateBpm}`);

      for (const point of lap.trackpoints) {
        console.log(point.time, point.latitude, point.longitude);
        console.log(point.heartRateBpm, point.cadence);
      }
    }
  }
});
```

#### @mapbox/tcx (tcx by Mapbox)

Converts TCX DOM to GeoJSON. Works with browser DOM or `xmldom`/`jsdom` in Node.js.

```bash
npm install @mapbox/tcx
```

```javascript
import tcx from "@mapbox/tcx";
import { DOMParser } from "xmldom";

const doc = new DOMParser().parseFromString(tcxString, "text/xml");
const geoJSON = tcx(doc);
// Returns a GeoJSON FeatureCollection
```

#### garmin-tcx-parser

Converts Garmin TCX files into usable data objects.

```bash
npm install garmin-tcx-parser
```

#### Using fast-xml-parser for TCX

Since TCX is XML, the same `fast-xml-parser` approach works:

```javascript
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

const result = parser.parse(tcxString);
const activities = result.TrainingCenterDatabase.Activities.Activity;

// Could be a single object or array depending on the file
const activityList = Array.isArray(activities) ? activities : [activities];

for (const activity of activityList) {
  const sport = activity["@_Sport"];
  const laps = Array.isArray(activity.Lap) ? activity.Lap : [activity.Lap];

  for (const lap of laps) {
    console.log(`Duration: ${lap.TotalTimeSeconds}s`);
    console.log(`Distance: ${lap.DistanceMeters}m`);
    console.log(`Calories: ${lap.Calories}`);

    const trackpoints = lap.Track?.Trackpoint || [];
    const points = Array.isArray(trackpoints) ? trackpoints : [trackpoints];

    for (const tp of points) {
      const lat = tp.Position?.LatitudeDegrees;
      const lon = tp.Position?.LongitudeDegrees;
      const alt = tp.AltitudeMeters;
      const hr = tp.HeartRateBpm?.Value;
      const cad = tp.Cadence;
      const dist = tp.DistanceMeters;

      // Power via ActivityExtension
      const tpx = tp.Extensions?.TPX;
      const watts = tpx?.Watts;
      const speed = tpx?.Speed;
    }
  }
}
```

### FIT Libraries

#### @garmin/fitsdk (Official)

Garmin's official FIT SDK includes a JavaScript implementation.

#### fit-file-parser

Community library for parsing FIT files in Node.js.

```bash
npm install fit-file-parser
```

```javascript
import FitParser from "fit-file-parser";

const fitParser = new FitParser({ force: true });
const buffer = fs.readFileSync("activity.fit");

fitParser.parse(buffer, (error, data) => {
  if (error) throw error;

  console.log(data.activity);    // Activity summary
  console.log(data.sessions);    // Session summaries
  console.log(data.laps);        // Lap summaries
  console.log(data.records);     // Per-second data points

  for (const record of data.records) {
    console.log(record.timestamp);
    console.log(record.position_lat, record.position_long);
    console.log(record.altitude, record.heart_rate);
    console.log(record.cadence, record.power);
    console.log(record.speed, record.temperature);
  }
});
```

### Recommendation for This Project

For a project using **plain JS with Vite and Netlify Functions (ESM)**:

1. **GPX:** Use `@we-gold/gpxjs` for full-featured parsing with TypeScript support, or `fast-xml-parser` for maximum control over extension data (HR, power, cadence).
2. **TCX:** Use `fast-xml-parser` directly -- the dedicated TCX libraries are older and less maintained. Direct XML parsing gives full access to lap summaries and ActivityExtension power data.
3. **FIT:** Use `fit-file-parser` for the binary format. This is the only option that does not require XML parsing.
4. **Generic approach:** If you only need to support one XML format, `fast-xml-parser` handles both GPX and TCX with a single dependency.

---

## Sources

- [GPX: the GPS Exchange Format (TopoPrafix)](https://www.topografix.com/gpx.asp)
- [GPX 1.0 Developer's Manual](https://www.topografix.com/gpx_manual.asp)
- [GPX 1.1 Schema Documentation](https://www.topografix.com/GPX/1/1/)
- [GPS Exchange Format - Wikipedia](https://en.wikipedia.org/wiki/GPS_Exchange_Format)
- [Training Center XML - Wikipedia](https://en.wikipedia.org/wiki/Training_Center_XML)
- [TCX File Format - FileFormat.com](https://docs.fileformat.com/gis/tcx/)
- [TCX - Training Center XML (GPS Wizard)](https://logiqx.github.io/gps-wizard/formats/tcx.html)
- [GPX Extensions (GPS Wizard)](https://logiqx.github.io/gps-wizard/gpx/extensions.html)
- [Garmin TrackPointExtension v2 Schema](https://www8.garmin.com/xmlschemas/TrackPointExtensionv2.xsd)
- [Garmin ActivityExtension v2 Schema](https://www8.garmin.com/xmlschemas/ActivityExtensionv2.xsd)
- [Garmin TrainingCenterDatabase v2 Schema](https://www8.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd)
- [FIT SDK Overview (Garmin Developers)](https://developer.garmin.com/fit/overview/)
- [GPS Activity Data File Types Comparison](https://blog.concannon.tech/tech-talk/gps-activity-data-file-types/)
- [Supported File Formats - Cycling Analytics](https://www.cyclinganalytics.com/blog/2013/06/supported-file-formats)
- [GPX vs TCX Differences (GPX 1.0 vs 1.1)](https://github.com/pdhoopr/gps-to-gpx/issues/11)
- [@we-gold/gpxjs on npm](https://www.npmjs.com/package/@we-gold/gpxjs)
- [gpxparser on npm](https://www.npmjs.com/package/gpxparser)
- [gpx-parser-builder on npm](https://www.npmjs.com/package/gpx-parser-builder)
- [tcx-js on npm](https://www.npmjs.com/package/tcx-js)
- [garmin-tcx-parser on npm](https://www.npmjs.com/package/garmin-tcx-parser)
- [Mapbox TCX on GitHub](https://github.com/mapbox/tcx)
- [PWX Schema on GitHub](https://github.com/samv/XML-PWX/blob/master/pwx.xsd)
- [Strava Bulk Export Documentation](https://support.strava.com/hc/en-us/articles/216918437-Exporting-your-Data-and-Bulk-Export)
- [GPX - OpenStreetMap Wiki](https://wiki.openstreetmap.org/wiki/GPX)
