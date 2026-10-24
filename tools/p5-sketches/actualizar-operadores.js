function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  let derecha = mouseX > width / 2;    // ¿el ratón está a la derecha?
  let arriba = mouseY < height / 2;    // ¿el ratón está arriba?

  if (derecha && arriba) {
    fill(0, 200, 0);                   // las dos: verde
  } else if (derecha || arriba) {
    fill(0, 0, 255);                   // solo una: azul
  } else {
    fill(255, 0, 0);                   // ninguna: rojo
  }

  if (!mouseIsPressed) {               // si NO se pulsa el ratón…
    noStroke();
  } else {
    stroke(0);
    strokeWeight(6);
  }
  circle(mouseX, mouseY, 60);

  stroke(100);
  strokeWeight(1);
  line(200, 0, 200, height);           // guías: mitad vertical
  line(0, 200, width, 200);            // y mitad horizontal
}
