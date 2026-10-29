(() => {
  'use strict';
  const characters = window.DKCM_CHARACTERS || [];
  const supported = new Set(characters.map(c => c.codepoint));
  const tags = ['wght', 'wdth', 'slnt', 'size'];
  const inputs = Object.fromEntries(tags.map(t => [t, document.getElementById(t)]));
  const defaultValues = tags.map(t => Number(inputs[t].defaultValue));
  const root = document.documentElement;
  const preview = document.getElementById('preview');
  const ligatures = document.getElementById('ligatures');
  const defaultText = preview.value;
  const presets = {
    roman: [400, 100, 0], bold: [700, 100, 0], extended: [700, 115, 0],
    slanted: [400, 100, -9.462322208025617], heavy: [750, 100, 0]
  };
  const display = (n, digits = 2) => Number(n).toFixed(digits).replace(/\.?0+$/, '') || '0';

  function checkCoverage() {
    const missing = [...new Set([...preview.value].filter(c => !/[\t\r\n]/u.test(c) && !supported.has(c.codePointAt(0))))];
    document.getElementById('coverage-status').textContent = missing.length
      ? 'Not in this release: ' + missing.slice(0, 8).map(c => {
          const code = `U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
          return /\s/u.test(c) ? code : `${c} (${code})`;
        }).join(', ') + (missing.length > 8 ? ' …' : '')
      : 'Edit the text above. Axis controls also apply to the samples and character grid below.';
  }

  function update() {
    const values = tags.map(t => Number(inputs[t].value));
    const [w, d, s, z] = values;
    root.style.setProperty('--weight', w);
    root.style.setProperty('--width', d);
    root.style.setProperty('--slant', s);
    root.style.setProperty('--size', z + 'px');
    root.style.setProperty('--liga', ligatures.checked ? 1 : 0);
    for (const [t, v] of Object.entries({wght: w, wdth: d, slnt: s, size: z})) {
      document.getElementById(t + '-value').value = display(v) + (t === 'slnt' ? '°' : t === 'size' ? ' px' : '');
    }
    document.getElementById('axis-summary').textContent = `wght ${display(w)} · wdth ${display(d)} · slnt ${display(s)}`;
    for (const button of document.querySelectorAll('[data-preset]')) {
      button.setAttribute('aria-pressed', String(presets[button.dataset.preset].every((v, i) => Math.abs(v - values[i]) < .0001)));
    }
  }

  function showCharacters() {
    const filter = document.getElementById('character-filter').value;
    const selected = characters.filter(c => filter === 'all' || c.group === filter);
    const fragment = document.createDocumentFragment();
    for (const c of selected) {
      const cell = document.createElement('li');
      cell.title = c.name + (c.group === 'mark' ? ' — combining mark shown on a' : '');
      cell.setAttribute('aria-label', c.code + ' ' + c.name);
      const glyph = document.createElement('span');
      glyph.className = 'character';
      glyph.setAttribute('aria-hidden', 'true');
      glyph.textContent = (c.group === 'mark' ? 'a' : '') + c.character;
      const label = document.createElement('span');
      label.className = 'codepoint';
      label.textContent = c.code;
      cell.append(glyph, label);
      fragment.append(cell);
    }
    document.getElementById('character-grid').replaceChildren(fragment);
    document.getElementById('character-count').textContent = `${selected.length} characters`;
  }

  for (const t of tags) inputs[t].addEventListener('input', update);
  ligatures.addEventListener('change', update);
  preview.addEventListener('input', checkCoverage);
  for (const button of document.querySelectorAll('[data-preset]')) {
    button.addEventListener('click', () => {
      presets[button.dataset.preset].forEach((v, i) => { inputs[tags[i]].value = v; });
      update();
    });
  }
  document.getElementById('reset').addEventListener('click', () => {
    defaultValues.forEach((v, i) => { inputs[tags[i]].value = v; });
    ligatures.checked = true;
    preview.value = defaultText;
    update();
    checkCoverage();
  });
  document.getElementById('character-filter').addEventListener('change', showCharacters);
  update();
  showCharacters();
  checkCoverage();
  document.fonts.load(`400 ${defaultValues[3]}px DKCM`, 'Computer Modern').then(faces => {
    const status = document.getElementById('font-status');
    if (!faces.length) throw new Error('No font face loaded');
    status.textContent = `Font loaded · ${characters.length} mappings`;
    status.classList.add('loaded');
  }).catch(() => {
    document.getElementById('font-status').textContent = 'Font unavailable. Try serving this folder over HTTP.';
  });
})();
