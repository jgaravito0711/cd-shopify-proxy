# CD Shopify Proxy Starter

Este proyecto es un **starter** para integrar un formulario de Shopify (App Proxy) que consulta precios en **Central Dispatch** (CD) vía API **server-side** y evita desconexiones por sesiones/cookies.

## Estructura
- `server.js`: servidor Express con endpoint `/apps/cd-quote`.
- `package.json`: dependencias y scripts.
- `vercel.json`: configuración para desplegar en Vercel (Node).
- `Render.yaml`: ejemplo para Render.com.
- `.env.example`: variables de entorno.
- `theme/sections/cd-quote-form.liquid`: sección para insertar el formulario en el tema de Shopify.

## Requisitos
1. **Token de API** de Central Dispatch (o credenciales para obtenerlo/renovarlo). Guárdalo como `CD_API_BEARER` en el servidor.
2. Tienda Shopify con **App Proxy** habilitado.
3. Un hosting para el servidor (Vercel, Render, Fly, etc.).

## Instalación
```bash
# 1) Instala dependencias
npm install

# 2) Crea archivo .env a partir del ejemplo
cp .env.example .env

# 3) Ejecuta en local
npm run dev
```
> Para desarrollo local, usa una URL pública (ngrok, Cloudflare Tunnel) para configurar el App Proxy y probar el webhook `/apps/cd-quote`.

## Variables de entorno (.env)
- `PORT`: Puerto del servidor (por defecto 3000).
- `SHOPIFY_APP_PROXY_SECRET`: (opcional) secreto para validar HMAC del App Proxy.
- `CD_API_BASE`: Base pública de APIs de CD (default en `server.js`).
- `CD_PRICING_API`: Endpoint de pricing/herramienta de Market Intelligence.
- `CD_API_BEARER`: Token Bearer de CD.

## Despliegue (Vercel)
1. Crea un proyecto en Vercel y sube este repo o conéctalo a Git.
2. Define variables de entorno en **Settings → Environment Variables**.
3. Asegúrate que la **versión de Node** sea la que definiste en `package.json` (`"engines"`).
4. Despliega. Vercel expondrá una URL (por ej. `https://tuapp.vercel.app`).

## Despliegue (Render)
1. Nuevo servicio Web → Elige este repo.
2. Runtime Node, Build Command: `npm install`, Start Command: `npm start`.
3. Añade variables de entorno.
4. Despliega. Render expondrá una URL (p.ej. `https://tuapp.onrender.com`).

## Configuración del App Proxy en Shopify
1. En tu **Partner Dashboard** o **Admin** (si es app custom), crea una App **Custom/Privada**.
2. Activa **App Proxy** con la ruta:
   - Subpath Prefix: `apps`
   - Subpath: `cd-quote`
   - Proxy URL: URL pública de tu servidor (`https://tuapp.vercel.app/apps/cd-quote`)
3. Copia el **App Proxy shared secret** y colócalo en `SHOPIFY_APP_PROXY_SECRET` (opcional si quieres validar HMAC).
4. Publica/instala la app en la tienda.
5. Inserta la sección Liquid (`theme/sections/cd-quote-form.liquid`) en tu tema.

## Seguridad
- Nunca expongas `CD_API_BEARER` en el cliente.
- Implementa límites de rate y timeouts.
- Loguea los errores remoto/local para diagnóstico (sin exponer datos sensibles).

## Ajustes para Central Dispatch
- Confirma con soporte de CD el endpoint **exacto de pricing** que tengas habilitado en tu plan.
- Si aún no tienes Market Intelligence, puedes devolver un precio aproximado, o solo el rango, y/o crear un **listing** por sus APIs cuando el usuario acepte.

## Licencia
MIT
