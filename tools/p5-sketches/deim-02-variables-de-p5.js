let size = 40;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220, 30);              // fondo semitransparente: deja estela
  size = 20 + (frameCount % 60);    // crece y vuelve a empezar cada segundo
  circle(mouseX, mouseY, size);     // sigue al ratón
}
