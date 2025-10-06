function addSticker(url) {
  fabric.Image.fromURL(url, (img) => {
    img.scaleToWidth(200);
    img.left = 300;
    img.top = 300;
    window.PFPCanvas.canvas.add(img);
  });
}

function addTextSticker(text = "New Text") {
  const t = new fabric.Textbox(text, {
    left: 300,
    top: 300,
    width: 200,
    fill: "#ffffff",
    fontSize: 32,
  });
  window.PFPCanvas.canvas.add(t);
}
