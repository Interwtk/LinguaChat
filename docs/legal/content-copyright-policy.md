# Política de contenido, derechos de autor y marcas (BORRADOR)

> **BORRADOR PARA REVISIÓN JURÍDICA.**
> - Fecha: 2026-11-02.
> - Base legal resumida: `docs/legal/research/2026-11-01-regulatory-research.md` §5 (uso justo en EE. UU., caso a caso; excepciones de cita en la UE y en Chile, art. 71 B de la Ley 17.336; uso referencial de marcas).
> - **No existe una regla universal de «N palabras que siempre pueden copiarse».** No la aplicamos.

## 1. Reglas para el contenido de LinguaChat

1. **Contenido original primero.** Lecciones, diálogos, ejemplos, explicaciones y ejercicios se escriben para LinguaChat. El curso de español Pre-A1 (`src/learning/courses/es/`) es original: no se tradujo ni copió de ningún curso comercial.
2. **No copiar** lecciones, ejercicios, secuencias ni textos de Duolingo, Babbel, Busuu, libros de texto, sitios educativos ni otras apps sin licencia escrita. Inspirarse en *qué* se enseña (saludar, pedir un café) es legítimo. Copiar *cómo* lo expresa otro, no.
3. **Sin reproducción extensa** de canciones, libros, guiones, diálogos de películas o series, poemas recientes ni artículos.
   - **Letras de canciones: nunca**, ni fragmentos, salvo licencia.
   - Títulos y nombres sí pueden mencionarse.
4. **Referencias culturales ordinarias: permitidas.** Decir «Me gusta Taylor Swift», «¿Viste Spider-Man?» o «Trabajo en Disney» es lenguaje normal. Prohibirlo volvería artificiales las conversaciones. Se distinguen estos usos:

| Uso | ¿Permitido? | Condición |
|---|---|---|
| Mención incidental en una conversación o ejemplo | Sí | Sin logos ni imágenes del titular |
| Marca usada para identificar el producto real («un iPhone») | Sí | Uso referencial honesto |
| Insinuar afiliación o patrocinio («Lingua, la tutora oficial de Disney») | **No** | — |
| Personajes protegidos como mascota, profesor o protagonista recurrente | **No** | Salvo licencia |
| Reproducir textos, guiones o diálogos de terceros | **No** (salvo cita breve, atribuida y al servicio de un comentario, revisada caso a caso) | — |
| Letras de canciones | **No** | Salvo licencia |
| Imágenes u obras visuales de terceros | **No** | Salvo licencia o dominio público verificado |
| Voces o imitaciones de personas reales | **No** | — |
| Material con licencia (CC BY, comprado) | Sí | Registrar la licencia y la atribución en el inventario |

5. **Cuando haya un tutor generativo** (hoy no hay): instrucciones de sistema que prohíben reproducir letras y textos extensos; filtro de salida con la misma regla (ver `age-and-safety-policy.md`).
6. **Licencia desconocida = fuera de la beta** hasta aclararse.

## 2. Inventario de activos (2026-11-02)

| Activo | Ubicación | Origen / licencia | Estado |
|---|---|---|---|
| Lecciones inglés Pre-A1 y A1–C2 (texto) | `src/learning/episodes/`, `src/learning/levels/` | Escritas para LinguaChat (historial git del repositorio) | OK; sin revisión jurídica |
| Curso de español Pre-A1 (texto, 12 episodios, 51 palabras) | `src/learning/courses/es/` | Original, escrito en esta rama | OK; **pendiente revisión de un hablante nativo** |
| Vocabulario y traducciones (8 idiomas) | `src/data/vocabulary.js`, `src/i18n/` | Escritas para LinguaChat | OK |
| Mascota Chatto (6 PNG + variantes WebP/PNG generadas) | `src/assets/chatto/` | Introducida el 2026-07-12 («official Chatto mascot asset»). **Autoría y licencia no documentadas en el repositorio.** Si se generó con IA, revisar los términos de la herramienta y la protegibilidad. | **BLOQUEO**: el propietario debe confirmar autoría y derechos |
| Avatar de Lingua | `src/components/ui/LinguaAvatar` (letra «L» en CSS/SVG en línea) | Creado en código | OK |
| Favicon | `index.html` (SVG en línea, letra «L») | Creado en código | OK |
| Tipografía Figtree | Google Fonts (CDN) | SIL Open Font License 1.1 | OK la licencia. **Privacidad:** se carga desde servidores de Google (IP del usuario). Recomendado alojarla nosotros. |
| Tipografía Bricolage Grotesque | Google Fonts (CDN) | SIL Open Font License 1.1 | Ídem |
| Iconos | SVG en línea en los componentes | Creados en código (no se usa ninguna biblioteca de iconos según `package.json`) | OK; verificar uno a uno si alguno se copió |
| Sonidos / voces | No hay archivos de audio; la voz usa la síntesis del dispositivo (`src/audio/speech.js`) | Voz del sistema operativo del usuario | OK; no grabamos ni distribuimos voces |
| Dependencias de software | Frontend: react, react-dom, @supabase/supabase-js (MIT; leído de `node_modules` el 2026-11-02). Backend: fastapi (MIT), uvicorn (BSD-3), pydantic (MIT), python-dotenv (BSD-3), httpx (BSD-3), starlette (BSD-3), openai (Apache-2.0; instalado pero sin proveedor activo) | Permisivas | OK; generar el aviso de terceros (NOTICE) antes del lanzamiento público |
| Nombre «LinguaChat» y «Lingua» | — | **USPTO** (API pública, 2026-11-02): 0 resultados para «LINGUACHAT» y variantes; «LINGUACHET» (clase 9, idiomas) cancelada en 2021; «LINGUA*» con 90 registros vivos, muchos en las clases 9/41/42. **INAPI**: búsqueda no ejecutada (reCAPTCHA; procedimiento en `docs/business/research/2026-11-02-chile-sii-briefing.md` §8). Costo en INAPI ≈ 3 UTM por clase | **Riesgo de publicación con nombre**, no bloqueo del código: búsqueda profesional y solicitud antes del lanzamiento comercial |

## 3. Proceso de revisión antes de publicar contenido

1. ¿Es original? Si no, ¿hay licencia escrita registrada en el inventario?
2. ¿Contiene letras, guiones o textos de terceros? Si sí, eliminarlos o reescribirlos de forma original.
3. ¿Usa marcas o personajes? Solo como referencia ordinaria, sin logos ni afiliación.
4. Dos personas lo revisan cuando el contenido es de un nivel nuevo: autor más revisor. Para el español, un hablante nativo.
5. Se registra en el inventario: activo, fuente, licencia, fecha y responsable.

## 4. Reclamaciones y retirada

- **Canal:** [legal@DOMINIO], indicado en los Términos.
- **Contenido mínimo de un aviso:** obra afectada, ubicación en LinguaChat, datos de contacto y declaración de buena fe.
- **Procedimiento:**
  1. Acuse de recibo en **[5]** días hábiles.
  2. Retiro preventivo si el reclamo es verosímil.
  3. Decisión documentada.
  4. Posibilidad de contranotificación.
- **Antes de vender en EE. UU.:** registrar un agente DMCA en la Copyright Office para acogerse al puerto seguro (§512). Solo aplica si se aloja contenido de usuarios, cosa que la beta no hace. Revisar con un abogado.
- **Registro de reclamos:** fecha, obra, decisión y plazo, sin datos innecesarios.

## 5. Bloqueos para la beta pública

> **Actualización fase 2 (2026-11-02):**
> - El código y los textos nuevos de esta fase son originales: plan de sesión, misiones, tutor de español y respuestas de seguridad.
> - Las misiones reutilizan turnos de las lecciones propias.
> - **Chatto sigue sin autoría ni licencia documentadas: sigue bloqueando la publicación.**

- [ ] El propietario confirma la autoría y los derechos de **Chatto**.
- [ ] Búsqueda de marca de «LinguaChat».
- [ ] Revisión nativa del curso de español.
- [ ] Decisión: alojar las fuentes nosotros (recomendado) o declarar Google Fonts en la política de privacidad (ya declarado en el borrador).
