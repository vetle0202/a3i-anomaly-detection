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

## Open questions

- How long before a reported failure counts as anomalous? This is the single choice
  we will be asked about most. Decide it deliberately and write down the reasoning.
- The fourth MetroPT failure (15 July) shows no DV_pressure signature at all, only a
  slow rise in oil temperature. Different failure mode, or a mislabelled window?
- There are excursions as large as the labelled failures outside the reported
  windows, notably mid-May. Unreported leaks, or false positives? We cannot tell, and
  that is itself the argument for calibrating the threshold against cost.
- Does a detector trained on one Kelmarsh turbine work on the other five?

## Noted while exploring

**February-only baseline makes z-scores explode.** `DV_pressure` is almost constant
in February, so its baseline standard deviation is near zero and the scaled values
reach 140. Fine for reading the shape of a plot, useless as a detector. Whatever we
use for scaling in notebook 2 needs to handle a near-constant baseline.
