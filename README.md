# Presentación UTEM × UMD × USP

**▶ Ver la presentación en línea: https://ibarraespinosa.github.io/utem-umd-usp/**

**⬇ Descargar el PDF: https://ibarraespinosa.github.io/utem-umd-usp/UTEM-UMD-USP_presentacion.pdf**

Propuesta de cooperación académica y científica de la **Universidad Tecnológica Metropolitana (UTEM)** con la **University of Maryland (UMD)** y la **Universidade de São Paulo (USP)**.

La presentación está hecha en HTML, CSS y JavaScript. **Funciona sin conexión a internet**: todo (fuentes, imágenes, mapas e íconos) está incluido en esta carpeta.

**Contenido (33 láminas, todas con notas para el expositor):**

| Sección | Láminas |
|---|---|
| Inicio | Portada · Resumen ejecutivo · Contenido |
| 01 · El puente | Perfil del Dr. Sergio Ibarra-Espinosa · Trayectoria (mapa) |
| 02 · University of Maryland | Cifras · Rankings · 12 facultades y escuelas · Programas afines a la UTEM · Campus y sedes · Mapa del ecosistema federal |
| 03 · ESSIC · CISESS · NOAA · NASA | ESSIC · CISESS · NOAA Air Resources Laboratory · UMD, el puente entre NOAA y NASA |
| 04 · Universidade de São Paulo | Departamento de Ciencias Atmosféricas · IAG · Instituto de Física · La USP en cifras |
| 05 · Oportunidades para la UTEM | Chile, laboratorio natural · Chile ya forma parte de esta red · Red trilateral UTEM–UMD–USP · Seis áreas de cooperación |
| 06 · Hoja de ruta | Mecanismos y fondos · Hoja de ruta · Lo que solicitamos · Gracias |
| Anexos | Fuentes · Créditos de imágenes |

---

## 1. Cómo abrirla

**En línea:** abra https://ibarraespinosa.github.io/utem-umd-usp/ en Chrome, Edge, Firefox o Safari.

**Sin conexión (recomendado para la reunión):**
1. En esta página de GitHub, presione **Code → Download ZIP** y descomprima el archivo en el computador con el que va a presentar.
2. Haga doble clic en **`index.html`**. Se recomienda **Google Chrome** o **Microsoft Edge**.
3. Presione **F** para pasar a pantalla completa.

> No separe `index.html` del resto de las carpetas (`css`, `js`, `assets`): la presentación las necesita.

## 2. Cómo avanzar

| Acción | Teclas |
|---|---|
| Lámina siguiente | `→`, `Espacio`, `Av Pág` o clic con el mouse |
| Lámina anterior | `←` o `Re Pág` |
| Ir a una lámina específica | escriba el número y presione `Enter` (por ejemplo, `1` `2` `Enter`) |
| Vista general de todas las láminas | `O` o `Esc` |
| Pantalla completa | `F` |
| Notas del expositor en pantalla | `N` |
| Modo presentador (otra ventana) | `P` |
| Pantalla negra (pausa) | `B` |
| Ayuda | `H` |

Los punteros o controles remotos de presentación (que envían Av Pág / Re Pág) funcionan sin configuración adicional. Al mover el mouse aparece, en la esquina inferior derecha, una barra con estos mismos controles.

## 3. Modo presentador (recomendado)

Cada lámina tiene **notas para el expositor** con lo que conviene decir.

1. Conecte el proyector en modo **"Extender"** (no "Duplicar").
2. Abra `index.html` y presione **P**. Se abre una segunda ventana con la lámina actual, la siguiente, las notas y un cronómetro (haga clic en el cronómetro para reiniciarlo).
3. Deje esa ventana en la pantalla del computador. Arrastre la ventana principal al proyector y presione **F**.
4. Puede avanzar desde cualquiera de las dos ventanas: ambas se mantienen sincronizadas.

Si no usa un segundo monitor, presione **N** para ver las notas en la parte inferior de la pantalla.

## 4. Completar los datos pendientes (nombre, fecha, contactos)

Los datos que faltan aparecen **resaltados en amarillo** dentro de la presentación. Para completarlos:

1. Abra el archivo **`js/config.js`**:
   - **En GitHub** (requiere permiso de edición en el repositorio): abra el archivo, presione el ícono del lápiz (*Edit*), haga los cambios y presione **Commit changes**. La versión en línea se actualiza en uno o dos minutos.
   - **En su computador:** ábralo con cualquier editor de texto (Bloc de notas, TextEdit, VS Code).
2. Reemplace los textos entre corchetes, por ejemplo:
   ```js
   directorName:  "Dr. Juan Pérez",
   meetingDate:   "26 de noviembre de 2026",
   ```
3. Guarde el archivo y recargue la presentación (**F5**).

Para ocultar la tarjeta de contacto de la USP en la lámina de cierre, deje `uspContactName: ""`.

## 5. Versión PDF

El archivo `UTEM-UMD-USP_presentacion.pdf` **se regenera automáticamente** (GitHub Actions) cada vez que se modifica la presentación en GitHub, por ejemplo al completar `js/config.js`. En uno o dos minutos, el PDF del repositorio y la versión en línea quedan actualizados. El avance se puede seguir en la pestaña **Actions** del repositorio.

Para generarlo a mano:

- **Desde el navegador:** abra la presentación en Chrome o Edge, presione `Ctrl + P` (en Mac, `Cmd + P`) y elija **Guardar como PDF**. En "Más opciones", configure los márgenes en **Ninguno** y active **Gráficos de fondo**.
- **Desde la terminal:** `python tools/build_pdf.py` (requiere `pip install playwright` y `python -m playwright install chromium`).

## 6. Estructura de archivos

```
index.html          Contenido de todas las láminas y notas del expositor
css/theme.css       Diseño visual (colores, tipografía, diagramación)
css/deck.css        Motor de presentación (transiciones, vista general, impresión)
css/fonts.css       Tipografías locales (Barlow, Barlow Condensed, Crimson Pro)
js/config.js        Datos editables: nombre del director, fecha, contactos
js/deck.js          Navegación, notas y modo presentador
js/globe.js         Globo animado de la portada
js/effects.js       Contadores animados y mapas
js/geo-data.js      Datos geográficos (Natural Earth, U.S. Census Bureau)
js/icons.js         Íconos (Lucide)
js/credits.js       Créditos de las fotografías
assets/             Fotografías, logotipos, mapas y tipografías
tools/build_pdf.py  Genera el PDF (lo usa GitHub Actions)
.github/workflows/  Automatización: regenera el PDF y publica el sitio web
```

## 7. Fuentes y créditos

- Las cifras provienen de fuentes oficiales de UMD, ESSIC, CISESS, la NOAA, la NASA y la USP. El detalle está en la última lámina ("Fuentes y créditos").
- Las fotografías provienen de Wikimedia Commons y de agencias del gobierno de EE.UU. (dominio público). Sus autores y licencias aparecen en cada lámina y en `assets/img/CREDITS.json`.
- Tipografías bajo SIL Open Font License; íconos de Lucide (licencia ISC); mapas de Natural Earth y del U.S. Census Bureau (dominio público).
- Los logotipos institucionales pertenecen a sus respectivas instituciones.
