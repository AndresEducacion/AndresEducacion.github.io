function setup() {
  createCanvas(400, 400);
  noStroke();
}

function draw() {
  background(20);
  for (let x = 20; x < width; x += 40) {        // columnas
    for (let y = 20; y < height; y += 40) {     // filas
      let d = dist(mouseX, mouseY, x, y);       // distancia al ratón
      fill(255, 255 - d, 120);
      circle(x, y, max(4, 34 - d / 10));
    }
  }
}
