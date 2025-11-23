# Proyecto Final - Gym Full Scaffold

Este repositorio incluye el **backend en Django** y el **frontend en React (Vite)** para administrar reservas, membresías y funcionalidades de un gimnasio.

---

## Despliegue sin terminal

1. Instala **Docker Desktop**.
2. Clona este repositorio o descarga el ZIP y descomprímelo.
3. (Opcional) Si quieres personalizar variables de entorno, copia los archivos `.env` desde los ejemplos:

```bash
cp Backend/.env.example Backend/.env
cp Frontend/.env.example Frontend/.env
```

> Si no los copias, `start-app.bat` lo hará automáticamente con los valores por defecto.

4. En Windows basta con **doble clic en `start-app.bat`**.
   El script levanta los contenedores y abre el frontend en:
   [http://localhost:5173](http://localhost:5173)

5. Para detener todo, usa **`stop-app.bat`** o:

```bash
docker compose down
```

---

## Servicios

| Servicio    | URL                                                      | Descripción           |
| ----------- | -------------------------------------------------------- | --------------------- |
| Frontend    | [http://localhost:5173](http://localhost:5173)           | Panel web             |
| Backend API | [http://localhost:8000/api/](http://localhost:8000/api/) | Endpoints Django REST |

---

## Desarrollo local tradicional

Si deseas ejecutar cada proyecto manualmente:

### Backend

```bash
cd Backend
python -m venv .venv
.\\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

---

## Variables de entorno relevantes

| Variable                    | Ubicación     | Descripción                           |
| --------------------------- | ------------- | ------------------------------------- |
| DJANGO_SECRET_KEY           | Backend/.env  | Clave usada por Django y JWT          |
| DJANGO_ALLOWED_HOSTS        | Backend/.env  | Hosts permitidos, separados por coma  |
| DJANGO_CORS_ALLOWED_ORIGINS | Backend/.env  | Orígenes que pueden consumir la API   |
| VITE_API_URL                | Frontend/.env | URL base del backend para el frontend |
| VITE_WS_URL                 | Frontend/.env | URL base para WebSockets              |

---

Con estos archivos cualquier persona puede clonar el repo, hacer doble clic en start-app.bat y usar la aplicación sin tocar la terminal.

---
