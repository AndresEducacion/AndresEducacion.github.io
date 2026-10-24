using UnityEngine;

// Hace girar el objeto sobre sí mismo. Útil para monedas, ventiladores o decoración.
public class Rotator : MonoBehaviour
{
    public Vector3 gradosPorSegundo = new Vector3(0f, 90f, 0f);  // velocidad de giro en cada eje

    void Update()
    {
        // Multiplicar por Time.deltaTime hace que gire igual de rápido en cualquier ordenador
        transform.Rotate(gradosPorSegundo * Time.deltaTime);
    }
}
