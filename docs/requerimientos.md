# Syncopate - Requerimientos

## Visión
App local para aprender inglés mediante canciones con letras sincronizadas (LRC).

## Funcionalidades Core

### 1. Gestión de Canciones
- **Importar**: Arrastrar MP3 + LRC a zona de drop
- **Validación**: Verificar que par archivo+LRC coincida
- **Listado**: Mostrar canciones añadidas con metadata

### 2. Quiz de Letras (por verso)
- **Reproducción**: Auto-play verso actual
- **Blanqueo por dificultad**:
  - Fácil: 1 palabra (`How long ___ I get in?`)
  - Medio: 2 palabras (`How long ___ ___ get in?`)
  - Difícil: verso completo (`___ ___ ___ ___ ___`)
- **Opciones**: 4 choices por pregunta
- **Replay**: Botón para repetir verso actual
- **Feedback**: Visual al acertar (siguiente verso)

### 3. Progreso
- Score por canción
- Historial local

## Casos de Uso

| ID | Actor | Acción | Resultado |
|---|-------|--------|-----------|
| UC-01 | Usuario | Arrastra MP3+LRC | Canción añadida |
| UC-02 | Usuario | Selecciona canción | Inicia quiz |
| UC-03 | Usuario | Elige opción correcta | Feedback +score |
| UC-04 | Usuario | Reclica verso | Se reproduce |
| UC-05 | Usuario | Falla opción | Retry opciones |

## Dificultades

| Nivel | Blanqueo | Ejemplo |
|-------|----------|---------|
| Fácil | 1 palabra | `How long ___ I get in?` |
| Medio | 2 palabras | `How long ___ ___ get in?` |
| Difícil | verso completo | `___ ___ ___ ___ ___` |

## Formato LRC

```
[mm:ss.xx] línea de letra
[0:19.129] How long before I get in?
[0:21.953] Before it starts, before I begin?
[0:26.430] How long before you decide?
```