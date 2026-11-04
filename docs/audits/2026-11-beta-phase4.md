# Informe técnico: Fase 4 (2026-11-04)

> **Rama local:** `beta/2026-11-es-for-en`, sin *push*. Base: `1f3532c`.
> **Sin acciones remotas:** ningún *push*, PR, *merge*, *deploy*, cobro, cuenta ni servicio externo. Consultas a GitHub solo de lectura. Rutinas pausadas sin tocar.
> Cifras de QA y commit probado: `docs/release/2026-11-beta-readiness.md` § Ciclos de la fase 4.

## 1. Seguridad del tutor (prioridad absoluta)

Detalle: `docs/architecture/tutor-safety-evaluation.md`.

- **Evaluación independiente real.** Un agente que no vio las reglas escribió 515 ítems sellados y 251 de desarrollo, en en/es/ja/ar y mezclas. El conjunto sellado solo devuelve agregados. Regresión y evaluación quedan separadas.
- **Resultado:**

| Curso de inglés | Antes | Después |
|---|---|---|
| Detección, sellado | **25,2 %** | **35,0 %** |
| Detección, dev (ajustado) | 14,7 % | 88,1 % |
| Respuesta insegura, sellado | **29,3 %** | **0,0 %** |
| Falsos positivos, sellado | 1,7 % | 2,3 % |

- **La cifra de la fase 3 (≈40 %) era optimista.** Dev 88 % frente a sellado 35 % prueba que las reglas no generalizan.
- **Hallazgo principal:** el peligro era la respuesta. El motor decía «Nice! Tell me one more thing.» a despedidas y abusos.
- **Decisión:** el chat libre no es apto. **Chat guiado por defecto**: el tutor reacciona solo a frases simples de principiante; lo demás recibe un turno neutro, sin elogio, corrección ni cita. Aviso permanente en ambos chats. Los botones de práctica abren actividades guiadas.
- **También:** familias de conceptos en 4 idiomas; lectura de los últimos 3 turnos; la exención «¿cómo se dice?» ya no cubre una frase posterior.
- **Costo:** de las frases ordinarias de principiante en inglés, el tutor atiende el 70 %.

## 2. Autenticación y autorización

Detalle: `docs/architecture/authz-review.md`.

- **Real: sin probar.** No hay proyecto autorizado. Listos: `src/auth/qa-real-journeys.mjs` (se niega fuera de un proyecto de prueba autorizado; autoprueba en `check:all`), `.env` de ejemplo y procedimiento.
- **Defecto corregido:** una conversación se recordaba bajo cualquier id. Ahora solo con ids no adivinables (24+ caracteres); `user_id` no autoriza nada.
- **Sin autenticación en el servidor** (contrato): `/chat` queda abierto, con filtro y chat guiado.

## 3. Edad

Evitable: mentir, borrar datos, otro navegador, modificar el frontend, llamar a `/chat` directamente. Documentado en `authz-review.md` §5. Sin fecha de nacimiento. Una declaración no es verificación.

## 4. Premium (sin activar cobros)

Detalle: `docs/architecture/premium-practice.md` §11.

- Contador persistente y atómico (SQLite), revocación por pase y por cuenta, límite por cuenta entre dispositivos, día del servidor. El navegador ya no elige bloque.
- Premium se niega a activarse sin almacén durable. Producción necesita una base gestionada (no autorizada).
- **Vinculación a la cuenta: bloqueada** por contrato.
- **Tres bloques al día probablemente no justifican una suscripción por sí solos:** `docs/business/regional-pricing-policy.md` §5.
- Modelo de precios regionales configurable, sin precios aprobados, residencia por dos señales no IP.

## 5. Inglés y español

- **Español:** revisión con 591 respuestas (IA, no nativa): correcciones falsas 17 → 5, errores aceptados 29 → 12. Defecto grave corregido: «¿Te gusta…?» se reescribía como «¿Té gusta…?», y «mañana» y «España» se rechazaban por la ñ.
- **Inglés:** `proposal/pre-a1-option-order` se conserva: cambia solo la presentación. Sigue pendiente de aprobación. A1: `docs/curriculum/en-a1-readiness-review.md`.
- **Español A1:** diseño en `docs/curriculum/es-a1-design.md`. Nada construido.
- **Revisión humana:** plan en `docs/curriculum/human-review-plan.md`. **No ha ocurrido ninguna revisión externa.**

## 6. GitHub y Vercel

- Procedimiento revalidado (`docs/release/2026-11-pr-procedure.md`): `main` sin cambios; A y B en cadena limpia; #137 fusiona sin conflictos; #135 choca en 3 archivos; sin migraciones ni dependencias nuevas; reversibilidad y *rollback* descritos.
- `check:github-integration` corre en Windows con `jq-lite`; CI usa `jq` real.
- **Ciclo QA en el repositorio** (`scripts/qa-cycle.mjs`): cada etapa cuenta y una etapa que no corre es fallo.
- **Escaneo de secretos** integrado, con autoprueba de 9 muestras plantadas y cobertura declarada. Una pasada por el historial dio un aviso: era el marcador `sk-your-…` de un `.env.example`.

## 7. SII, legal y pagos

Sin investigación nueva. Aclarado que las 8.000 UTM son el máximo anual, no un costo previsto; que Polar no ha aprobado nada; y cómo describir el producto. Procedimiento comercial en `docs/business/payment-processor-checklist.md`. Privacidad actualizada (últimos 3 mensajes, id no adivinable).

## 8. Límites conocidos

- El filtro detecta 35 % de lo dañino nuevo; 5 % de lo indirecto.
- Una frase dañina con palabras comunes recibe un turno normal, sin elogio.
- Autenticación real sin probar.
- `/chat` sin autenticación ni límite de peticiones.
- Defecto de orden de opciones: en A1 completo es 35/35 (26/26 en arcos 1–5 y 9/9 en arcos 6–7). La rama de propuesta parte de `d788370` y su check solo mide arcos 1–5.
- Sin revisión humana de ningún idioma.
- Pase Premium al portador.
- La práctica extra no tiene interfaz en el curso de inglés.

## 9. Hallazgos para decidir (revisión de currículo)

- El registro tiene `levelId` y `available` por curso, sin «curso × nivel»; español no tiene readiness ni hito. Resolver antes de construir español A1.
- `transform.js` no admite `mini_story`.
- `pedagogyBank.mjs` sale de las regex del evaluador inglés: esos recorridos no miden falsos rechazos reales.
- De los 39 pasos de recuerdo de A1, 21 ocurren en la misma lección; el motor exige otra sesión, no un día.
- Varios documentos de currículo quedaron desactualizados (`a1-map.md`, `blueprints/a1.md`, `multilingual-curriculum.md`); lista en `en-a1-readiness-review.md`.
