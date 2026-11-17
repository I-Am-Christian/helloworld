const durations = {15: [3, 0, 0, 9, 3], 30: [4, 6, 7, 9, 4], 50: [5, 10, 10, 15, 10]};
const skills = {hello:'Speaking', travel:'Speaking', work:'Business English', tech:'Reading', change:'Grammar', ideas:'Business English'};
const durationControl = $('#duration');
const lessonUrl = id => new URL('lessons/' + id + '.html', document.baseURI).href;
const listItems = items => items.map(item => '<li>' + escapeHTML(item) + '</li>').join('');

function lessonStages(lesson, duration) {
  const times = durations[duration];
  return [
    ['Warm-up', lesson.warm],
    ['Vocabulary', '<ul>' + listItems(lesson.words) + '</ul><p>Give a personal example for two of these words.</p>'],
    ['Reading', '<p>' + lesson.text + '</p><ol>' + listItems(lesson.questions) + '</ol>'],
    ['Speaking', '<p>' + lesson.task + '</p><p><strong>Useful language:</strong> ' + lesson.language + '</p>'],
    ['Feedback', 'Say one thing you learned. Practise one improved sentence before you finish.']
  ].map(([title, body], index) => ({title, body, time: times[index]})).filter(stage => stage.time);
}

function teachLesson(id, duration = 50) {
  const lesson = lessons.find(item => item.id === id);
  if (!lesson) return;
  open(`<span class="modal-label">${lesson.level} / ${escapeHTML(lesson.topic)}</span>
    <h2 id="modal-title">${lesson.title}</h2>
    <label class="field">Lesson length<select id="lesson-duration">${Object.keys(durations).map(n => `<option value="${n}" ${Number(n) === duration ? 'selected' : ''}>${n} minutes</option>`).join('')}</select></label>
    ${lessonStages(lesson, duration).map(stage => `<section><h3>${stage.title} · ${stage.time} min</h3><div>${stage.body}</div></section>`).join('')}
    ${duration > 15 ? `<details><summary>Reading answer key</summary><ol>${listItems(lesson.answers)}</ol></details>` : ''}
    <div class="actions"><button class="button dark" id="present-lesson">Present lesson</button>
    ${duration > 15 && 'speechSynthesis' in window ? '<button class="button" id="listen-lesson">Read passage aloud</button>' : ''}
    <button class="button" data-print>Print / Save PDF</button>
    <a class="button" href="${lessonUrl(id)}">Shareable lesson page</a>
    <button class="button" data-save="${id}">${saved.includes(id) ? 'Remove from' : 'Save to'} collection</button></div>`);
  $('#lesson-duration').onchange = event => {
    teachLesson(id, Number(event.target.value));
    $('#lesson-duration').focus();
  };
  $('#present-lesson').onclick = () => presentLesson(lesson, duration);
  const listen = $('#listen-lesson');
  if (listen) listen.onclick = () => {
    const wasSpeaking = speechSynthesis.speaking;
    speechSynthesis.cancel();
    if (wasSpeaking) return;
    const passage = new SpeechSynthesisUtterance(lesson.text);
    passage.lang = 'en-GB';
    passage.rate = lesson.level === 'A1' || lesson.level === 'A2' ? 0.85 : 0.95;
    speechSynthesis.speak(passage);
  };
}

function presentLesson(lesson, duration) {
  const stages = lessonStages(lesson, duration).filter(stage => stage.title !== 'Feedback');
  let index = 0;
  function draw() {
    const stage = stages[index];
    open(`<div class="present-stage"><span class="modal-label">${lesson.level} · ${index + 1} / ${stages.length}</span>
      <h2 id="modal-title">${stage.title}</h2><div class="present-content">${stage.body}</div>
      <div class="actions"><button class="button" id="previous-stage" ${index === 0 ? 'disabled' : ''}>Previous</button>
      <button class="button lime" id="next-stage" ${index === stages.length - 1 ? 'disabled' : ''}>Next</button>
      <button class="button" id="return-teach">Teacher view</button></div></div>`);
    $('#previous-stage').onclick = () => move(-1);
    $('#next-stage').onclick = () => move(1);
    $('#return-teach').onclick = () => teachLesson(lesson.id, duration);
  }
  function move(direction) {
    const target = index + direction;
    if (target < 0 || target >= stages.length) return;
    index = target;
    draw();
    const preferred = direction > 0 ? $('#next-stage') : $('#previous-stage');
    (preferred.disabled ? $('#return-teach') : preferred).focus();
  }
  draw();
  $('#return-teach').focus();
  $('#modal-body').onkeydown = event => {
    if (!event.target.closest('.present-stage')) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    }
  };
}

function openWorksheet() {
  open(`<h2 id="modal-title">Worksheet builder</h2>
    <p>Use a passage, video transcript, or your own vocabulary to build a printable classroom activity.</p>
    <form id="worksheet-form">
      <label class="field">Worksheet title<input name="title" maxlength="100" required></label>
      <label class="field">Activity<select name="mode">
        <option value="reading">Reading or video transcript</option><option value="vocabulary">Vocabulary matching</option>
        <option value="grammar">Grammar gap-fill</option></select></label>
      <label class="field" id="source-label"><span>Article excerpt or transcript</span><textarea name="source" maxlength="8000" required></textarea></label>
      <p class="notice" id="worksheet-hint"></p>
      <button class="button dark">Build worksheet</button>
    </form>`);
  const form = $('#worksheet-form');
  const hints = {
    reading: 'Paste the text you have permission to use. The worksheet adds reading and discussion prompts. Video links need a pasted transcript.',
    vocabulary: 'Enter at least three pairs, one per line, in the format word | definition.',
    grammar: 'Enter sentences with the missing answer inside square brackets, one per line. Example: She [works] from home.'
  };
  function describeMode() {
    const mode = form.elements.mode.value;
    $('#source-label span').textContent = {reading:'Article excerpt or transcript', vocabulary:'Words and definitions', grammar:'Sentences with bracketed answers'}[mode];
    $('#worksheet-hint').textContent = hints[mode];
    form.elements.source.setCustomValidity('');
  }
  describeMode();
  form.elements.mode.onchange = describeMode;
  form.elements.source.oninput = () => form.elements.source.setCustomValidity('');
  form.onsubmit = event => {
    event.preventDefault();
    const data = new FormData(form);
    const source = String(data.get('source')).trim();
    const mode = data.get('mode');
    const lines = source.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const showError = message => {
      form.elements.source.setCustomValidity(message);
      form.elements.source.reportValidity();
    };
    if (!source) return showError('Enter some source material.');
    let activity;
    if (mode === 'reading') {
      activity = `<div class="reading source-text">${escapeHTML(source)}</div><ol>
        <li>Summarise the main idea in one sentence.</li><li>Choose two details and explain how they support the main idea.</li>
        <li>Find three useful expressions and infer their meaning from the context.</li>
        <li>Write a follow-up question and discuss it with a partner.</li></ol>`;
    } else if (mode === 'vocabulary') {
      const pairs = lines.map(line => line.split('|').map(part => part.trim()));
      if (pairs.length < 3 || pairs.length > 20 || pairs.some(pair => pair.length !== 2 || !pair.every(Boolean))) return showError('Enter 3–20 word | definition pairs, one per line.');
      const definitions = pairs.map(pair => pair[1]);
      const shuffled = [...definitions.slice(1), definitions[0]];
      activity = `<p>Match each word to a definition. Then use two words in your own sentences.</p>
        <ol>${listItems(pairs.map(pair => pair[0]))}</ol><ol type="A">${listItems(shuffled)}</ol>
        <details class="teacher-only"><summary>Answer key</summary><ol>${listItems(pairs.map((_, index) => String.fromCharCode(65 + (index + pairs.length - 1) % pairs.length)))}</ol></details>`;
    } else {
      if (lines.length > 30 || lines.some(line => !/\[[^\[\]\s][^\[\]]*\]/.test(line))) return showError('Enter up to 30 sentences, each with at least one bracketed answer.');
      const answers = lines.map(line => Array.from(line.matchAll(/\[([^\[\]]+)\]/g), match => match[1]).join(', '));
      activity = `<p>Complete the sentences. Then explain one of your choices.</p><ol>${listItems(lines.map(line => line.replace(/\[([^\[\]]+)\]/g, '________')))}</ol>
        <details class="teacher-only"><summary>Answer key</summary><ol>${listItems(answers)}</ol></details>`;
    }
    open(`<h2 id="modal-title">${escapeHTML(String(data.get('title')).trim() || 'Practice worksheet')}</h2>${activity}
      <div class="actions"><button class="button dark" id="print-student">Print student copy</button>${mode === 'reading' ? '' : '<button class="button" data-print>Print with answers</button>'}<button class="button" id="new-worksheet">New worksheet</button></div>`);
    $('#new-worksheet').onclick = openWorksheet;
    $('#print-student').onclick = () => {
      const key = $('#modal-body .teacher-only');
      if (key) key.hidden = true;
      try { window.print(); } finally { if (key) key.hidden = false; }
    };
  };
}

$('#worksheet').onclick = openWorksheet;
durationControl.onchange = render;
$('#skill').onchange = render;
$('#quick-lesson').onclick = () => {
  durationControl.value = '15';
  render();
  $('#library').scrollIntoView();
  $('#search').focus({preventScroll:true});
};
render();
const requested = new URLSearchParams(location.search).get('lesson');
if (requested) teachLesson(requested);

const siteHeader = document.querySelector('body > header');
let previousScroll = Math.max(0, window.scrollY);

window.addEventListener('scroll', () => {
  const currentScroll = Math.max(0, window.scrollY);
  if (currentScroll <= siteHeader.offsetHeight) {
    siteHeader.classList.remove('header-hidden');
  } else if (Math.abs(currentScroll - previousScroll) >= 6) {
    siteHeader.classList.toggle('header-hidden', currentScroll > previousScroll);
  } else {
    return;
  }
  previousScroll = currentScroll;
}, {passive: true});
