let pelotas = [];                       // array vacío

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(20);
  fill(255);
  text('Clic: añadir · C: borrar · ' + pelotas.length + ' pelotas', 10, 20);
  fill(42, 255, 107);
  for (let p of pelotas) {              // recorre el array
    p.v += 0.4;                         // gravedad
    p.y += p.v;                         // cae
    if (p.y > height - 10) {            // rebota en el suelo
      p.y = height - 10;
      p.v *= -0.8;
    }
    circle(p.x, p.y, 20);
  }
}

function mousePressed() {               // se ejecuta en cada clic
  pelotas.push({ x: mouseX, y: mouseY, v: 0 });
}

function keyPressed() {                 // se ejecuta al pulsar una tecla
  if (key === 'c' || key === 'C') {
    pelotas = [];
  }
}
