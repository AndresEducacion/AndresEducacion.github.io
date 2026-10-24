using UnityEngine;

// Salto para un personaje 2D. Se combina con MoveController en el mismo GameObject.
// Necesita un Rigidbody2D y un Collider2D; el suelo debe tener la etiqueta "Suelo".
public class Jump2D : MonoBehaviour
{
    [SerializeField] private float fuerzaSalto = 7f;  // editable desde el Inspector
    private Rigidbody2D rb;
    private bool enSuelo;          // ¿está tocando el suelo?
    private bool quiereSaltar;     // se ha pulsado la tecla de salto

    void Start()
    {
        rb = GetComponent<Rigidbody2D>();
    }

    void Update()
    {
        // El teclado se lee en Update para no perder pulsaciones
        if (Input.GetKeyDown(KeyCode.Space) && enSuelo)
        {
            quiereSaltar = true;
        }
    }

    void FixedUpdate()
    {
        // Las físicas se aplican en FixedUpdate
        if (quiereSaltar)
        {
            rb.velocity = new Vector2(rb.velocity.x, fuerzaSalto);  // en Unity 6: rb.linearVelocity
            quiereSaltar = false;
            enSuelo = false;
        }
    }

    void OnCollisionEnter2D(Collision2D choque)
    {
        if (choque.gameObject.CompareTag("Suelo"))
        {
            enSuelo = true;        // al tocar el suelo puede volver a saltar
        }
    }
}
