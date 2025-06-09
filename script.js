const canvas = document.getElementById('canvas');
const editPanel = document.getElementById('edit-panel');
let selectedElements = new Set();
let isCtrlPressed = false;

// Alignment guide lines
const alignLineX = document.createElement('div');
const alignLineY = document.createElement('div');
Object.assign(alignLineX.style, {
  position: 'absolute',
  height: '1px',
  width: '100%',
  backgroundColor: 'red',
  zIndex: 1000,
  display: 'none',
});
Object.assign(alignLineY.style, {
  position: 'absolute',
  width: '1px',
  height: '100%',
  backgroundColor: 'red',
  zIndex: 1000,
  display: 'none',
});
canvas.appendChild(alignLineX);
canvas.appendChild(alignLineY);

document.addEventListener('keydown', e => {
  if (e.key === 'Control') isCtrlPressed = true;
  if (e.key === 'Delete') deleteSelected();
});
document.addEventListener('keyup', e => {
  if (e.key === 'Control') isCtrlPressed = false;
});

document.querySelectorAll('.draggable').forEach(el => {
  el.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', el.dataset.type);
    e.dataTransfer.setData('text/subtype', el.dataset.subtype || '');
    e.dataTransfer.effectAllowed = 'copy';
  });
});

canvas.addEventListener('dragover', e => e.preventDefault());

canvas.addEventListener('drop', e => {
  e.preventDefault();
  const type = e.dataTransfer.getData('text/plain');
  const subtype = e.dataTransfer.getData('text/subtype') || '';
  if (!type) return;
  const x = e.offsetX;
  const y = e.offsetY;
  const el = createElement(type, subtype, x, y);
  canvas.appendChild(el);
  handleSelection(el, e);
});

function createElement(type, subtype, x, y) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('element', 'resizable');
  wrapper.style.position = 'absolute';
  wrapper.style.left = `${x}px`;
  wrapper.style.top = `${y}px`;
  wrapper.style.width = '200px';
  wrapper.style.height = 'auto';

  let el = document.createElement('div');
  el.style.width = '100%';
  el.style.height = '100%';
  el.style.boxSizing = 'border-box';

  if (type === 'text') {
    el.contentEditable = true;
    el.dataset.subtype = subtype || 'paragraph';
    el.textContent = subtype.replace('heading', 'Heading ') || 'Paragraph';
    switch (subtype) {
      case 'heading1': el.style.fontSize = '32px'; break;
      case 'heading2': el.style.fontSize = '24px'; break;
      case 'heading3': el.style.fontSize = '18px'; break;
      default: el.style.fontSize = '16px';
    }
  } else if (type === 'button') {
    el = document.createElement('button');
    el.textContent = subtype || 'Primary';
    el.style.background = '#007bff';
    el.style.color = '#fff';
    el.style.padding = '10px';
    el.style.border = 'none';
    el.style.borderRadius = '4px';
    el.style.cursor = 'pointer';
    el.style.width = 'auto';
    el.style.height = 'auto';
    el.onclick = () => window.open('https://example.com', '_blank');
  } else if (type === 'image') {
    el.textContent = '+';
    el.style.width = '100px';
    el.style.height = '100px';
    el.style.background = '#ccc';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.click();
      input.addEventListener('change', () => {
        const file = input.files[0];
        if (file) {
          const img = document.createElement('img');
          img.src = URL.createObjectURL(file);
          img.style.width = '100%';
          img.style.height = '100%';
          el.innerHTML = '';
          el.appendChild(img);
        }
      });
    });
  } else if (type === 'layout') {
    el.classList.add('layout-box');
    const inner = document.createElement('div');
    inner.style.minHeight = '60px';
    inner.style.gap = '5px';

    if (subtype === 'grid') {
      inner.style.display = 'grid';
      inner.style.gridTemplateColumns = 'repeat(3, 1fr)';
      for (let i = 0; i < 3; i++) {
        const cell = document.createElement('div');
        cell.contentEditable = true;
        cell.textContent = `Grid ${i + 1}`;
        cell.style.background = 'transparent';
        cell.style.border = '1px dashed #999';
        cell.style.minHeight = '40px';
        inner.appendChild(cell);
      }
    } else if (subtype === 'row') {
      inner.style.display = 'flex';
      for (let i = 0; i < 2; i++) {
        const box = document.createElement('div');
        box.contentEditable = true;
        box.textContent = `Row ${i + 1}`;
        box.style.background = 'transparent';
        box.style.border = '1px dashed #999';
        box.style.flex = '1';
        box.style.minHeight = '40px';
        inner.appendChild(box);
      }
    } else if (subtype === 'column') {
      inner.style.display = 'flex';
      inner.style.flexDirection = 'column';
      for (let i = 0; i < 2; i++) {
        const col = document.createElement('div');
        col.contentEditable = true;
        col.textContent = `Column ${i + 1}`;
        col.style.background = 'transparent';
        col.style.border = '1px dashed #999';
        col.style.minHeight = '40px';
        col.style.marginBottom = '5px';
        inner.appendChild(col);
      }
    }

    el.appendChild(inner);
  }

  wrapper.appendChild(el);
  addResizeHandles(wrapper);
  makeDraggable(wrapper);
  wrapper.addEventListener('click', (e) => handleSelection(wrapper, e));
  return wrapper;
}
function handleSelection(el, e) {
  e.stopPropagation();
  if (!isCtrlPressed) {
    selectedElements.forEach(el => el.classList.remove('selected', 'group-selected'));
    selectedElements.clear();
  }
  selectedElements.add(el);
  el.classList.add(isCtrlPressed ? 'group-selected' : 'selected');
  showEditPanel();
}

canvas.addEventListener('click', () => {
  selectedElements.forEach(el => el.classList.remove('selected', 'group-selected'));
  selectedElements.clear();
  showEditPanel();
});

function showEditPanel() {
  if (selectedElements.size === 0) {
    editPanel.innerHTML = `<p>Select an element</p>`;
    return;
  }

  const selected = [...selectedElements][0];
  const tag = selected.firstChild.tagName.toLowerCase();
  const inner = selected.firstChild;

  let html = `<label><input type="checkbox" id="toggle-advanced" /> Show Advanced Options</label>`;

  if (tag === 'img') {
    html += `
      <label>Replace Image:
        <input type="file" accept="image/*" onchange="replaceImage(event)" />
      </label>
      <label><input type="checkbox" id="lock-aspect" /> Lock Aspect Ratio</label>
      <div class="advanced" style="display:none;">
        <label>Grayscale:
          <input type="range" min="0" max="1" step="0.1" onchange="applyFilter('grayscale', this.value)" />
        </label>
        <label>Brightness:
          <input type="range" min="0.5" max="1.5" step="0.1" onchange="applyFilter('brightness', this.value)" />
        </label>
        <label>Contrast:
          <input type="range" min="0.5" max="1.5" step="0.1" onchange="applyFilter('contrast', this.value)" />
        </label>
      </div>
    `;
  } else if (tag === 'button') {
    html += `
      <label>Button Text:
        <input type="text" value="${inner.textContent}" oninput="updateText(this.value)" />
      </label>
      <label>Background Color:
        <input type="color" onchange="updateStyleAll('backgroundColor', this.value)" />
      </label>
      <label>Text Color:
        <input type="color" onchange="updateStyleAll('color', this.value)" />
      </label>
      <div class="advanced" style="display:none;">
        <label>Border Radius:
          <input type="number" value="4" onchange="updateStyleAll('borderRadius', this.value + 'px')" />
        </label>
        <label>Link:
          <input type="url" placeholder="https://example.com" onchange="updateLink(this.value)" />
        </label>
        <label>Width:
          <input type="number" value="${inner.offsetWidth}" onchange="updateStyleAll('width', this.value + 'px')" />
        </label>
        <label>Height:
          <input type="number" value="${inner.offsetHeight}" onchange="updateStyleAll('height', this.value + 'px')" />
        </label>
      </div>
    `;
  } else if (tag === 'div' && !inner.classList.contains('layout-box')) {
    const subtype = inner.dataset.subtype || 'paragraph';
    html += `
      <label>Text Type:
        <select onchange="changeTextType(this.value)">
          <option value="heading1" ${subtype === 'heading1' ? 'selected' : ''}>Heading 1</option>
          <option value="heading2" ${subtype === 'heading2' ? 'selected' : ''}>Heading 2</option>
          <option value="heading3" ${subtype === 'heading3' ? 'selected' : ''}>Heading 3</option>
          <option value="paragraph" ${subtype === 'paragraph' ? 'selected' : ''}>Paragraph</option>
        </select>
      </label>
      <label>Text Content:
        <input type="text" value="${inner.textContent}" oninput="updateText(this.value)" />
      </label>
      <label>Font Family:
        <select onchange="updateStyleAll('fontFamily', this.value)">
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Courier New">Courier New</option>
          <option value="Verdana">Verdana</option>
        </select>
      </label>
      <label>Font Size:
        <input type="number" value="16" onchange="updateStyleAll('fontSize', this.value + 'px')" />
      </label>
      <label>Color:
        <input type="color" onchange="updateStyleAll('color', this.value)" />
      </label>
      <div class="advanced" style="display:none;">
        <label>Alignment:
          <select onchange="updateStyleAll('textAlign', this.value)">
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="justify">Justify</option>
          </select>
        </label>
      </div>
    `;
  }

  if (inner.classList.contains('layout-box')) {
    html += `
      <div class="advanced" style="display:none;">
        <label>Edit Layout Block Texts:
          <div id="layout-text-fields"></div>
        </label>
        <label>Resize Grid:
          <input type="number" min="1" max="12" value="3" onchange="resizeGrid(this.value)" />
        </label>
        <label>Resize Row:
          <input type="number" min="1" max="12" value="2" onchange="resizeRow(this.value)" />
        </label>
        <label>Resize Column:
          <input type="number" min="1" max="12" value="2" onchange="resizeColumn(this.value)" />
        </label>
      </div>
    `;
  }

  html += `<button onclick="deleteSelected()">Delete</button>`;
  editPanel.innerHTML = html;

  document.getElementById('toggle-advanced').onchange = function () {
    const adv = editPanel.querySelectorAll('.advanced');
    adv.forEach(sec => sec.style.display = this.checked ? 'block' : 'none');
  };

  if (inner.classList.contains('layout-box')) {
    const container = inner.querySelector('div');
    const fieldContainer = document.getElementById('layout-text-fields');
    fieldContainer.innerHTML = '';

    [...container.children].forEach((child, index) => {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = child.textContent;
      input.placeholder = `Block ${index + 1}`;
      input.oninput = () => child.textContent = input.value;
      fieldContainer.appendChild(input);
    });
  }
}

window.updateStyleAll = (prop, value) => {
  selectedElements.forEach(el => {
    const inner = el.firstChild;
    inner.style[prop] = value;
  });
};

window.updateText = function (val) {
  selectedElements.forEach(el => {
    if (el.firstChild) el.firstChild.textContent = val;
  });
};

window.changeTextType = function(type) {
  const styles = {
    heading1: { fontSize: '32px', fontWeight: 'bold', fontFamily: 'Georgia' },
    heading2: { fontSize: '24px', fontWeight: '600', fontFamily: 'Arial' },
    heading3: { fontSize: '18px', fontWeight: '500', fontFamily: 'Verdana' },
    paragraph: { fontSize: '16px', fontWeight: '400', fontFamily: 'sans-serif' }
  };
  selectedElements.forEach(wrapper => {
    const el = wrapper.firstChild;
    el.dataset.subtype = type;
    el.textContent = type.replace('heading', 'Heading ') || 'Paragraph';
    Object.assign(el.style, styles[type] || styles.paragraph);
  });
};
function deleteSelected() {
  selectedElements.forEach(el => el.remove());
  selectedElements.clear();
  showEditPanel();
}

function replaceImage(e) {
  const file = e.target.files[0];
  if (file && selectedElements.size === 1) {
    const img = [...selectedElements][0].querySelector('img');
    img.src = URL.createObjectURL(file);
  }
}

function applyFilter(type, value) {
  selectedElements.forEach(el => {
    const img = el.querySelector('img');
    const existing = img?.style.filter || '';
    const updated = existing
      .split(' ')
      .filter(f => !f.startsWith(type))
      .concat(`${type}(${value})`)
      .join(' ');
    if (img) img.style.filter = updated;
  });
}

function updateLink(url) {
  selectedElements.forEach(el => {
    if (el.firstChild.tagName.toLowerCase() === 'button') {
      el.firstChild.onclick = () => window.open(url, '_blank');
    }
  });
}

function addResizeHandles(el) {
  const positions = ['tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l'];
  positions.forEach(pos => {
    const handle = document.createElement('div');
    handle.className = `resize-handle ${pos}`;
    el.appendChild(handle);
    handle.addEventListener('mousedown', initResize.bind(null, el, pos));
  });
}

function initResize(targetEl, direction, e) {
  e.preventDefault();
  const starts = [...selectedElements].map(el => ({
    el,
    x: parseFloat(el.style.left),
    y: parseFloat(el.style.top),
    w: el.offsetWidth,
    h: el.offsetHeight
  }));

  const startX = e.clientX;
  const startY = e.clientY;

  function doDrag(e) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    starts.forEach(({ el, x, y, w, h }) => {
      if (direction.includes('t')) {
        el.style.height = Math.max(10, h - dy) + 'px';
        el.style.top = y + dy + 'px';
      }
      if (direction.includes('b')) {
        el.style.height = Math.max(10, h + dy) + 'px';
      }
      if (direction.includes('l')) {
        el.style.width = Math.max(10, w - dx) + 'px';
        el.style.left = x + dx + 'px';
      }
      if (direction.includes('r')) {
        el.style.width = Math.max(10, w + dx) + 'px';
      }
    });
  }

  function stopDrag() {
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('mouseup', stopDrag);
  }

  document.addEventListener('mousemove', doDrag);
  document.addEventListener('mouseup', stopDrag);
}

function makeDraggable(el) {
  let startX, startY;

  el.addEventListener('mousedown', function(e) {
    if (e.target.classList.contains('resize-handle')) return;

    e.preventDefault();
    if (!selectedElements.has(el)) handleSelection(el, e);

    startX = e.clientX;
    startY = e.clientY;

    const starts = [...selectedElements].map(el => ({
      el,
      x: parseFloat(el.style.left),
      y: parseFloat(el.style.top),
    }));

    function onMove(e) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      alignLineX.style.display = 'none';
      alignLineY.style.display = 'none';

      starts.forEach(({ el, x, y }) => {
        const canvasRect = canvas.getBoundingClientRect();
        const elemWidth = el.offsetWidth;
        const elemHeight = el.offsetHeight;

        let newX = x + dx;
        let newY = y + dy;

        const centerX = newX + elemWidth / 2;
        const centerY = newY + elemHeight / 2;

        // Check alignment with other elements
        for (const other of canvas.querySelectorAll('.element')) {
          if (other === el) continue;

          const ox = parseFloat(other.style.left);
          const oy = parseFloat(other.style.top);
          const ow = other.offsetWidth;
          const oh = other.offsetHeight;
          const ocx = ox + ow / 2;
          const ocy = oy + oh / 2;

          if (Math.abs(centerX - ocx) < 5) {
            alignLineY.style.left = ocx + 'px';
            alignLineY.style.display = 'block';
            newX = ocx - elemWidth / 2;
          }
          if (Math.abs(centerY - ocy) < 5) {
            alignLineX.style.top = ocy + 'px';
            alignLineX.style.display = 'block';
            newY = ocy - elemHeight / 2;
          }
        }

        // Snap to canvas center
        const canvasCenterX = canvas.clientWidth / 2;
        const canvasCenterY = canvas.clientHeight / 2;

        if (Math.abs(centerX - canvasCenterX) < 5) {
          alignLineY.style.left = canvasCenterX + 'px';
          alignLineY.style.display = 'block';
          newX = canvasCenterX - elemWidth / 2;
        }

        if (Math.abs(centerY - canvasCenterY) < 5) {
          alignLineX.style.top = canvasCenterY + 'px';
          alignLineX.style.display = 'block';
          newY = canvasCenterY - elemHeight / 2;
        }

        newX = Math.max(0, Math.min(newX, canvas.clientWidth - elemWidth));
        newY = Math.max(0, Math.min(newY, canvas.clientHeight - elemHeight));

        el.style.left = `${newX}px`;
        el.style.top = `${newY}px`;
      });
    }

    function onUp() {
      alignLineX.style.display = 'none';
      alignLineY.style.display = 'none';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

// Resize logic
window.resizeGrid = function(count) {
  selectedElements.forEach(wrapper => {
    const grid = wrapper.querySelector('.layout-box > div');
    if (!grid) return;
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${count}, 1fr)`;
    for (let i = 0; i < count; i++) {
      const cell = document.createElement('div');
      cell.contentEditable = true;
      cell.textContent = `Grid ${i + 1}`;
      cell.style.background = 'transparent';
      cell.style.border = '1px dashed #999';
      cell.style.minHeight = '40px';
      grid.appendChild(cell);
    }
  });
};

window.resizeRow = function(count) {
  selectedElements.forEach(wrapper => {
    const row = wrapper.querySelector('.layout-box > div');
    if (!row) return;
    row.innerHTML = '';
    row.style.display = 'flex';
    for (let i = 0; i < count; i++) {
      const box = document.createElement('div');
      box.contentEditable = true;
      box.textContent = `Row ${i + 1}`;
      box.style.background = 'transparent';
      box.style.border = '1px dashed #999';
      box.style.flex = '1';
      box.style.minHeight = '40px';
      row.appendChild(box);
    }
  });
};

window.resizeColumn = function(count) {
  selectedElements.forEach(wrapper => {
    const col = wrapper.querySelector('.layout-box > div');
    if (!col) return;
    col.innerHTML = '';
    col.style.display = 'flex';
    col.style.flexDirection = 'column';
    for (let i = 0; i < count; i++) {
      const box = document.createElement('div');
      box.contentEditable = true;
      box.textContent = `Column ${i + 1}`;
      box.style.background = 'transparent';
      box.style.border = '1px dashed #999';
      box.style.minHeight = '40px';
      box.style.marginBottom = '5px';
      col.appendChild(box);
    }
  });
};

// Export logic
document.getElementById('export-html').addEventListener('click', () => {
  const clone = canvas.cloneNode(true);
  clone.querySelectorAll('[contenteditable]').forEach(node => {
    node.removeAttribute('contenteditable');
  });

  const htmlContent = clone.innerHTML;
  const styleContent = [...document.styleSheets].map(sheet => {
    try {
      return [...sheet.cssRules].map(rule => rule.cssText).join('');
    } catch {
      return '';
    }
  }).join('');

  const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Exported Page</title>
  <style>${styleContent}</style>
</head>
<body>
  <div style="position:relative;">
    ${htmlContent}
  </div>
</body>
</html>
`;

  const blob = new Blob([fullHTML], { type: 'text/html' });
  const link = document.createElement('a');
  link.download = 'export.html';
  link.href = URL.createObjectURL(blob);
  link.click();
});

// Sidebar toggle
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.group-toggle').forEach(button => {
    const content = button.nextElementSibling;
    content.classList.remove('open');
    button.textContent = button.textContent.replace(/▾|▸/, '▸');

    button.addEventListener('click', () => {
      const isOpen = content.classList.toggle('open');
      button.textContent = isOpen
        ? button.textContent.replace(/▸/, '▾')
        : button.textContent.replace(/▾/, '▸');
    });
  });
});
