'''Turning an anomaly score into alarms, and alarms into a cost.

Everything here takes a plain pandas Series of scores indexed by time, so it works
the same for any detector (KDE, autoencoder, or the synthetic series in notebook 3).

Failures are given as a list of (start, end) pairs. Anything pandas can turn into a
Timestamp works, e.g. ('2020-04-18', '2020-04-18 23:59').

Two choices are made here rather than left to the caller every time. Both are
parameters, and both are explained in DECISIONS.md:

- refractory: after an alarm, further crossings within this time are the same
  event, not new ones. Otherwise one sustained excursion counts as a hundred alarms.
- lead: how long before a failure starts an alarm still counts as a warning of it.
  Alarms earlier than that, or outside every failure, are false alarms.
'''

import numpy as np
import pandas as pd

REFRACTORY = '6h'
LEAD = '2D'


def _periods(failures):
    return [(pd.Timestamp(s), pd.Timestamp(e)) for s, e in failures]


def alarms(scores, threshold, refractory=REFRACTORY):
    '''Times at which the score raises an alarm.

    An alarm fires at the first point above the threshold. For `refractory` after
    that, nothing new fires. If the score is still above the threshold when the
    refractory period runs out, the next point above it fires a new alarm: a
    technician who has already been out once would be sent again.
    '''
    refractory = pd.Timedelta(refractory)
    above = scores.index[scores.to_numpy() > threshold]

    fired = []
    for t in above:
        if not fired or t - fired[-1] >= refractory:
            fired.append(t)
    return pd.DatetimeIndex(fired)


def evaluate(scores, failures, threshold, lead=LEAD, refractory=REFRACTORY):
    '''Count detections, misses and false alarms, and measure the warning time.

    A failure is detected if at least one alarm falls in [start - lead, end].
    Its lead time is start minus the first such alarm, so positive means the
    warning came before the failure began, negative means it came during it.
    Alarms that fall in no failure's window are false alarms.

    Returns a dict:
        detected, missed, false_alarms   counts
        lead_times                       Series, one per failure, NaT if missed
        alarms                           the alarm times themselves
    '''
    lead = pd.Timedelta(lead)
    periods = _periods(failures)
    fired = alarms(scores, threshold, refractory)

    explained = np.zeros(len(fired), dtype=bool)
    lead_times = []
    for start, end in periods:
        inside = (fired >= start - lead) & (fired <= end)
        explained |= inside
        lead_times.append(start - fired[inside][0] if inside.any() else pd.NaT)

    lead_times = pd.Series(lead_times, index=[str(s) for s, _ in periods],
                           name='lead_time', dtype='timedelta64[ns]')
    detected = int(lead_times.notna().sum())

    return {
        'detected': detected,
        'missed': len(periods) - detected,
        'false_alarms': int((~explained).sum()),
        'lead_times': lead_times,
        'alarms': fired,
    }


def total_cost(scores, failures, threshold, cost_false_alarm, cost_missed,
               lead=LEAD, refractory=REFRACTORY):
    '''False alarms times their cost, plus missed failures times theirs.'''
    r = evaluate(scores, failures, threshold, lead, refractory)
    return r['false_alarms'] * cost_false_alarm + r['missed'] * cost_missed
