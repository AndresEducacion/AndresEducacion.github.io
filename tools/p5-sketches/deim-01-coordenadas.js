function setup() {
  createCanvas(400, 400);   // ancho y alto en píxeles
}

function draw() {
  background(30);
  fill(255);
  noStroke();

  circle(0, 0, 60);         // el origen (0, 0): arriba a la izquierda
  rect(200, 100, 120, 60);  // rect(x, y, ancho, alto)
  circle(100, 300, 80);     // circle(x, y, diámetro)

  fill(42, 255, 107);
  text('x: ' + mouseX + '   y: ' + mouseY, 12, 388);
}
