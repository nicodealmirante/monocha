# Chavito Admin Backend

Backend en Node.js + Express + Sequelize (PostgreSQL) para el panel de administradores de unidades.

## 🚀 Uso rápido

1. Copiá `.env.example` a `.env` y completá:

```env
PORT=3000
DATABASE_URL=postgres://usuario:password@host:5432/chavito
JWT_SECRET=poné-una-clave-bien-larga
NODE_ENV=development
```

En Railway solo configurá `DATABASE_URL` y `JWT_SECRET` en variables de entorno.

2. Instalá dependencias:

```bash
npm install
```

3. Iniciá el servidor:

```bash
npm start
```

La primera vez crea:
- una unidad demo
- un SUPER_ADMIN:
  - email: `admin@chavito.local`
  - password: `admin123`

## 🔑 Endpoints principales

- `POST /auth/login` → devuelve JWT y datos del admin.
- `GET /admin/orders` → lista pedidos de la unidad (filtra opcionalmente por `estado`, `desde`, `hasta`).
- `PUT /admin/orders/:id/status` → cambiar estado de un pedido.
- `GET /admin/orders/:id/label` → etiqueta JSON del pedido.
- `GET /admin/products` → lista productos locales de la unidad.
- `POST /admin/products` → crea producto local.
- `PUT /admin/products/:id` → edita producto local.
- `DELETE /admin/products/:id` → borra producto local.
- `GET /admin/report` → resumen de compras por producto en un periodo.

Todos los endpoints `/admin/*` requieren header:

```http
Authorization: Bearer <token>
```

Token que sale de `/auth/login`.
