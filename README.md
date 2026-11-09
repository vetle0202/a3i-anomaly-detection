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
| Failure labels | None. 4 air leaks described in the documentation | Status log with IEC categories; 38 forced outages on one turbine in 2017 alone |

## Method

Following lecture blocks 1 and 3:

1. Aggregate to 10-minute windows and build sliding-window features.
2. Model normal operation with kernel density estimation.
3. Compare against an autoencoder.
4. Calibrate the alarm threshold against a cost model: false alarm vs missed failure.

We use anomaly detection rather than classification because four failure events are
far too few to learn what a failure looks like, while there is a great deal of normal
operation to model.

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
- The files are **not UTF-8**. Pass `encoding='latin-1'` or the degree signs break.

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
notebooks/   one notebook per stage
util/        our own helper functions
data/        datasets, not tracked
DECISIONS.md why we chose what we chose — keep this current
```

## DECISIONS.md

Read it before you change anything, and add to it as you go. "Your ability to
motivate your choices" is one of four grading criteria, and in December nobody
remembers why the window ended up at 60 minutes.
