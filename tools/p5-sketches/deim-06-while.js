function setup() {
  createCanvas(400, 400);
  noLoop();                  // draw() se ejecuta una sola vez
}

function draw() {
  background(20);
  noFill();
  stroke(42, 255, 107);
  let d = 380;
  while (d > 0) {            // mientras el diámetro sea mayor que 0…
    circle(200, 200, d);
    d -= 30;                 // …lo reducimos
  }
}
