using UnityEngine;
using System.Collections.Generic;

public class BasicVariables : MonoBehaviour
{
    // Variables básicas
    // Tipos simples para guardar números, texto y estados
    public int lives = 3;
    public float speed = 5f;
    public bool isAlive = true;
    public string playerName = "Jugador";

    // Vectores
    // Posiciones y direcciones en 2D y 3D
    public Vector2 direction2D = new Vector2(1, 0);
    public Vector3 direction3D = new Vector3(0, 0, 1);

    // Color
    // Guardar un color para usar en materiales o sprites
    public Color playerColor = Color.blue;

    // Referencias
    // Enlaces a objetos y componentes de la escena
    public GameObject playerObject;
    public Transform playerTransform;
    public Rigidbody playerRigidbody;

    // Enumerados
    // Estados posibles del jugador
    public enum PlayerState
    {
        Idle,
        Walking,
        Jumping
    }

    public PlayerState currentState = PlayerState.Idle;

    // Arrays
    // Conjunto fijo de valores
    public int[] scores = { 10, 20, 30 };

    // Listas
    // Conjunto de elementos que puede crecer o reducirse
    public List<string> inventory = new List<string>()
    {
        "Llave",
        "Poción",
        "Mapa"
    };

    // Variables privadas visibles
    // No accesibles desde otros scripts
    [SerializeField] private float jumpForce = 7f;

    void Start()
    {
        Debug.Log("Nombre: " + playerName);
        Debug.Log("Vidas: " + lives);
        Debug.Log("Estado: " + currentState);

        // Uso de Vector3
        transform.position += direction3D;

        // Uso de listas
        Debug.Log("Primer objeto del inventario: " + inventory[0]);
    }

    void Update()
    {
        if (isAlive)
        {
            transform.Translate(Vector3.forward * speed * Time.deltaTime);
        }
    }
}
