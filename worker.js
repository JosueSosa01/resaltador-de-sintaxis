// worker.js

self.onmessage = function (event) {
    const { data } = event.data;

    // Procesar el contenido (por ejemplo, puedes hacer análisis de líneas, tokens, etc.)
    console.log('Contenido recibido en el Worker:', data);

    // En este caso, simplemente retorna el contenido sin modificaciones
    const result = data;

    // Enviar el resultado al script principal
    self.postMessage({
        result: result // Modifica esta lógica según lo que necesites procesar
    });
};
