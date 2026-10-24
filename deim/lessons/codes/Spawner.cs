using UnityEngine;

// Crea copias de un prefab cada cierto tiempo en una posición aleatoria: enemigos, obstáculos, lluvia…
public class Spawner : MonoBehaviour
{
    public GameObject prefab;          // arrastra el prefab desde la ventana Project
    public float intervalo = 1.5f;     // segundos entre una copia y la siguiente
    public float anchoZona = 8f;       // ancho de la zona donde aparecen

    private float temporizador = 0f;

    void Update()
    {
        temporizador += Time.deltaTime;          // suma el tiempo que pasa

        if (temporizador >= intervalo)
        {
            temporizador = 0f;
            float x = Random.Range(-anchoZona / 2f, anchoZona / 2f);
            Vector3 posicion = transform.position + new Vector3(x, 0f, 0f);
            GameObject copia = Instantiate(prefab, posicion, Quaternion.identity);
            Destroy(copia, 10f);                  // se borra sola para no acumular objetos
        }
    }
}
