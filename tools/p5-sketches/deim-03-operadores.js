let x = 0;
let speed = 3;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  x += speed;                 // igual que x = x + speed
  let pos = x % width;        // el resto: al llegar a 400 vuelve a 0
  let r = 20 + pos * 0.2;     // el tamaño depende de la posición
  circle(pos, height / 2, r);
}
