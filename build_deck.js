// Builds the exam presentation. Run: node build_deck.js
const pptxgen = require('pptxgenjs');

const THEME = {
  name: 'Compressor',
  headFontFace: 'Cambria',
  bodyFontFace: 'Calibri',
  colors: {
    dk1: '1A202C', lt1: 'FFFFFF', dk2: '2D3748', lt2: 'F2F4F7',
    accent1: 'C05621', accent2: '2B6CB0', accent3: 'DD6B20',
    accent4: '718096', accent5: '9C4221', accent6: '4A5568',
    hlink: '2B6CB0', folHlink: '718096',
  },
};

const FIG = 'figures/';
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';            // 13.33 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.author = 'Vetle Svendsen, Christian Sommer, Sivert Rommetveit';
pres.title = 'Catching a leak before it stops the train';
// Colours straight from THEME, so this script has no dependencies beyond pptxgenjs.
const C = { background1: THEME.colors.lt1, background2: THEME.colors.lt2,
            text1: THEME.colors.dk1, text2: THEME.colors.dk2 };

// ---------------------------------------------------------------- layouts

pres.defineSlideMaster({
  title: 'DARK',
  background: { color: THEME.colors.dk1 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 1.0, y: 2.3, w: 11.3, h: 1.9,
        fontSize: 40, bold: true, color: C.background1, valign: 'bottom', align: 'left' }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 1.0, y: 4.35, w: 11.3, h: 2.0,
        fontSize: 16, color: 'CBD5E0', valign: 'top', align: 'left' }, text: '' } },
  ],
});

pres.defineSlideMaster({
  title: 'CONTENT',
  background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.75, y: 0.55, w: 11.8, h: 0.85,
        fontSize: 32, bold: true, color: C.text1, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.75, y: 1.6, w: 11.8, h: 5.2,
        fontSize: 16, color: C.text2, valign: 'top' }, text: '' } },
  ],
  slideNumber: { x: 12.6, y: 6.8, fontSize: 10, color: THEME.colors.accent4 },
});

pres.defineSlideMaster({
  title: 'FIGURE',
  background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.75, y: 0.45, w: 11.8, h: 0.8,
        fontSize: 32, bold: true, color: C.text1, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.75, y: 1.25, w: 11.8, h: 0.55,
        fontSize: 15, color: THEME.colors.accent6, valign: 'top' }, text: '' } },
  ],
  slideNumber: { x: 12.6, y: 6.8, fontSize: 10, color: THEME.colors.accent4 },
});

// ---------------------------------------------------------------- helpers

// A plain stat: big figure, small label. No box, no stripe.
function stat(slide, x, y, value, label, w = 2.9, color = THEME.colors.accent1,
              labelColor = THEME.colors.accent6) {
  slide.addText(value, { x, y, w, h: 0.85, isTextBox: true, margin: 0,
    fontSize: 46, bold: true, color, align: 'left', objectName: `stat-${label}` });
  slide.addText(label, { x, y: y + 0.82, w, h: 0.75, isTextBox: true, margin: 0,
    fontSize: 13, color: labelColor, align: 'left' });
}

// A tinted block of text. Tint, not a stripe.
function card(slide, x, y, w, h, heading, lines, name) {
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.06,
    fill: { color: C.background2 }, line: { color: 'E2E8F0', width: 1 }, objectName: name });
  slide.addText(heading, { x: x + 0.35, y: y + 0.28, w: w - 0.7, h: 0.4, isTextBox: true,
    margin: 0, fontSize: 17, bold: true, color: C.text1 });
  slide.addText(lines.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < lines.length - 1 } })),
    { x: x + 0.35, y: y + 0.78, w: w - 0.7, h: h - 1.1, isTextBox: true, margin: 0,
      fontSize: 14, color: C.text2, paraSpaceAfter: 6 });
}

// ---------------------------------------------------------------- slides

pres.addSection({ title: 'Opening' });
let s = pres.addSlide({ masterName: 'DARK', sectionTitle: 'Opening' });
s.addText('Catching a leak before it stops the train', { placeholder: 'title' });
s.addText([
  { text: 'Anomaly detection for predictive maintenance, tested on two machines', options: { breakLine: true, fontSize: 18, color: 'E2E8F0' } },
  { text: 'Vetle Svendsen · Christian Sommer · Sivert Rommetveit', options: { breakLine: true, fontSize: 14 } },
  { text: 'AI in Industry, University of Bologna, 2026/27', options: { fontSize: 14, color: THEME.colors.accent4 } },
], { placeholder: 'body' });
s.addNotes('We detect developing faults from sensor data and turn the detector into a maintenance decision. Two datasets, one method.');

pres.addSection({ title: 'Setup' });
s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Setup' });
s.addText('Two machines, one method', { placeholder: 'title' });
s.addText('We ran the same detector on a dataset with almost no labelled failures and one with plenty, to see whether the method holds up when there is enough data to judge it.',
  { x: 0.75, y: 1.5, w: 11.8, h: 0.5, isTextBox: true, margin: 0, fontSize: 16, color: C.text2 });
card(s, 0.75, 2.25, 5.6, 3.05, 'MetroPT-3 — metro train compressor', [
  '1.5 million readings, 7 analogue sensors',
  'February to September 2020',
  'No label column: four air leaks described in the documentation',
  'Public, UCI Machine Learning Repository',
], 'card-metropt');
card(s, 6.95, 2.25, 5.6, 3.05, 'Kelmarsh — six wind turbines', [
  '10-minute SCADA, 2017',
  'Status log gives labels for free',
  '141 unplanned outages after merging duplicate log lines',
  'Public, Zenodo',
], 'card-kelmarsh');
s.addText('4 failures to learn from, against 141. That contrast is the experiment.',
  { x: 0.75, y: 5.9, w: 11.8, h: 0.5, isTextBox: true, margin: 0, fontSize: 16, italic: true, color: THEME.colors.accent1 });
s.addNotes('Four failures is far too few to evaluate anything, which is why the tutor suggested a second dataset. Kelmarsh gives us hundreds of labelled events at the same resolution, so the same code runs on both.');

s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Setup' });
s.addText('Learn what normal looks like, then flag the rest', { placeholder: 'title' });
s.addText('We never show the model a failure. With four examples there is nothing to learn from, but there are 213 days of ordinary running to describe.',
  { x: 0.75, y: 1.5, w: 11.8, h: 0.5, isTextBox: true, margin: 0, fontSize: 16, color: C.text2 });
const steps = [
  ['1', 'Average to 10 minutes', 'A leak develops over hours. Readings 10 seconds apart carry no extra information and match the wind data.'],
  ['2', 'Fit a density on normal operation', 'Kernel density estimation over February and March, before the first reported leak.'],
  ['3', 'Score by how unlikely each reading is', 'Negative log density. High score means the machine is somewhere it has not been before.'],
  ['4', 'Set the alarm level by cost', 'A false alarm is one inspection. A missed leak we priced at twenty of those.'],
];
steps.forEach(([n, head, body], i) => {
  const y = 2.3 + i * 1.12;
  s.addText(n, { x: 0.75, y: y - 0.08, w: 0.5, h: 0.5, isTextBox: true, margin: 0,
    fontSize: 24, bold: true, color: THEME.colors.accent1, valign: 'top' });
  s.addText(head, { x: 1.35, y, w: 4.0, h: 0.45, isTextBox: true, margin: 0,
    fontSize: 17, bold: true, color: C.text1, valign: 'top' });
  s.addText(body, { x: 5.5, y, w: 7.0, h: 0.9, isTextBox: true, margin: 0,
    fontSize: 14, color: C.text2, valign: 'top' });
});
s.addNotes('Four steps, all from lecture block 1 and 3. The whole pipeline is StandardScaler, KernelDensity, and a threshold sweep.');

pres.addSection({ title: 'MetroPT' });
s = pres.addSlide({ masterName: 'FIGURE', sectionTitle: 'MetroPT' });
s.addText('It does find the leaks', { placeholder: 'title' });
s.addText('Top: the valve pressure sensor. Bottom: the anomaly score. Shaded bands are the four reported leaks.', { placeholder: 'body' });
s.addImage({ path: FIG + 'nb4_fig2.png', x: 0.95, y: 1.95, w: 11.4, h: 4.69 });
s.addNotes('Three of the four leaks are obvious. The fourth, in July, never shows up in valve pressure at all: only a slow rise in oil temperature. Probably a different kind of fault.');

s = pres.addSlide({ masterName: 'FIGURE', sectionTitle: 'MetroPT' });
s.addText('The cheapest alarm warns you too late', { placeholder: 'title' });
s.addText('Cost of every threshold, counting a missed leak as twenty false alarms.', { placeholder: 'body' });
s.addImage({ path: FIG + 'nb6_fig2.png', x: 0.75, y: 1.9, w: 7.4, h: 4.12 });
s.addText('Warning before each leak at the cheapest threshold', { x: 8.5, y: 1.95, w: 4.1, h: 0.4,
  isTextBox: true, margin: 0, fontSize: 15, bold: true, color: C.text1 });
const leads = [['F1', '18 min late', 'C05621'], ['F2', '23 hours late', 'C05621'],
               ['F3', '1.5 days early', '2F855A'], ['F4', 'likely chance', '718096']];
leads.forEach(([lab, val, col], i) => {
  const y = 2.55 + i * 0.62;
  s.addText(lab, { x: 8.5, y, w: 0.6, h: 0.4, isTextBox: true, margin: 0,
    fontSize: 15, bold: true, color: THEME.colors.accent6 });
  s.addText(val, { x: 9.15, y, w: 3.4, h: 0.4, isTextBox: true, margin: 0, fontSize: 15, color: col });
});
s.addText('The cost model counts a detection the same whether it arrives a day early or an hour late. Read it next to the warning time or it will choose a useless threshold for you.',
  { x: 8.5, y: 5.2, w: 4.1, h: 1.4, isTextBox: true, margin: 0, fontSize: 14, italic: true, color: C.text2 });
s.addNotes('This is the slide to slow down on. The cost minimum is 61, catching everything for 22 false alarms. But at 61 we learn about F1 eighteen minutes after it has started, which is worth nothing to a maintenance planner. We moved the threshold up to 110 deliberately.');

s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'MetroPT' });
s.addText('Two obvious fixes, neither of them helped', { placeholder: 'title' });
s.addText('If the detector is late because single readings are noisy, averaging over an hour should help. We gave both versions the same false alarm budget, so neither could win by crying wolf more often.',
  { x: 0.75, y: 1.5, w: 11.8, h: 0.6, isTextBox: true, margin: 0, fontSize: 16, color: C.text2 });
s.addTable([
  [{ text: '', options: { fill: { color: 'FFFFFF' } } },
   { text: 'One reading', options: { bold: true, color: '1A202C' } },
   { text: 'One-hour average', options: { bold: true, color: '1A202C' } }],
  [{ text: 'F1', options: { bold: true } }, '0.3 h late', '0.5 h late'],
  [{ text: 'F2', options: { bold: true } }, '23.3 h late', '23.7 h late'],
  [{ text: 'F3', options: { bold: true } }, '37.8 h early', '37.3 h early'],
], { x: 0.75, y: 2.5, w: 7.0, colW: [1.2, 2.9, 2.9], rowH: 0.62, fontSize: 14,
     color: '2D3748', border: { type: 'solid', color: 'E2E8F0', pt: 1 }, align: 'left', valign: 'middle' });
s.addText('So the lateness is not noise', { x: 8.3, y: 2.5, w: 4.3, h: 0.45, isTextBox: true,
  margin: 0, fontSize: 19, bold: true, color: THEME.colors.accent1 });
s.addText('Averaging six readings would have fixed a noise problem. It did not, so the signal is simply absent: the sensors carry no trace of the first two leaks before they begin.\n\nThat is a fact about the machine and where it is instrumented, not about our method.',
  { x: 8.3, y: 3.1, w: 4.3, h: 2.2, isTextBox: true, margin: 0, fontSize: 14, color: C.text2 });
s.addShape(pres.ShapeType.roundRect, { x: 0.75, y: 5.55, w: 11.8, h: 1.1, rectRadius: 0.06,
  fill: { color: C.background2 }, line: { color: 'E2E8F0', width: 1 }, objectName: 'takeaway' });
s.addText('We also swapped the density model for a small autoencoder — 186 weights, same data, same training period, three seeds. It puts the same share of each failure above the line as the KDE. A different model does not help either, for the same reason: the information is not in the sensors.',
  { x: 1.1, y: 5.78, w: 11.1, h: 0.7, isTextBox: true, margin: 0, fontSize: 15, color: C.text2 });
s.addNotes('A negative result we kept rather than hid. It also answers the obvious question: why only one real warning out of four.');

pres.addSection({ title: 'Kelmarsh' });
s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Kelmarsh' });
s.addText('The turbines looked like a success', { placeholder: 'title' });
s.addText('Same recipe, unchanged. On paper it beat MetroPT: 122 of the 141 unplanned outages flagged, most of them hours in advance. We had predicted the opposite, so we went looking for the catch.',
  { x: 0.75, y: 1.5, w: 11.8, h: 0.6, isTextBox: true, margin: 0, fontSize: 16, color: C.text2 });
card(s, 0.75, 2.3, 5.6, 2.95, 'Three checks, and almost nothing survived', [
  'Against chance: shifting the alarms to random times still "catches" about 18',
  'Against clustering: outages arrive in bursts, so one alarm is credited with several. Only 50 of the 141 are isolated',
  'Against conditions: of the 28 isolated outages with an alarm before them, 27 were a storm or a turbine already standing still',
], 'card-checks');
card(s, 6.95, 2.3, 5.6, 2.95, 'What the detector was really seeing', [
  'It flags anything outside its training period, and six spring weeks contain no winter and no storm',
  'Storms cause trips, so reacting to storms looks exactly like predicting failures',
  'Most outages are protective trips anyway: they fire within seconds, with no run-up to detect',
], 'card-seeing');
s.addText('One outage out of 141 had an early alarm we could not explain away.',
  { x: 0.75, y: 5.55, w: 11.8, h: 0.5, isTextBox: true, margin: 0, fontSize: 16, italic: true, color: THEME.colors.accent1 });
s.addNotes('Be honest here: our hypothesis was that lead times would be near zero, and they were not. The raw numbers looked better than MetroPT. It took three separate checks to show the detector was reacting to weather rather than wear. That is the most useful thing we learned.\n\nIf asked whether it ever worked on the turbines: yes, once. Notebook 5 has the plot — turbine 1 in August, the generator bearing running hot after a fan failure, with the score climbing as the temperature leaves what the load would explain. That is the one fault of the kind the method is built for, and it found it.');

pres.addSection({ title: 'Conclusion' });
s = pres.addSlide({ masterName: 'DARK', sectionTitle: 'Conclusion' });
s.addText('When is this the right tool?', { placeholder: 'title' });
s.addText([
  { text: 'This works on faults that develop. On faults that simply happen, it only looks like it works.', options: { breakLine: true, fontSize: 19, color: 'FFFFFF' } },
  { text: 'A leak building over an afternoon leaves a trace hours ahead. A protection trip does not, and no model recovers a signal that was never recorded. The harder lesson is that the wind turbines scored 87 % recall anyway, because the detector had learned spring and was reacting to winter. Check a detection count against chance before you believe it.', options: { fontSize: 15 } },
], { placeholder: 'body' });
stat(s, 1.0, 5.55, '1 of 4', 'leaks caught with real warning', 3.5, THEME.colors.accent3, 'CBD5E0');
stat(s, 5.0, 5.55, '87 %', 'of turbine outages caught, on paper', 3.5, THEME.colors.accent3, 'CBD5E0');
stat(s, 9.0, 5.55, '1 of 141', 'left after the three checks', 3.3, THEME.colors.accent3, 'CBD5E0');
s.addNotes('Honest summary. Success at solving the problem is not a grading criterion; being able to say precisely why it did not work is.');

// ---------------------------------------------------------------- write

(async () => {
  const out = 'Presentation.pptx';
  await pres.writeFile({ fileName: out });
  console.log('wrote', out);
})();
