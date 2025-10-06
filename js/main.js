document.addEventListener("DOMContentLoaded", () => {
  const C = window.PFPCanvas;
  if (!C || !C.canvas) {
    console.error("Canvas not initialized!");
    return;
  }

  const { setBackground, updateBorder, exportPNG, centerSelected, undo, redo, canvas } = C;

  // --- Background thumbnails ---
  document.querySelectorAll(".thumb").forEach(thumb => {
    thumb.addEventListener("click", () => {
      const src = thumb.dataset.src;
      if (!src) return;
      console.log("Loading default background:", src);
      setBackground(src);
    });
  });

  // --- Background upload ---
  document.getElementById("bgUpload").addEventListener("change", e => {
    const file = e.target.files[0];
    if (file) setBackground(URL.createObjectURL(file));
  });

  // --- Filters ---
  ["sat", "bright", "contrast", "invert"].forEach(id => {
    document.getElementById(id).addEventListener("input", applyFilters);
  });

  // --- Border controls ---
  ["borderToggle", "borderWidth", "borderColor"].forEach(id => {
    document.getElementById(id).addEventListener("input", updateBorder);
  });

  // --- Stickers ---
  document.getElementById("stickerUpload").addEventListener("change", e => {
    const f = e.target.files[0];
    if (f) addSticker(URL.createObjectURL(f));
  });
  document.getElementById("addText").addEventListener("click", () => addTextSticker());

  // --- Actions ---
  document.getElementById("exportBtn").addEventListener("click", exportPNG);
  document.getElementById("centerBtn").addEventListener("click", centerSelected);
  document.getElementById("undoBtn").addEventListener("click", undo);
  document.getElementById("redoBtn").addEventListener("click", redo);

  document.getElementById("bringForward").addEventListener("click", () => {
    const o = canvas.getActiveObject();
    if (o) canvas.bringForward(o);
  });
  document.getElementById("sendBackward").addEventListener("click", () => {
    const o = canvas.getActiveObject();
    if (o) canvas.sendBackwards(o);
  });
  document.getElementById("deleteObj").addEventListener("click", () => {
    const o = canvas.getActiveObject();
    if (o) canvas.remove(o);
  });

  // --- Set default background ---
  setBackground("assets/linkedin.png");
});

// --- Undo / Redo Stack ---
let undoStack = [];
let redoStack = [];
let isModifying = false;

function saveState() {
  if (isModifying) return;
  redoStack = [];
  undoStack.push(CanvasModule.canvas.toJSON());
}

function undo() {
  if (undoStack.length < 2) return;
  const current = undoStack.pop();
  redoStack.push(current);
  const prev = undoStack[undoStack.length - 1];
  isModifying = true;
  CanvasModule.canvas.loadFromJSON(prev, () => {
    CanvasModule.canvas.renderAll();
    isModifying = false;
  });
}

function redo() {
  if (redoStack.length === 0) return;
  const next = redoStack.pop();
  undoStack.push(next);
  isModifying = true;
  CanvasModule.canvas.loadFromJSON(next, () => {
    CanvasModule.canvas.renderAll();
    isModifying = false;
  });
}

const textControls = document.getElementById("textControls");
const textFont = document.getElementById("textFont");
const textSize = document.getElementById("textSize");
const textWeight = document.getElementById("textWeight");
const textColor = document.getElementById("textColor");

canvas.on("selection:created", updateTextControls);
canvas.on("selection:updated", updateTextControls);
canvas.on("selection:cleared", () => { textControls.style.display = "none"; });

function updateTextControls() {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== "textbox") {
    textControls.style.display = "none";
    return;
  }

  textControls.style.display = "flex";

  // Set current values
  textFont.value = obj.fontFamily || "Arial";
  textSize.value = obj.fontSize || 32;
  textWeight.value = obj.fontWeight || "normal";
  textColor.value = obj.fill || "#ffffff";
}

// ----------------------
// Event listeners for text customization
// ----------------------
[textFont, textSize, textWeight, textColor].forEach(el => {
  el.addEventListener("input", () => {
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== "textbox") return;
    obj.set({
      fontFamily: textFont.value,
      fontSize: parseInt(textSize.value, 10),
      fontWeight: textWeight.value,
      fill: textColor.value,
    });
    canvas.requestRenderAll();
    saveState();
  });
});


CanvasModule.canvas.on('object:added', saveState);
CanvasModule.canvas.on('object:modified', saveState);
CanvasModule.canvas.on('object:removed', saveState);
saveState(); // initial

// --- Keyboard Shortcuts ---
document.addEventListener('keydown', (e) => {
  if (e.key === 'Delete') {
    e.preventDefault();
    CanvasModule.deleteSelected();
  }

  if (e.ctrlKey && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) redo(); else undo();
  }

  if (e.ctrlKey && e.key.toLowerCase() === 'y') {
    e.preventDefault();
    redo();
  }
});
