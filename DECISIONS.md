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
checking before we count them as failures.
