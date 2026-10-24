using UnityEngine;

// Componente que mueve un objeto 2D a izquierda y derecha usando físicas.
// Necesita un Rigidbody2D en el mismo GameObject.
public class MoveController : MonoBehaviour
{
    private Rigidbody2D rb;  // Referencia al Rigidbody2D del objeto

    [SerializeField] private float moveSpeed = 5f;   // Velocidad de movimiento horizontal
    // Es privada, pero [SerializeField] permite editarla desde el Inspector
    private float xInput;  // Input horizontal: puede valer -1, 0 o 1

    // Start se ejecuta una vez al comenzar el juego
    void Start()
    {
        rb = GetComponent<Rigidbody2D>(); // Buscamos el Rigidbody2D del mismo GameObject
    }

    // Update se ejecuta una vez por fotograma: es el sitio para leer el teclado
    void Update()
    {
        xInput = Input.GetAxisRaw("Horizontal"); // A / D o flechas izquierda / derecha
    }

    // FixedUpdate se ejecuta a intervalos fijos (50 veces por segundo por defecto):
    // es el sitio para tocar las físicas, así el movimiento no depende de los fotogramas
    void FixedUpdate()
    {
        // Se mueve en X y mantiene la velocidad en Y (de momento no hay salto).
        // En Unity 6 esta propiedad se llama rb.linearVelocity; rb.velocity sigue funcionando en versiones anteriores.
        rb.velocity = new Vector2(xInput * moveSpeed, rb.velocity.y);
    }
}
