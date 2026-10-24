using UnityEngine;

// La cámara sigue al jugador con suavidad. Va en la cámara, no en el jugador.
public class CameraFollow : MonoBehaviour
{
    public Transform objetivo;                          // arrastra aquí al jugador
    public Vector3 desplazamiento = new Vector3(0f, 1f, -10f);  // distancia respecto al objetivo
    public float suavizado = 0.15f;                     // tiempo aproximado para alcanzarlo

    private Vector3 velocidad = Vector3.zero;           // la usa SmoothDamp internamente

    // LateUpdate se ejecuta después de todos los Update: el jugador ya se ha movido
    void LateUpdate()
    {
        if (objetivo == null) return;

        Vector3 destino = objetivo.position + desplazamiento;
        transform.position = Vector3.SmoothDamp(transform.position, destino, ref velocidad, suavizado);
    }
}
