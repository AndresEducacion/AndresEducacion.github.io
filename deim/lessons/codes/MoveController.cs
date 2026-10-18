using UnityEngine;

public class MoveController : MonoBehaviour
{
    private Rigidbody2D rb;  // Referencia al Rigidbody2D del objeto

    [SerializeField] private float moveSpeed = 5f;   // Velocidad de movimiento horizontal
    // Es privada, pero se puede editar desde el Inspector
    private float xInput;  // Variable para guardar el input horizontal
    // Puede valer -1, 0 o 1

    // Start se ejecuta una vez al comenzar el juego
    void Start()
    {
        rb = GetComponent<Rigidbody2D>(); // Buscamos automáticamente el Rigidbody2D
        // que está en el mismo GameObject
    }

    // Update se ejecuta una vez por frame
    void Update()
    {
        xInput = Input.GetAxisRaw("Horizontal"); // Leemos el input horizontal del jugador
        // A / D o Flechas izquierda / derecha

        rb.velocity = new Vector2(
            xInput * moveSpeed,
            rb.velocity.y
        );
        // Cambiamos la velocidad del Rigidbody
        // Se mueve en X y mantiene la velocidad en Y (de momento no hay salto)
    }

    
    // Te aseguras las veces por minuto. 
    private void FixedUpdate()
    {
        
    }
}

// El script MoveController es un componente de Unity: using UnityEngine permite usar las clases de Unity;
// public class MoveController : MonoBehaviour crea un script que se puede añadir a un GameObject;
// private Rigidbody2D rb guarda la referencia al Rigidbody2D para mover el objeto usando físicas;
// [SerializeField] private float moveSpeed = 5f define la velocidad de movimiento y permite editarla desde el Inspector;
// private float xInput almacena el valor del input horizontal; 
// en Start() (se ejecuta una sola vez al comenzar el juego) se usa GetComponent<Rigidbody2D() para obtener el Rigidbody2D del mismo objeto;
// en Update() (se ejecuta una vez por frame) se lee el teclado con Input.GetAxisRaw(Horizontal) y se asigna la velocidad con rb.velocity,
// moviendo el objeto en el eje X y manteniendo el eje Y.