using UnityEngine;

// Objeto que se recoge al tocarlo: monedas, gemas, vidas…
// Necesita un Collider2D marcado como "Is Trigger". El jugador debe tener la etiqueta "Player".
public class Collectible2D : MonoBehaviour
{
    public int valor = 1;                 // puntos que da
    public static int puntuacion = 0;     // static: un único marcador compartido por todas las monedas

    void OnTriggerEnter2D(Collider2D otro)
    {
        if (otro.CompareTag("Player"))
        {
            puntuacion += valor;
            Debug.Log("Puntuación: " + puntuacion);
            Destroy(gameObject);          // el objeto desaparece al recogerlo
        }
    }
}
