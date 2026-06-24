# LinguaChat Local

Proyecto local con backend FastAPI y frontend premium Vite/React.

## Estructura

```text
LinguaChat-local/
  linguachat-backend/       # API FastAPI real
  linguachat-frontend/      # frontend premium oficial
  linguachat-frontend-old/  # respaldo del frontend CRA anterior
```

La tutora del producto se llama **Lingua**.

## Backend

Instalacion:

```powershell
cd linguachat-backend
python -m pip install -r requirements.txt
```

Ejecucion:

```powershell
python -m uvicorn main:app --reload
```

La API queda disponible en `http://127.0.0.1:8000` y su documentacion en
`http://127.0.0.1:8000/docs`.

### OpenAI

Copia `linguachat-backend/.env.example` a `linguachat-backend/.env` y configura:

```env
OPENAI_ENABLED=true
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-5.5
OPENAI_TIMEOUT_SECONDS=20
```

Para probar sin OpenAI, elimina `OPENAI_API_KEY` o usa
`OPENAI_ENABLED=false`. FastAPI seguira respondiendo con el motor local y el
header `X-LinguaChat-Provider: local`.

## Frontend oficial

Instalacion:

```powershell
cd linguachat-frontend
npm install
```

Ejecucion:

```powershell
npm run dev
```

Vite sirve la aplicacion en `http://localhost:5173`.

Configura la URL del backend copiando `.env.example` a `.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Si no se define la variable, el frontend usa esa misma URL local por defecto.

## Integracion real

El Practice Room envia mensajes a `POST /chat` mediante
`linguachat-frontend/src/services/api.js`.

Payload del frontend:

```json
{
  "message": "how you are",
  "level": "B1",
  "mode": "Friendly",
  "history": []
}
```

El servicio normaliza respuestas con `reply`, `response`, `message` o un string
al contrato usado por la interfaz:

```json
{
  "reply": "string",
  "correction": null,
  "explanation": null,
  "suggestion": null,
  "mode": "chat"
}
```

Si OpenAI no esta disponible, el backend usa su motor local y la interfaz lo
indica sin interrumpir el chat. Si FastAPI no responde, el frontend usa el
fallback mock para no bloquear la demo.

## Memoria y progreso local

El frontend conserva en `localStorage`:

- `lc2-session-id`: identificador anonimo y persistente de la sesion local.
- `lc2-chat-messages`: hasta 100 mensajes recientes del Practice Room.
- `lc2-local-progress`: streak, XP, confianza, mensajes, correcciones, temas,
  frases aprendidas y resumen de sesiones.
- `lc2-active-mission`: mision guiada en curso, paso actual, respuestas y XP.
- `lc2-completed-missions`: misiones terminadas en este dispositivo.

El backend usa `session_id` para conservar solamente las ultimas 8
interacciones en RAM. No persiste perfiles, emails ni preferencias. Si FastAPI
se reinicia, puede reconstruir contexto corto desde el `history` enviado por el
frontend.

Conversation Archive, Memory Garden, Language Identity y Journey Rail muestran
mocks durante la primera sesion. Despues de practicar, sustituyen gradualmente
esas cifras por datos reales guardados en el dispositivo.

`Language Identity` incluye el boton **Reset local progress**, que borra solo
sesion, chat y progreso local; no elimina el perfil mock ni cambia la
configuracion visual.

## Misiones guiadas

Today y Journey Rail pueden iniciar una Practice Mission segun nivel y objetivo.
La mision se integra dentro del chat: Lingua presenta la practica, envia cada
paso como mensaje, muestra opciones como chips cuando corresponde y evalua la
respuesta desde el input normal del Practice Room.

Al completar pasos se suma XP local. Al terminar una mision se guarda el avance
en `localStorage` y se actualizan Today, Journey Rail y Language Identity. El
usuario tambien puede salir de una mision y volver al chat libre sin borrar el
progreso anterior.

## Flujos mock

Por ahora siguen siendo locales y no requieren backend:

- Entry, login, signup y recuperacion de contrasena.
- Placement test y configuracion de personalidad.
- Preferencias y perfil.
- Language Identity.
- Memory Garden.
- Conversation Archive.

No se implementaron auth real, base de datos, pagos ni deploy en esta etapa.

## Verificacion

```powershell
python -m compileall linguachat-backend
cd linguachat-frontend
npm install
npm run build
```
