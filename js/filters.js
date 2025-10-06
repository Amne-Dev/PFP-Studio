function applyFilters() {
  const img = window.PFPCanvas.canvas.getObjects().find(o => !o.selectable);
  if (!img) return;

  const sat = parseFloat(document.getElementById("sat").value);
  const bright = parseFloat(document.getElementById("bright").value);
  const contrast = parseFloat(document.getElementById("contrast").value);
  const invert = document.getElementById("invert").checked;

  img.filters = [];
  if (sat !== 0) img.filters.push(new fabric.Image.filters.Saturation({ saturation: 1 + sat }));
  if (bright !== 0) img.filters.push(new fabric.Image.filters.Brightness({ brightness: bright }));
  if (contrast !== 0) img.filters.push(new fabric.Image.filters.Contrast({ contrast }));
  if (invert) img.filters.push(new fabric.Image.filters.Invert());

  img.applyFilters();
  window.PFPCanvas.canvas.renderAll();
}
