# FusionV4 CRM - Sistema de Gestión de Reclamos

Este es un sistema de CRM (Customer Relationship Management) completo y moderno diseñado para la gestión de reclamos técnicos. La aplicación cuenta con un frontend reactivo construido con React y un backend robusto y de alto rendimiento desarrollado con FastAPI.

## Arquitectura

- **Frontend:** React con Vite y TailwindCSS para una interfaz de usuario rápida y moderna.
- **Backend:** FastAPI, un framework de Python de alto rendimiento, que sirve una API RESTful.
- **Base de Datos:** Google Sheets, utilizado como una base de datos simple y colaborativa para almacenar reclamos y datos de clientes.
- **Despliegue:** Configurado para un despliegue sencillo en Render como un monorepo, con el frontend como un "Static Site" y el backend como un "Web Service".

## Características Principales

- **Gestión de Reclamos:** Crear, actualizar y visualizar reclamos técnicos.
- **Gestión de Clientes:** Mantener un registro de los clientes y su historial.
- **Autenticación:** Sistema seguro basado en tokens JWT.
- **Cache de Datos:** El backend carga todos los datos de Google Sheets en memoria al iniciar, lo que garantiza respuestas de API casi instantáneas para las operaciones de lectura.
- **Configuración para Despliegue:** Incluye un archivo `render.yaml` para un despliegue automatizado.

---

## Configuración para Desarrollo Local

Siga estos pasos para configurar y ejecutar la aplicación en su máquina local.

### Prerrequisitos

- Node.js (v18 o superior)
- Python (v3.10 o superior)
- `pip` y `venv` para la gestión de paquetes de Python.

### 1. Configuración del Backend

Navegue al directorio del backend y configure el entorno.

```bash
cd backend
```

**Cree y active un entorno virtual:**

```bash
# Crear el entorno virtual
python -m venv venv

# Activar en macOS/Linux
source venv/bin/activate

# Activar en Windows
.\venv\Scripts\activate
```

**Instale las dependencias de Python:**

```bash
pip install -r requirements.txt
```

**Configure las variables de entorno:**

1.  Cree un archivo `.env` en el directorio `backend`.
2.  Añada las siguientes variables:

    ```dotenv
    # backend/.env

    # El ID de su Google Sheet. Se encuentra en la URL de la hoja:
    # https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
    SHEET_ID="su_sheet_id_aqui"

    # Una clave secreta para la codificación de tokens JWT.
    # Puede ser cualquier cadena de caracteres larga y aleatoria.
    SECRET_KEY="una-clave-secreta-muy-segura-para-desarrollo"
    ```

**Configure las credenciales de Google Sheets:**

1.  Asegúrese de tener un archivo `credentials.json` de una cuenta de servicio de Google Cloud con acceso a la API de Google Sheets.
2.  Coloque este archivo en el directorio `backend`. El `DataManager` lo detectará automáticamente para el desarrollo local.

**Ejecute el servidor del backend:**

```bash
uvicorn app:app --reload
```

El backend estará disponible en `http://localhost:8000`. Puede acceder a la documentación interactiva de la API en `http://localhost:8000/docs`.

### 2. Configuración del Frontend

Abra una nueva terminal, navegue al directorio del frontend y configure el entorno.

```bash
cd frontend
```

**Instale las dependencias de Node.js:**

```bash
npm install
```

**Configure las variables de entorno:**

1.  Cree un archivo `.env.local` en el directorio `frontend`. (Copie de `.env.example`)
2.  Añada la siguiente variable para que el frontend sepa dónde encontrar el backend:

    ```dotenv
    # frontend/.env.local
    VITE_API_URL=http://localhost:8000
    ```

**Ejecute el servidor de desarrollo del frontend:**

```bash
npm run dev
```

El frontend estará disponible en `http://localhost:5173` (o el puerto que Vite indique).

---

## Despliegue en Render

Este proyecto está configurado para un despliegue fácil y automatizado en Render utilizando el archivo `render.yaml`.

### Pasos para el Despliegue

1.  **Cree una cuenta en Render** y conecte su repositorio de GitHub.
2.  **Cree un nuevo "Blueprint Service"**:
    *   En el dashboard de Render, haga clic en "New" -> "Blueprint".
    *   Seleccione su repositorio. Render detectará automáticamente el archivo `render.yaml`.
3.  **Configure los Servicios**:
    *   Render creará dos servicios: `crm-backend` y `crm-frontend`.
    *   Antes de finalizar, deberá configurar las variables de entorno para el servicio `crm-backend`.
4.  **Añada las Variables de Entorno Secretas**:
    *   Vaya a la pestaña "Environment" del servicio `crm-backend`.
    *   Añada las siguientes variables como "Secret Files" o variables de entorno:
        *   `SHEET_ID`: El ID de su Google Sheet.
        *   `GOOGLE_SHEETS_CREDENTIALS`: El contenido completo de su archivo `credentials.json`. Cópielo y péguelo como el valor de esta variable.
    *   La variable `SECRET_KEY` se generará automáticamente y de forma segura por Render, como se define en `render.yaml`.
5.  **Despliegue**:
    *   Haga clic en "Create Blueprint". Render comenzará a construir y desplegar ambos servicios.
    *   La variable `VITE_API_URL` para el frontend se configurará automáticamente para apuntar a la URL pública de su backend desplegado.

¡Eso es todo! Una vez que el despliegue se complete, su aplicación CRM estará en vivo.
