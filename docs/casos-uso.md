# Casos de Uso Detallados

## UC-01: Importar Canción

**Actor**: Usuario  
**Flujo**:

1. Usuario arrastra archivo.mp3 a zona drop
2. Sistema valida extensión (.mp3, .wav, .mp4)
3. Sistema busca archivo .lrc con mismo nombre
4. Si existe → mostrar en listado como disponible
5. Si no existe → mostrar warning "Falta archivo LRC"

**Extensiones válidas**: .mp3, .wav, .mp4

---

## UC-02: Iniciar Quiz

**Actor**: Usuario  
**Mecanismo de Resaltado**: El sistema detecta el verso actual que canta el artista mediante **análisis de ondas de sonido** (FFT - Fast Fourier Transform para extraer frecuencias, detección de energía en rangos vocálicos 300Hz-3kHz, y correlación con timestamps del archivo .lrc). Este análisis ocurre en tiempo real en el cliente para zero-latencia.
**Flujo**:

1. Usuario selecciona canción del listado
2. Usuario elige dificultad (Fácil/Medio/Difícil)
3. Sistema carga lyrics parseados desde .lrc
4. Sistema carga lyrics parseados desde .lrc
5. Sistema inicia reproducción y muestra verso actual con resaltado tipo karaoke en tiempo real
6. Sistema detecta fin del verso actual (mediante análisis FFT y correlación con timestamps .lrc)
7. Si el verso termina y quedan blanks sin completar → replay automático del verso actual
8. Si el verso termina con todos los blanks completados → transición natural al siguiente verso
9. Sistema muestra el verso con palabras ocultas (blanks) según dificultad

---

## UC-03: Responder Verso

**Actor**: Usuario  
**Mecanismo de Resaltado**: El sistema detecta el verso actual que canta el artista mediante **análisis de ondas de sonido** (FFT - Fast Fourier Transform para extraer frecuencias, detección de energía en rangos vocálicos 300Hz-3kHz, y correlación con timestamps del archivo .lrc). Este análisis ocurre en tiempo real en el cliente para zero-latencia.
**Flujo**:

1. Sistema muestra 4 opciones de palabras individuales (multiple choice)
2. Usuario selecciona la palabra faltante para completar un blank del verso
3. **Si una palabra es correcta**:
    - Animación de éxito
    - Score +1 por palabra correcta
    - Si aún quedan blanks pendientes en el verso actual → Sistema genera 4 opciones nuevas (1 correcta + 3 distractores) para el siguiente blank
    - Si todos los blanks del verso están completados:
        - La canción continúa reproduciéndose normalmente
        - El sistema cambia al siguiente verso solo cuando el cantante empieza a cantar el siguiente verso (transición natural)
        - Se muestra el nuevo verso con blanks según dificultad
4. **Si alguna palabra es incorrecta**:
    - Feedback visual de error en la palabra incorrecta
    - Opción se marca como intentada y se descarta
    - Usuario puede reintentar o hacer replay del verso
5. **Regla de timeout**:
    - Si el verso termina y quedan blanks sin completar → replay automático del verso actual
    - El replay comienza desde el inicio del verso actual
    - El usuario debe completar los blanks pendientes para avanzar

**Nota de UX**: Si el usuario completa todos los blanks antes de que el cantante termine el verso, el audio sigue sonando y el cambio al siguiente verso ocurre de forma natural cuando el cantante empieza a cantar el siguiente verso. Esto evita cambios bruscos y hace la experiencia más fluida.

---

## UC-04: Replay Verso

**Actor**: Usuario  
**Mecanismo de Resaltado**: El sistema detecta el verso actual que canta el artista mediante **análisis de ondas de sonido** (FFT - Fast Fourier Transform para extraer frecuencias, detección de energía en rangos vocálicos 300Hz-3kHz, y correlación con timestamps del archivo .lrc). Este análisis ocurre en tiempo real en el cliente para zero-latencia.
**Flujo**:

1. Usuario hace clic en botón "Replay"
2. Sistema reproduce nuevamente el verso actual con resaltado tipo karaoke
3. Sistema pausa la canción al final del verso hasta que el usuario complete las palabras en blanco
4. Usuario intenta identificar las palabras faltantes

---

## UC-05: Finalizar Canción

**Actor**: Usuario  
**Flujo**:

1. Usuario completa todos los versos
2. Sistema muestra resumen (score final)
3. Sistema guarda progreso en historial local

---

## UC-06: Ver Historial

**Actor**: Usuario  
**Flujo**:

1. Usuario accede a pantalla de historial
2. Sistema muestra songs completadas con scores
3. Usuario puede reiniciar una canción
