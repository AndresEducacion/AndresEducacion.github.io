function setup() {
  createCanvas(400, 400);
  noStroke();
}

function draw() {
  background(240);
  let c = colorSegunLado(mouseX);     // la función nos devuelve un color
  dibujarFlor(mouseX, mouseY, 30, c);
  dibujarFlor(100, 100, 18, color(255, 150, 0));
  dibujarFlor(310, 300, 24, color(160, 90, 255));
}

// Dibuja una flor: recibe posición, tamaño y color
function dibujarFlor(x, y, tam, col) {
  fill(col);
  for (let i = 0; i < 6; i++) {
    let a = i * TWO_PI / 6;
    circle(x + cos(a) * tam, y + sin(a) * tam, tam);
  }
  fill(255, 220, 0);
  circle(x, y, tam);
}

// Devuelve un color según la mitad en la que esté x
function colorSegunLado(x) {
  if (x < width / 2) {
    return color(255, 80, 120);       // return devuelve el valor y sale
  }
  return color(80, 160, 255);
}
