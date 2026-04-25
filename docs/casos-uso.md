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
4. Sistema reproduce primer verso automáticamente
5. Sistema muestra verso con blanks según dificultad
6. Sistema genera 4 opciones (1 correcta + 3 distractores)

---

## UC-03: Responder Verso
**Actor**: Usuario  
**Flujo**:
1. Sistema muestra 4 opciones multiple choice
2. Usuario selecciona una opción
3. **Si correcto**:
   - Animación de éxito
   - Score +1
   - Avanzar al siguiente verso
4. **Si incorrecto**:
   - Feedback visual de error
   - Opción se marca como intentada
   - Usuario puede reintentar o hacer replay

---

## UC-04: Replay Verso
**Actor**: Usuario  
**Flujo**:
1. Usuario hace clic en botón "Replay"
2. Sistema reproduce nuevamente el verso actual
3. Usuario intenta identificar la palabra/frase

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