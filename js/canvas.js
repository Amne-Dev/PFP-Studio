// =====================
// Fabric.js PFP Canvas
// =====================

let canvas = new fabric.Canvas("pfpCanvas", { preserveObjectStacking: true });
let bgImageObj = null;
let borderRect = null;
let borderPatternImg = null;
let history = [];
let historyStep = -1;


// ---------------------
// History Management
// ---------------------
function saveState() {
  history = history.slice(0, historyStep + 1);
  history.push(JSON.stringify(canvas));
  historyStep++;
}

function undo() {
  if (historyStep <= 0) return;
  historyStep--;
  canvas.loadFromJSON(history[historyStep], () => canvas.renderAll());
}

function redo() {
  if (historyStep >= history.length - 1) return;
  historyStep++;
  canvas.loadFromJSON(history[historyStep], () => canvas.renderAll());
}

// ---------------------
// Set Background Image
// ---------------------
function setBackground(url) {
  fabric.Image.fromURL(url, (img) => {
    // Scale image to canvas size
    img.scaleToWidth(canvas.width);
    img.scaleToHeight(canvas.height);
    img.selectable = false;
    img.evented = false;

    if (bgImageObj) canvas.remove(bgImageObj);
    bgImageObj = img;
    canvas.add(bgImageObj);
    bgImageObj.sendToBack();

    drawBorder();
    saveState();    
  }, { crossOrigin: "anonymous" });
  bgImageObj.on('scaling', drawBorder);
    bgImageObj.on('moving', drawBorder);

}

function drawBorder() {
  if (!bgImageObj) return;

  const toggle = document.getElementById("borderToggle").checked;
  const width = parseInt(document.getElementById("borderWidth").value, 10);
  const color = document.getElementById("borderColor").value;
  const shape = document.getElementById("borderShape").value;
  const style = document.getElementById("borderStyle").value;

  if (borderRect) canvas.remove(borderRect);

  if (!toggle || width <= 0) { borderRect = null; canvas.renderAll(); return; }

  let stroke = color;
  let dashArray = null;

  if (style === "dotted") dashArray = [1, width * 2];
  if (style === "dashed") dashArray = [width * 3, width * 2];
  if (style === "pattern" && borderPatternImg) {
    stroke = new fabric.Pattern({ source: borderPatternImg, repeat: "repeat" });
  }

  const imgCenterX = bgImageObj.left + bgImageObj.getScaledWidth() / 2;
  const imgCenterY = bgImageObj.top + bgImageObj.getScaledHeight() / 2;

  const borderOptions = {
    fill: "transparent",
    stroke,
    strokeWidth: width,
    selectable: false,
    evented: false,
    strokeDashArray: dashArray,
  };

  if (shape === "circle") {
    const radius = Math.min(bgImageObj.getScaledWidth(), bgImageObj.getScaledHeight()) / 2;
    borderRect = new fabric.Circle({
      left: imgCenterX,
      top: imgCenterY,
      originX: "center",
      originY: "center",
      radius,
      ...borderOptions,
    });
  } else {
    borderRect = new fabric.Rect({
      left: imgCenterX,
      top: imgCenterY,
      originX: "center",
      originY: "center",
      width: bgImageObj.getScaledWidth(),
      height: bgImageObj.getScaledHeight(),
      rx: shape === "square" ? 0 : 30,
      ry: shape === "square" ? 0 : 30,
      ...borderOptions,
    });
  }

  canvas.add(borderRect);
  borderRect.moveTo(canvas.getObjects().length - 1);
  canvas.renderAll();
}



// ---------------------
// Border Pattern Upload
// ---------------------
document.getElementById("borderPatternUpload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    const img = new Image();
    img.src = evt.target.result;
    img.onload = function() {
      borderPatternImg = img;
      drawBorder(); // refresh border immediately
    };
  };
  reader.readAsDataURL(file);
});

// ---------------------
// Export & Center
// ---------------------
function exportPNG() {
  const link = document.createElement("a");
  link.download = "pfp.png";
  link.href = canvas.toDataURL({ format: "png", multiplier: 2 });
  link.click();
}

function centerSelected() {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  obj.center();
  obj.setCoords();
  canvas.renderAll();
  saveState();
}

document.addEventListener("keydown", (e) => {
  const canvas = window.PFPCanvas.canvas;
  const ctrl = e.ctrlKey || e.metaKey;

  if (e.key === "Delete") {
    const obj = canvas.getActiveObject();
    if (obj) canvas.remove(obj);
  }

  // Undo Ctrl+Z
  if (ctrl && !e.shiftKey && e.key.toLowerCase() === "z") {
    window.PFPCanvas.undo();
    e.preventDefault();
  }

  // Redo Ctrl+Shift+Z
  if (ctrl && e.shiftKey && e.key.toLowerCase() === "z") {
    window.PFPCanvas.redo();
    e.preventDefault();
  }
});

// Call this once after DOM is ready
function initializeCustomSelects() {
  // Avoid re-initializing
  if (document.body.dataset.customSelectsInitialized === "1") return;
  document.body.dataset.customSelectsInitialized = "1";

  document.querySelectorAll('select').forEach((select) => {
    // skip if already wrapped
    if (select.closest('.custom-select-wrapper')) return;

    // Create wrapper and move select inside it
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';
    // Insert wrapper before select, then append select into wrapper
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    // Hide native select but keep it in DOM for form behavior
    select.style.display = 'none';
    select.tabIndex = -1;

    // Create selected display
    const selected = document.createElement('div');
    selected.className = 'custom-select-selected';
    selected.setAttribute('role', 'button');
    selected.setAttribute('aria-haspopup', 'listbox');
    selected.setAttribute('aria-expanded', 'false');
    selected.tabIndex = 0; // make keyboard focusable
    selected.textContent = select.options[select.selectedIndex]?.text || '';

    // Create options container
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'custom-select-options';
    optionsContainer.setAttribute('role', 'listbox');

    // Build options
    Array.from(select.options).forEach((opt, idx) => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'custom-select-option';
      optionDiv.textContent = opt.text;
      optionDiv.dataset.value = opt.value;
      optionDiv.dataset.index = idx;
      optionDiv.setAttribute('role', 'option');
      if (idx === select.selectedIndex) optionDiv.classList.add('selected');

      optionDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        // update visible selected
        selected.textContent = opt.text;
        // update native select
        select.selectedIndex = idx;
        // close dropdown
        optionsContainer.style.display = 'none';
        selected.setAttribute('aria-expanded', 'false');
        // mark selected option visually
        optionsContainer.querySelectorAll('.custom-select-option').forEach(o=>o.classList.remove('selected'));
        optionDiv.classList.add('selected');
        // dispatch native change event
        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.focus();
      });

      optionsContainer.appendChild(optionDiv);
    });

    // Append elements into wrapper
    wrapper.appendChild(selected);
    wrapper.appendChild(optionsContainer);

    // Toggle dropdown on click
    selected.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = optionsContainer.style.display === 'block';
      // close any other open dropdowns
      document.querySelectorAll('.custom-select-options').forEach(c => {
        if (c !== optionsContainer) c.style.display = 'none';
      });
      optionsContainer.style.display = isOpen ? 'none' : 'block';
      selected.setAttribute('aria-expanded', (!isOpen).toString());

      // focus first selected option when opening
      if (!isOpen) {
        const sel = optionsContainer.querySelector('.custom-select-option.selected') || optionsContainer.querySelector('.custom-select-option');
        if (sel) {
          optionsContainer.querySelectorAll('.custom-select-option').forEach(o=>o.classList.remove('focused'));
          sel.classList.add('focused');
          // scroll into view if necessary
          sel.scrollIntoView({ block: 'nearest' });
        }
      }
    });

    // Keyboard navigation on the selected element
    selected.addEventListener('keydown', (e) => {
      const visible = optionsContainer.style.display === 'block';
      const options = Array.from(optionsContainer.querySelectorAll('.custom-select-option'));
      const focusedIdx = options.findIndex(o => o.classList.contains('focused'));
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!visible) {
          selected.click();
          return;
        }
        const next = options[Math.min(options.length - 1, Math.max(0, focusedIdx + 1))] || options[0];
        options.forEach(o => o.classList.remove('focused'));
        next.classList.add('focused');
        next.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!visible) {
          selected.click();
          return;
        }
        const prev = options[Math.max(0, (focusedIdx === -1 ? options.length : focusedIdx) - 1)];
        options.forEach(o => o.classList.remove('focused'));
        prev.classList.add('focused');
        prev.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!visible) {
          selected.click();
          return;
        }
        const focused = options.find(o => o.classList.contains('focused')) || options[0];
        if (focused) focused.click();
      } else if (e.key === 'Escape') {
        if (visible) {
          optionsContainer.style.display = 'none';
          selected.setAttribute('aria-expanded', 'false');
        }
      }
    });

    // Close on outside click
    document.addEventListener('click', (ev) => {
      if (!wrapper.contains(ev.target)) {
        if (optionsContainer.style.display === 'block') {
          optionsContainer.style.display = 'none';
          selected.setAttribute('aria-expanded', 'false');
        }
      }
    });

    // Keep the custom UI in sync if native select value is changed programmatically
    select.addEventListener('change', () => {
      const idx = select.selectedIndex;
      const opt = select.options[idx];
      selected.textContent = opt ? opt.text : '';
      optionsContainer.querySelectorAll('.custom-select-option').forEach(o => {
        o.classList.toggle('selected', parseInt(o.dataset.index,10) === idx);
      });
    });
  });
}

// initialize once DOM is ready
window.addEventListener('DOMContentLoaded', initializeCustomSelects);


canvas.on("object:added", saveState);
canvas.on("object:modified", saveState);
canvas.on("object:removed", saveState);

// Trigger redraw on background changes
canvas.on('object:modified', (e) => { if (e.target === bgImageObj) drawBorder(); });
canvas.on('object:scaling', (e) => { if (e.target === bgImageObj) drawBorder(); });
canvas.on('object:moving', (e) => { if (e.target === bgImageObj) drawBorder(); });

window.PFPCanvas = {
  canvas,
  bgImageObj,
  setBackground,
  drawBorder,
  exportPNG,
  centerSelected,
  undo,
  redo,
};

// Border controls
const borderControls = [
  "borderToggle",
  "borderWidth",
  "borderColor",
  "borderShape",
  "borderStyle"
];

borderControls.forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", drawBorder);
});

// Pattern upload
document.getElementById("borderPatternUpload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    const img = new Image();
    img.src = evt.target.result;
    img.onload = function() {
      borderPatternImg = img;
      drawBorder(); // redraw immediately
    };
  };
  reader.readAsDataURL(file);
});
