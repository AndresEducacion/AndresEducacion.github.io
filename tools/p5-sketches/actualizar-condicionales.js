let x = 0;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  x = x + 2;

  if (x > width) {          // al salir por la derecha…
    x = 0;                  // …vuelve a empezar
  }

  if (x < 130) {
    fill(0, 120, 255);      // primer tercio: azul
  } else if (x < 270) {
    fill(255, 200, 0);      // segundo tercio: amarillo
  } else {
    fill(255, 60, 60);      // el resto: rojo
  }

  circle(x, 200, 50);
}
