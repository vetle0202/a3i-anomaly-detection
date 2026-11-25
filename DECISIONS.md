# Decisions

One entry per choice we make, written when we make it. Keep them short. The point is
that any of us can answer "why did you do it that way?" months later.

Format: **what we chose** — why, and what we rejected.

---

## Problem framing

**Anomaly detection, not classification.** MetroPT-3 documents four air-leak
failures. Four examples cannot teach a classifier what a failure looks like, but
there are 213 days of normal operation to model. So we learn normality and flag
deviations from it. Rejected: supervised classification on a "failure within N hours"
label.

**Two datasets, one pipeline.** The course tutor pointed out that four failures is
too thin to evaluate anything, and suggested a second dataset with the same technique
applied to it. Kelmarsh gives hundreds of labelled events at the same 10-minute
resolution, so the pipeline transfers without new methods. Rejected: a second
compressor dataset (MetroPT-2), which has only two more failures and so does not fix
the problem.

## Data preparation

**10-minute aggregation.** MetroPT-3 samples every 10 seconds, which gives 1.5 M rows
of mostly redundant readings. Ten-minute means reduce it to 30 696 rows, roughly the
size of the taxi series from block 1, and match Kelmarsh's native resolution so both
datasets run through the same code. Rejected: keeping the raw rate (too slow, no extra
information at the timescale leaks develop over).

**February only as the normal-operation baseline — to be confirmed.** The first
exploration shows TP2, DV_pressure and oil temperature all shifting character around
1 March, so February and March are not the same regime. Training on both would mix
them. Needs a proper look before we commit.

## Kelmarsh labels

Code in notebook 2.

**Failure label = IEC category "Forced outage", both Stop and Warning lines.**
Forced outage is the IEC availability category for unplanned stops caused by a
fault. Scheduled maintenance and low-wind stops are excluded. We keep the Warning
lines because in almost all of them the turbine produces zero power for the whole
duration. Rejected: using `Status == 'Stop'` alone, which would drop real outages.

**Merge overlapping log lines into one event.** One fault writes several lines at
once (fan 1, 2 and 3 overloaded within seconds). Lines that overlap in time on the
same turbine become one event. 176 lines become 141 events across the farm.
Rejected: counting lines, which inflates the number of failures.

**Duration = end − start, not the `Duration` column.** The file writes durations
above 24 h as `548:13:20`, which pandas cannot parse.

**Read the CSVs as UTF-8.** The README said latin-1, but this archive is UTF-8:
with latin-1 every `°C` becomes `Â°C` and the column names no longer match.

**Judge bearing temperature against power, not on its own.** Front and rear bearing
sit at 70–75 °C under load and fall towards outdoor temperature at standstill, so
raw temperature mostly tells us how windy it was. Whatever detector we build needs
power (and probably wind speed) as an input alongside temperature.

## Alarms, evaluation and cost

Code in `util/evaluation.py`, demonstrated in notebook 3.

**Cost of a false alarm = 1, cost of a missed failure = 20.** We do not know what
Metro do Porto pays, so we work in units of one false alarm. A false alarm means a
technician inspects the train at the depot and finds nothing: a few hours of labour,
perhaps one service run with a spare train. A missed leak means the train is withdrawn
unplanned in service, passengers are disrupted, and the compressor runs under strain
until someone notices, which can turn a seal replacement into a compressor repair.
A factor of 20 between those is a deliberately moderate guess. Rejected: putting euro
figures on it, which would look precise without being any more justified.

**The ratio decides one thing, so we show it rather than defend one number.** On the
synthetic series in notebook 3, the chosen threshold is the same for any ratio from
7 up to 100, and only moves when a miss costs less than 7 false alarms (it then lets
the weakest failure go, because catching it costs 7 extra false alarms). So the claim we have to defend is "a missed
failure costs more than a handful of inspections", which is easy, not "exactly 20",
which is not. Re-run the sensitivity plot on real scores before trusting this.

**Merge alarms with a 6-hour refractory period.** After an alarm, further crossings
within 6 hours are the same event. Otherwise one sustained excursion at 10-minute
resolution counts as dozens of alarms. If the score is still high after 6 hours, a
new alarm fires and counts again, because in practice a technician would be sent
again. 6 hours is roughly a shift. Rejected: merging whole contiguous excursions into
one alarm, which makes a score stuck above threshold for a week cost the same as a
single blip, and makes very low thresholds look cheap.

**An alarm up to 2 days before a failure counts as detecting it — provisional.**
Notebook 1 shows precursor spikes a day or two before F1 and F3, so 2 days is the
shortest window that would credit them. It is a parameter (`lead=`) so we can change
it once we answer the open question below. Earlier alarms count as false.

**Choose the threshold at, or a little below, the minimum of the cost curve.** The
curve is lopsided: below the minimum cost rises one false alarm at a time, above it
cost jumps by a whole missed failure. Erring low is therefore cheap and erring high is
not, and a lower threshold also gives more warning time. Ties go to the lowest
threshold for the same reason.

**Lead time is reported but not priced.** The cost model treats an alarm two minutes
before a failure the same as one a day before, though industrially the second is worth
far more. We report warning time per failure next to the cost rather than invent a
price curve for it. Possible extension if time allows: a missed-failure cost that is
reduced in proportion to the warning given.

**Synthetic test scores use Student's t noise (4 df), not Gaussian.** With Gaussian
noise false alarms disappear abruptly above about 4 sigma and every cost ratio picks
the same threshold, which makes the problem look easier than real scores will be.
Heavy tails are a closer stand-in for what a KDE or autoencoder produces.

## Open questions

- How long before a reported failure counts as anomalous? This is the single choice
  we will be asked about most. Decide it deliberately and write down the reasoning.
  Currently 2 days, provisionally (see `lead=` above).
- The fourth MetroPT failure (15 July) shows no DV_pressure signature at all, only a
  slow rise in oil temperature. Different failure mode, or a mislabelled window?
- There are excursions as large as the labelled failures outside the reported
  windows, notably mid-May. Unreported leaks, or false positives? We cannot tell, and
  that is itself the argument for calibrating the threshold against cost.
- Does a detector trained on one Kelmarsh turbine work on the other five?
- Most Kelmarsh forced outages are protective stops (tower oscillation, high rotor
  speed, pitch run-away, converter faults), not wear. Should we evaluate on all of
  them, only on fault types a temperature sensor could plausibly see, or report
  recall per fault type? Notebook 2 found no pre-failure bearing signal before the
  four longest outages of 2017.
- 2017 has no long outage that looks like a worn component. If we want a real
  bearing or gearbox failure to test on, we may need another year from the same
  Zenodo page.

## Noted while exploring

**February-only baseline makes z-scores explode.** `DV_pressure` is almost constant
in February, so its baseline standard deviation is near zero and the scaled values
reach 140. Fine for reading the shape of a plot, useless as a detector. Whatever we
use for scaling in notebook 2 needs to handle a near-constant baseline.

**"Overload generator fan" outages look like a service round.** All ten happen on
weekday mornings, and in January–March they move through turbines 1, 2, 3, 4, 5 in
turn. Probably technicians testing the fans, not faults. Not confirmed; worth
checking before we count them as failures. Notebook 5 shows the 17 August overload on turbine 1
is different: the generator bearing runs about 15 °C hot for a day afterwards, so
that one looks like a real fault.

## The MetroPT detector

Code in notebook 4.

**Train on February and March, not February alone.** `DV_pressure` has a standard
deviation of 0.0136 in February against 0.1271 once March is included, a factor of
ten. `StandardScaler` divides by it, so training on February alone turns every later
`DV_pressure` reading into a huge number and makes a seven-sensor model behave like a
one-sensor model. February plus March is still entirely before the first reported
failure. Rejected: February alone, and scaling by a robust spread, which would have
been a second thing to explain for no gain.

**The cost of that choice:** the early `DV_pressure` spikes in March are now part of
what the model calls normal. If those spikes are early signs of the April leak, we
have taught it to ignore the thing we want it to catch. Worth testing later by
training on February alone with a robust scaler and seeing whether F1 scores higher.

**Bandwidth 0.5, chosen for readability, not performance.** 0.1, 0.5 and 2.0 rank the
four failures the same way; the separation between normal and failure moves from 1.18
to 1.09 across the whole range. 0.1 puts the scores in the thousands and 2.0 squeezes
them flat, so we take the middle. We should say plainly that this parameter did not
matter rather than pretend it was tuned.

**Score each 10-minute row on its own, no sliding window yet.** Simplest thing that
produces a score, and it works. The weakness is that one odd reading counts the same
as an hour of them, though only the second justifies sending a technician. Sivert's
refractory period in `util/evaluation.py` partly compensates. A sliding window is the
obvious next improvement if there is time.

**What the detector actually achieves.** 99 % of F1 and 83 % of F3 score above the
99th percentile of normal; F2 reaches it for 14 % of its labelled window, matching the
plateau seen in notebook 1; F4 never does, also matching notebook 1. But the 99th
percentile of normal is 112 against a median of 130 inside failures, so normal
operation regularly scores as high as a leak. The project's real question is
therefore the threshold, not the model.

## The Kelmarsh detector

Code in notebook 5. Same recipe as notebook 4 so the two are comparable.

**Five sensors: three bearing temperatures plus power and wind speed.** Notebook 2
found bearing temperature mostly tracks load. With power and wind as inputs the KDE
learns which temperature is normal for a given load, so a high score means a
temperature that does not fit the power. Rejected: temperatures alone, which would
mostly flag windy days.

**Train on 22 April – 3 June 2017, the same period for all six turbines.** The
longest stretch with no forced outage on any turbine runs to 5 June. We stop two
days early so that the two-day warning window before turbine 2's outage on 6 June
is not inside the training data; otherwise the model is taught that exactly the rows
we test for warnings are normal. About 6 200 rows per turbine. One period for all
is one rule to explain. No sensor is near-constant in it, so the scaling
problem from notebook 4 does not arise; the generator bearing has the smallest
spread relative to the year (2.9 °C against 4.1 °C), because it follows the season.
Rejected: each turbine's own longest outage-free stretch (six different periods to
defend), and the whole year minus the outages (scores the model's own training data
and mixes in whatever happens around unlabelled stops).

**The cost of that choice:** the model has never seen winter or a storm (maximum wind
in training is about 13 m/s). Cold months and strong wind score high regardless of
turbine health. Training on more of the year would reduce this and is the first
thing to try if the Kelmarsh false alarms matter.

**One model per turbine, bandwidth 0.5, 5000-row sample.** Bandwidth chosen to match
notebook 4, not tuned: 0.1, 0.5 and 2.0 give 10 %, 10 % and 7 % of pre-outage rows
above the 99th percentile of normal on turbine 1.

**Evaluate "before" and "during" separately.** During an outage power is zero while
the wind blows, so the score is high (42–88 % of rows above the line). That is the
model seeing the stop, which the status log already reports. "Before" is the two
days leading up to an outage, the same as `lead=` in `util/evaluation.py`.

**Compare "before" against normal rows in the same month.** Outages cluster in
January and February, when the score is high anyway because of the cold. Comparing
against the whole year would credit the detector with a warning that is really
winter.

**What the detector achieves: no early warning.** Turbines 4–6 are at or near the
same-month baseline before outages. Turbines 1–3 are above it, explained by the
turbine already standing still after an earlier stop, by storm wind beyond the
training range, and on turbine 1 by the hot generator bearing *after* the August fan
fault. The detector does catch a temperature that does not fit the load when one
happens (17 August, and more weakly after the farm-wide remote stop on 23 October),
but both times after the stop, not before it. Most forced outages are
instantaneous protective stops with nothing to precede them, so this is the expected
result, not a broken model.

**Every restart after a long stop scores high, whatever the cause.** The tallest
spike on turbine 1 is a 26-hour grid loss on 11 February, which IEC does not count as
a forced outage. Notebook 6 will count these as false alarms.
