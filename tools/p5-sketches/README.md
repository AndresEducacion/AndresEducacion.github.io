# Sketches de p5.js para la lección 01 de DEIM

La lección incrusta el editor de p5.js con los sketches de la cuenta **AndresEducacion**.
Los ejemplos que todavía no tienen sketch se muestran con la vista previa propia de la web
hasta que existan. Cuando hayas hecho estos pasos, avísame: busco los sketches por su nombre
y los enlazo en la lección.

## 1. Crear 7 sketches nuevos

En editor.p5js.org, con tu sesión iniciada: **File → New**, pega el código del archivo,
cambia el nombre (clic en el nombre, arriba a la izquierda) y guarda con **Ctrl+S**.
El nombre tiene que ser exactamente el de la tabla.

| Nombre del sketch | Archivo |
|---|---|
| DEIM 01 · Coordenadas | `deim-01-coordenadas.js` |
| DEIM 02 · Variables de p5 | `deim-02-variables-de-p5.js` |
| DEIM 03 · Operadores | `deim-03-operadores.js` |
| DEIM 06 · While | `deim-06-while.js` |
| DEIM 06 · Bucles anidados | `deim-06-bucles-anidados.js` |
| DEIM 07 · Funciones | `deim-07-funciones.js` |
| DEIM 08 · Eventos y arrays | `deim-08-eventos-y-arrays.js` |

## 2. Sustituir el código de 2 sketches que ya tienes

Abre el sketch, borra su código, pega el del archivo y guarda.

| Sketch | Archivo | Qué cambia |
|---|---|---|
| Condicionales | `actualizar-condicionales.js` | El círculo vuelve a empezar al salir y usa `else if` con tres colores. |
| Operadores | `actualizar-operadores.js` | La rama gris nunca se ejecutaba; ahora el `!` se ve con `mouseIsPressed`. |

## 3. Añadir una línea a otros 2

- **EjemploPráctica**, en la función `randomColorCloseTo`, debajo de `r = constrain(r, 0, 255);`:

  ```js
  g = constrain(g, 0, 255);
  ```

- **Ejercicio ChatGPT3**, dentro del `if` del rebote, debajo de `speeds[i] = -speeds[i];`:

  ```js
  xs[i] = constrain(xs[i], 15, width - 15);   // que no se quede atrapada en el borde
  ```

Los sketches **Variables** y **Bucles For** no necesitan cambios.
