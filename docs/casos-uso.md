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
**Flujo**:
1. Usuario selecciona canción del listado
2. Usuario elige dificultad (Fácil/Medio/Difícil)
3. Sistema carga lyrics parseados desde .lrc
4. Sistema reproduce el verso actual con resaltado tipo karaoke (las palabras que canta el cantante se resaltan en tiempo real, incluso si son palabras ocultas/blanks; si la canción se pausa, se mantiene el resaltado en la última palabra cantada)
5. Sistema pausa la canción automáticamente al llegar al final del verso
6. Sistema muestra el verso con palabras ocultas (blanks) según dificultad
7. Sistema genera 4 opciones de palabras individuales (1 correcta + 3 distractores)
8. La canción permanece pausada hasta que el usuario complete todas las palabras en blanco del verso

---

## UC-03: Responder Verso
**Actor**: Usuario  
**Flujo**:
1. Sistema muestra 4 opciones de palabras individuales (multiple choice)
2. Usuario selecciona las palabras faltantes para completar los blanks del verso
3. **Si todas las palabras son correctas**:
    - Animación de éxito
    - Score +1 por palabra correcta
    - Canción reanuda reproducción y avanza al siguiente verso
4. **Si alguna palabra es incorrecta**:
    - Feedback visual de error en la palabra incorrecta
    - Opción se marca como intentada
    - Usuario puede reintentar o hacer replay del verso

---

## UC-04: Replay Verso
**Actor**: Usuario  
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