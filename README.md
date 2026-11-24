# Orion CRM

A simplified Customer Relationship Management (CRM) application built with the MERN stack (modernized with TypeScript, Vite, and Prisma).

## Architecture

This project follows a monorepo structure with separate frontend and backend applications:

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js 22 + Express 5 + TypeScript + Prisma

## Prerequisites

- **Node.js** >= 22.0.0
- **npm** >= 10.0.0

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd p7-dfsjs
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` if needed (default values should work for local development).

`CORS_ORIGIN` (optional) sets the only origin allowed to call the API from a browser; it defaults to the Vite dev client `http://localhost:4200`. It is not needed with Docker, where nginx serves the client and proxies `/api` on the same origin.

### 4. Initialize the database

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Install frontend dependencies

```bash
cd ../client
npm install
```

### 6. Configure frontend environment

```bash
cp .env.example .env
```

## Running the Application

### Start the backend server

```bash
cd server
npm run dev
```

The API will be available at `http://localhost:8080`

### Start the frontend application

In a new terminal:

```bash
cd client
npm run dev
```

The application will be available at `http://localhost:4200`

## Running with Docker

Requires Docker Engine with the Compose plugin (`docker compose`). No local Node.js or `.env` file is needed.

```bash
docker compose up -d --build
```

The application is available at `http://localhost:4200`.

| Service  | Image                    | Exposed port | Role                                                        |
| -------- | ------------------------ | ------------ | ----------------------------------------------------------- |
| `client` | `orion-crm-client:local` | `4200`       | nginx: serves the React build and proxies `/api` to `server` |
| `server` | `orion-crm-server:local` | none         | Express API + SQLite, reachable only through the proxy      |

- The SQLite database is stored in the named volume `db-data` (`/app/data` in the container).
  Prisma migrations run automatically when the server starts.
- `client` starts only once `server` passes its healthcheck (`/api/health`).

Useful commands:

```bash
docker compose ps                         # both services should be "healthy"
curl http://localhost:4200/api/health     # API health through the nginx proxy
docker compose logs -f server             # follow API logs
docker compose down                       # stop and remove containers (data is kept)
docker compose down -v                    # also delete the db-data volume (data is lost)
```

> `down -v` permanently deletes the database. Back it up first.

## Monitoring (local ELK)

An optional ELK stack (Elastic 8.19.25) centralizes the logs of the `orion-crm` containers. It is a **local-only** tool: it runs from a separate Compose file and never runs in CI.

```
server (pino JSON) ┐
client (nginx)     ┴→ stdout → Docker log files → Filebeat → Logstash → Elasticsearch → Kibana
```

- **Filebeat** reads the Docker log files of the `orion-crm` project only and adds container metadata. Its registry (volume `filebeat-data`) stores read positions, so no log is lost while Logstash is down.
- **Logstash** parses pino JSON lines into fields (`level`, `req.method`, `req.url`, `res.statusCode`, `responseTime`, `err`), uses the pino `time` as `@timestamp` and writes to the daily index `orion-logs-YYYY.MM.DD`. Plain-text lines (nginx, Prisma migrations) get `level: info` (stdout) or `warn` (stderr).
- **Elasticsearch** stores and indexes the logs; **Kibana** is used to search and visualize them.
- Healthchecks are not logged at the source (`/api/health` on the server, `/healthz` on the client).

### Setup

Requires about 4 GB of free RAM (`mem_limit`: Elasticsearch 2 GB, Logstash 1 GB, Kibana 1 GB, Filebeat 256 MB).

```bash
cp elk/elk.env.example elk/elk.env
```

Adapt `elk/elk.env` (git-ignored) to your Docker installation:

| Variable                | Default                      | How to find it                                                    |
| ----------------------- | ---------------------------- | ----------------------------------------------------------------- |
| `DOCKER_CONTAINERS_DIR` | `/var/lib/docker/containers` | `$(docker info --format '{{.DockerRootDir}}')/containers`         |
| `DOCKER_SOCK`           | `/var/run/docker.sock`       | `docker context inspect --format '{{.Endpoints.docker.Host}}'` (without `unix://`) |

With Docker installed as a snap: `DOCKER_CONTAINERS_DIR=/var/snap/docker/common/var-lib-docker/containers`.

### Run

```bash
docker compose up -d --build                                              # the application
docker compose -f docker-compose-elk.yml --env-file elk/elk.env up -d     # the log stack
docker compose -f docker-compose-elk.yml ps                               # elasticsearch, logstash, kibana "healthy"
```

Open Kibana at `http://127.0.0.1:5601`, create a data view with the index pattern `orion-logs-*` and the timestamp field `@timestamp`, then use **Discover**. Example KQL queries:

```
level : "error"
res.statusCode >= 400
container.labels.com_docker_compose_service : "server"
```

Stop the stack with `docker compose -f docker-compose-elk.yml down` (add `-v` to delete the indexed logs and the Filebeat registry).

### Security notes

- `xpack.security.enabled=false`: no authentication or TLS. This is acceptable **only locally**: Elasticsearch (`9200`) and Kibana (`5601`) are bound to `127.0.0.1`, and the Beats port `5044` is not published. A shared or production deployment requires security enabled (TLS, users, roles).
- Filebeat runs as `root` and mounts the Docker socket (read-only) to read container logs and metadata. Access to the Docker socket is equivalent to root on the host: this is an accepted risk for local use.
- HTTP headers (`Authorization`, `Cookie`) are never logged by the server.

## Available Scripts

### Backend (server/)

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

### Frontend (client/)

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Lint code

## Project Structure

```
p7-dfsjs-starter/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API client services
│   │   ├── types/         # TypeScript type definitions
│   │   ├── App.tsx        # Main App component
│   │   └── main.tsx       # Application entry point
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── server/                # Backend Express application
│   ├── src/
│   │   ├── controllers/   # Route handlers (HTTP layer)
│   │   ├── services/      # Business logic layer
│   │   ├── repositories/  # Data access layer
│   │   ├── models/        # Data models and schemas
│   │   ├── routes/        # API route definitions
│   │   └── index.ts       # Server entry point
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
└── README.md
```

## Features

- **Dashboard**: View statistics and overview
- **Contacts Management**: Create, read, update, and delete contacts
- **Organizations Management**: Manage companies and link them to contacts
- **RESTful API**: Well-structured backend with Controller-Service-Repository pattern
- **Type Safety**: Full TypeScript support on frontend and backend
- **Modern UI**: Tailwind CSS with responsive design

## API Endpoints

### Organizations

- `GET /api/organizations` - Get all organizations
- `GET /api/organizations/:id` - Get organization by ID
- `POST /api/organizations` - Create new organization
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization
- `GET /api/organizations/stats` - Get organization statistics

### Contacts

- `GET /api/contacts` - Get all contacts
- `GET /api/contacts/:id` - Get contact by ID
- `POST /api/contacts` - Create new contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact
- `GET /api/contacts/stats` - Get contact statistics

### Logs

- `POST /api/logs` - Record a browser error (`{ level, message, stack?, path? }`, unknown keys rejected). Returns `204`, `400` if invalid, `429` after 30 requests per minute per IP. Used by the client to send uncaught errors to the server logs (and to ELK).

## Technology Stack

### Frontend

- **React 19**: Modern React with Hooks
- **TypeScript 5.x**: Static typing
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first CSS framework
- **TanStack Query**: Data fetching and caching
- **Axios**: HTTP client
- **React Router**: Client-side routing
- **Zustand**: Lightweight state management

### Backend

- **Node.js 22 LTS**: JavaScript runtime
- **Express 5**: Web framework
- **TypeScript 5.x**: Static typing
- **Prisma**: Modern ORM
- **SQLite**: Development database
- **Zod**: Runtime type validation
- **Vitest**: Testing framework

## Development Guidelines

### Code Style

- Use **TypeScript strict mode**
- No `any` types allowed
- Use **functional components** and hooks (no class components)
- Use `async/await` for asynchronous operations (no callbacks)
- Follow the **Controller-Service-Repository** pattern on the backend

### Architecture Principles

- **Separation of Concerns**: Clear separation between UI, business logic, and data access
- **Type Safety**: Define interfaces/types for all data structures
- **Custom Hooks**: Extract complex logic into reusable hooks
- **API Layer**: Centralized API calls in service files
- **Validation**: Use Zod schemas for input validation

## License

MIT
