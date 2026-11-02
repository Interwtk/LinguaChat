# Alcance de la beta — 30 de noviembre de 2026

> **Definición de alcance, no autorización de despliegue.** Publicar, desplegar o cobrar requiere autorización expresa del propietario.

## 1. Qué es la beta

Una beta **pequeña y completa dentro de su alcance**: dos recorridos de nivel inicial que comparten el mismo motor y la misma app.

| Recorrido | Para quién | Contenido | Estado al 2026-11-02 |
|---|---|---|---|
| **Inglés para hispanohablantes** (y para los 8 idiomas de interfaz) | Quien elige inglés | Pre-A1: 17 episodios, sesión diaria, misiones, chat libre local, escucha | Existe en `main` y en la integración local; A1 sigue **cerrado** |
| **Español para angloparlantes** | Quien tiene la interfaz en inglés y elige español | Pre-A1: 12 episodios, 136 pasos, 51 palabras, evaluador español local | **Implementado en la rama local `beta/2026-11-es-for-en`**, probado; no publicado |

## 2. Catálogo de funciones

### Disponibles en la beta
- Elegir qué idioma aprender (inglés o español). Solo se ofrece cuando hay una opción real.
- Lecciones Pre-A1 de ambos cursos con modelo, comprensión, construcción, huecos, respuesta libre, variación (transferencia) y recuerdo sin ayuda.
- Correcciones con explicación en el idioma del estudiante.
- Progreso, racha, XP y Jardín de palabras, separados por curso salvo XP y racha.
- Repasos espaciados por curso.
- Chat libre con Lingua: **solo inglés**, motor local.
- 8 idiomas de interfaz para el curso de inglés. Inglés como único idioma de explicación del curso de español.

### Experimentales (visibles, con aviso)
- Curso de español: contenido sin revisión nativa todavía; el evaluador marca como «no evaluable» lo que no entiende.

### Futuras (no se anuncian como disponibles)
- Inglés A1–C2: el contenido existe y está **cerrado**. Abrir A1 requiere la decisión explícita que exige `CLAUDE.md`.
- Español A1 y siguientes: no existen.
- Chat libre en español, sesión diaria y misiones en español.
- Explicaciones del curso de español en otros idiomas.
- Voz, pronunciación y llamadas.
- Conversación con IA generativa.
- Sincronización en la nube (`CLOUD_PREFERENCES_RELEASED=false`).
- Planes pagos (ver `docs/business/monetization-plan.md`).

## 3. Lo que la beta NO promete
- Fluidez garantizada ni certificación oficial.
- «Conversaciones ilimitadas con IA»: el tutor es un motor local por reglas.
- Niveles distintos de Pre-A1.
- Uso por menores de 18 años.

## 4. Formas posibles de lanzamiento (decisión del propietario)

| Opción | Requiere | Recomendación |
|---|---|---|
| **A. Beta privada gratuita por invitación** (adultos, consentimiento para el piloto) | Fusión en `main`, Preview o producción autorizada, puerta de edad, filtro de seguridad, textos legales revisados, autenticación probada en un entorno autorizado | **Recomendada para el 30 de noviembre** |
| B. Beta pública gratuita con lista de espera de Premium | Lo de A, más los textos legales publicados, la corrección de la página de planes y el borrado de cuenta | Posible si A sale antes del 23 de noviembre |
| C. Beta con cobros | Lo de B, más la entidad legal, el proveedor aprobado, el almacén de derechos en el servidor y un Premium real | **No viable al 30 de noviembre**: ver los bloqueos |

## 5. Mercados
- **Chile y EE. UU.:** primeros, gratis, solo adultos.
- **UE/EEE y Japón:** **no** abrir hasta tener representante en la UE y el aviso APPI (`docs/legal/jurisdiction-matrix.md`). Si la app es accesible desde allí, el aviso de privacidad debe cubrirlo igual.
