# Anomaly detection for predictive maintenance

Exam project for *AI in Industry* (91261), University of Bologna, 2026/27.

Vetle Johannes Svendsen, Christian Sommer, Sivert Rommetveit.

## What this is

We detect developing faults in industrial machinery from sensor data, and turn the
detector into a maintenance decision: when is it worth sending out a technician?

We run the same pipeline on two datasets. The first has very few labelled failures,
the second has many, which lets us check whether the approach holds up when there is
enough data to evaluate it properly.

| | MetroPT-3 | Kelmarsh |
|---|---|---|
| System | Air compressor on a Porto metro train | 6 wind turbines, Northamptonshire |
| Period | Feb–Sep 2020 | 2016–2024 (we use 2017) |
| Resolution | 0.1 Hz, aggregated to 10 min | 10 min |
| Failure labels | None. 4 air leaks described in the documentation | Status log with IEC categories; 141 forced outages across the farm in 2017 |

## Method

Following lecture blocks 1 and 3:

1. Aggregate to 10-minute windows.
2. Model normal operation with kernel density estimation.
3. Compare against an autoencoder and against a sliding-window variant.
4. Calibrate the alarm threshold against a cost model: false alarm vs missed failure.

We use anomaly detection rather than classification because four failure events are
far too few to learn what a failure looks like, while there is a great deal of normal
operation to model.

## What we found

**MetroPT.** The detector separates the leaks that build up slowly. At the threshold
we chose it catches three of the four, with a day and a half of warning before one of
them and none before the other two — the sensors carry no trace of those until they
begin. Neither a sliding window nor an autoencoder improves on that, which is how we
know the limit is the data rather than the model. The price is a false alarm roughly
once a week.

**Kelmarsh.** On paper it does better: 122 of 141 outages flagged, most of them hours
in advance. It does not survive scrutiny. Shifting the alarms to random times still
"catches" about 18; outages arrive in bursts, so one alarm is credited with several,
and only 50 of the 141 are isolated; and of the 28 isolated outages with an alarm
before them, 27 happened during a storm or with the turbine already stopped. One is
left.

**The lesson.** The method suits faults that develop and move the sensors while they
do. Most of these outages are protective trips that fire within seconds. What the
detector had really learned was that six spring weeks contain no winter, and since
storms cause trips, reacting to storms looks exactly like predicting failures. A
detection count has to be checked against chance before it means anything.

## Getting the data

`data/` is not tracked by git. Download both archives into it yourself:

- **MetroPT-3** — https://archive.ics.uci.edu/dataset/791/metropt+3+dataset
  (direct: `https://archive.ics.uci.edu/static/public/791/metropt+3+dataset.zip`, 209 MB, CC BY 4.0)
- **Kelmarsh** — https://zenodo.org/records/16807551
  We use `Kelmarsh_SCADA_2017_3083.zip` (175 MB, CC BY 4.0). Other years are on the
  same page if we need them.

Leave both as `.zip`; the notebooks read them directly.

### Reading the Kelmarsh files

Three things that will waste your afternoon otherwise:

- Each CSV has **9 comment lines** before the header. Use `skiprows=9`.
- The timestamp column is named `# Date and time`, hash and space included.
- The files are UTF-8 (the default). Do not pass `encoding='latin-1'`: it turns every
  `°C` into `Â°C` and the column names stop matching.
- In the status log, open events have `-` as end time. Pass `na_values='-'`.

Of the 299 columns, 105 have more than 90 % coverage. The ones we care about —
bearing temperatures, power, wind speed — are around 98.8 % complete.

## Setup

```sh
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Layout

```
notebooks/   one notebook per stage, run them in order
util/        our own helper functions
data/        the two archives, not tracked
results/     anomaly scores, one file per detector
figures/     plots exported from the notebooks
DECISIONS.md why we chose what we chose
build_deck.js  rebuilds the slides from figures/ (needs pptxgenjs)
```

| Notebook | What it does |
|---|---|
| 1 | Look at the MetroPT data and the four reported leaks |
| 2 | Look at the Kelmarsh SCADA and build the outage labels |
| 3 | The alarm and cost machinery, on synthetic scores |
| 4 | KDE detector on MetroPT |
| 5 | The same detector on Kelmarsh |
| 6 | Thresholds, costs and the comparison — **read this one for the results** |
| 7 | Does a sliding window help? No |
| 8 | Does an autoencoder help? Also no |

## DECISIONS.md

Read it before you change anything, and add to it as you go. "Your ability to
motivate your choices" is one of four grading criteria, and in December nobody
remembers why the window ended up at 60 minutes.

## Note on the virtual environment

Do not put `.venv` inside the OneDrive folder. It is tens of thousands of small
files and OneDrive will sync every one of them, which makes installing packages
painfully slow. Keep it somewhere local, for example `C:\dev\a3i\.venv`, and point
VS Code at it.
