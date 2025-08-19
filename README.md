# BusiCode

## Sobre o Projeto

BusiCode é uma plataforma educacional de simulação empresarial desenvolvida para auxiliar professores durante a execução da atividade didática de mesmo nome. O projeto possui uma **arquitetura dual**: um aplicativo web frontend legado e uma moderna API REST backend com autenticação JWT, facilitando o gerenciamento de turmas, alunos, empresas fictícias e seus recursos financeiros durante as aulas.

## Funcionalidades

### Frontend (Aplicação Web)
- **Interface Responsiva**
  - Design adaptável para diferentes dispositivos
  - Notificações via toast messages
  - Modais interativos para ações importantes
  - Navegação intuitiva entre seções

- **Autenticação de Administradores**
  - Sistema de login JWT para professores
  - Modo somente leitura para estudantes
  - Controle de acesso baseado em roles

### Backend (API REST)
- **Gerenciamento de Turmas**
  - API REST para criação e administração de múltiplas turmas
  - Importação em massa de alunos
  - Estatísticas de turma com saldos totais e médios

- **Gestão de Alunos**
  - CRUD completo via API
  - Controle de saldo individual com operações de ajuste
  - Filtragem por turma

- **Gerenciamento de Empresas**
  - Criação de empresas fictícias com múltiplos membros
  - Sistema de contribuições e controle de capital
  - Gestão de membros com validações de duplicidade

- **Gestão Financeira**
  - API para registro de despesas e receitas
  - Sistema de vendas de produtos com cálculo automático
  - Distribuição de lucros para estudantes
  - Relatórios financeiros detalhados

- **Gestão de Produtos**
  - Lançamento de produtos por empresas
  - Sistema de vendas com histórico
  - Estatísticas de vendas e receitas
  - Prevenção de exclusão de produtos com vendas

- **Autenticação e Segurança**
  - JWT tokens com expiração de 24 horas
  - Senhas hashadas com bcrypt
  - Middleware de autenticação para operações de escrita
  - Sistema de administradores múltiplos

## Requisitos Técnicos

### Backend API
- Node.js v24 ou superior
- Express.js v4.21.2 ou superior
- MySQL 8.0 ou superior
- bcrypt v5.1.1+ para hash de senhas
- jsonwebtoken v9.0.2+ para autenticação JWT
- mysql2 v3.14.3+ para conexão com banco

### Frontend Web
- Navegador web moderno com suporte a ES6+ modules
- Fetch API para comunicação com backend

### Infraestrutura
- Docker e Docker Compose (recomendado)
- Portas: 3000 (API), 80 (Web), 3306 (MySQL)

## Como Executar

### Com Docker (Recomendado)

1. Clone o repositório
2. Configure as variáveis de ambiente (crie um arquivo `.env`):
   ```bash
   MYSQL_DATABASE=busicode
   MYSQL_ROOT_PASSWORD=asdf1234
   MYSQL_PORT=3306
   JWT_SECRET=seu-jwt-secret-aqui
   ```
3. Construa e inicie os contêineres:
   ```bash
   docker compose up -d
   ```
4. Aguarde a inicialização do MySQL e carregamento do schema
5. Acesse:
   - **Aplicação Web**: `http://localhost:80`
   - **API REST**: `http://localhost:3000`
   - **MySQL**: `localhost:3306`

### Credenciais Padrão
- **Administrador**: usuário `admin`, senha `admin123`
- **MySQL**: usuário `root`, senha `asdf1234`

### Desenvolvimento Local

1. Inicie apenas o MySQL:
   ```bash
   docker compose up mysql -d
   ```
2. Para cada aplicação (api/ e web/), instale dependências:
   ```bash
   cd api && npm install
   cd ../web && npm install
   ```
3. Execute as aplicações separadamente:
   ```bash
   # Terminal 1 - API
   cd api && npm start
   
   # Terminal 2 - Web
   cd web && npm start
   ```

## Estrutura do Projeto

```
busicode/
├── api/                    # Backend REST API
│   ├── app.js             # Servidor Express da API
│   ├── package.json       # Dependências do backend
│   ├── docs/              # Documentação da API
│   │   ├── API_DOCUMENTATION.md     # Documentação completa da API
│   │   └── BusiCode_API.postman_collection.json  # Coleção Postman
│   ├── helpers/           # Utilitários e helpers
│   │   ├── error.js       # Classes de erro customizadas
│   │   └── mysql.js       # Helper para conexões MySQL
│   ├── middleware/        # Middlewares Express
│   │   ├── auth.js        # Middleware de autenticação JWT
│   │   └── error.js       # Middleware de tratamento de erros
│   ├── model/             # Modelos de dados e lógica de negócios
│   │   ├── model.js       # Classe base para modelos
│   │   ├── admin.js       # Modelo de administrador
│   │   ├── class.js       # Modelo de turma
│   │   ├── student.js     # Modelo de estudante
│   │   ├── company.js     # Modelo de empresa
│   │   └── product.js     # Modelo de produto
│   └── route/             # Rotas da API
│       ├── auth.js        # Rotas de autenticação
│       ├── class.js       # Rotas de turmas
│       ├── student.js     # Rotas de estudantes
│       ├── company.js     # Rotas de empresas
│       └── product.js     # Rotas de produtos
├── web/                    # Frontend SPA
│   ├── app.js             # Servidor Express para arquivos estáticos
│   ├── package.json       # Dependências do frontend
│   ├── public/            # Aplicação Single Page
│   │   ├── index.html     # Página principal
│   │   ├── index.js       # JavaScript principal
│   │   ├── components/    # Componentes reutilizáveis
│   │   │   ├── modal.js   # Sistema de modais
│   │   │   ├── toast.js   # Sistema de notificações
│   │   │   └── login-modal.js  # Modal de login
│   │   ├── helpers/       # Classes auxiliares do frontend
│   │   │   ├── auth-manager.js      # Gerenciamento de autenticação
│   │   │   ├── class-manager.js     # Gerenciamento de turmas
│   │   │   ├── company-manager.js   # Gerenciamento de empresas
│   │   │   ├── product-manager.js   # Gerenciamento de produtos
│   │   │   ├── request.js           # Cliente HTTP para API
│   │   │   ├── storage.js           # Gerenciamento de armazenamento local
│   │   │   └── backup.js            # Sistema de backup/restore
│   │   ├── model/         # Modelos do frontend (localStorage)
│   │   │   ├── student.js  # Modelo de estudante
│   │   │   ├── company.js  # Modelo de empresa
│   │   │   └── product.js  # Modelo de produto
│   │   ├── views/         # Gerenciadores de view
│   │   │   ├── navigation-view.js   # Navegação
│   │   │   ├── auth-view.js         # Autenticação
│   │   │   ├── class-view.js        # Turmas
│   │   │   ├── company-view.js      # Empresas
│   │   │   └── product-view.js      # Produtos
│   │   └── css/           # Estilos CSS modulares
│       │   ├── index.css          # Estilos principais
│       │   ├── base/              # Reset e variáveis
│       │   ├── components/        # Componentes UI
│       │   ├── layout/            # Layout e navegação
│       │   ├── modules/           # Módulos específicos
│       │   └── utils/             # Utilitários e responsivo
├── database/               # Schema e configuração do banco
│   └── schema.sql         # Schema MySQL com dados iniciais
├── Dockerfile             # Configuração Docker
├── compose.yaml          # Configuração Docker Compose
├── package.json          # Dependências compartilhadas
└── LICENSE               # Licença MIT

## Desenvolvimento

### Arquitetura Dual

**Backend API REST (`/api/`)**:
- Express.js com MySQL para persistência
- Autenticação JWT com bcrypt para senhas
- Modelo base customizado com validação de campos
- Middleware de autenticação para operações de escrita
- Todas as operações de leitura são públicas (estudantes)
- Todas as operações de escrita requerem autenticação (administradores)

**Frontend SPA (`/web/`)**:
- Aplicação Single Page com ES6+ modules
- Dois modos: somente leitura (estudantes) e completo (administradores)
- Gerenciadores de autenticação e comunicação com API
- Sistema de navegação baseado em views
- CSS modular com variáveis para customização

### Patterns de Desenvolvimento

**Models Backend**:
- Classe base `Model` com métodos CRUD padrão
- Conversão automática de tipos monetários (`parseFloat`)
- Geração de UUIDs com `crypto.randomUUID()`
- Sincronização instância-banco após updates

**Autenticação**:
- JWT tokens válidos por 24 horas
- Middleware `authenticateToken` para rotas protegidas
- Frontend detecta estado de autenticação automaticamente
- Headers `Authorization: Bearer <token>` para requests autenticados

**Comunicação API**:
- Cliente HTTP customizado (`request.js`) com suporte a auth
- Gerenciadores específicos para cada entidade
- Tratamento centralizado de erros e responses

### Ferramentas de Debug
- Logs detalhados via `docker compose logs api`
- Postman collection com requests pré-configurados
- Scripts de teste em `/api/docs/`
- Health check endpoint em `/health`

## Documentação da API

Para informações detalhadas sobre todos os endpoints da API, consulte:
- **[Documentação Completa da API](api/docs/API_DOCUMENTATION.md)**
- **[Coleção Postman](api/docs/BusiCode_API.postman_collection.json)**

### Endpoints Principais
- `POST /auth/login` - Autenticação de administradores
- `GET /classes` - Listar turmas
- `GET /students` - Listar estudantes
- `GET /companies` - Listar empresas
- `GET /products` - Listar produtos
- `GET /health` - Status da API

### Testes da API

```bash
# Health check
curl http://localhost:3000/health

# Login de administrador
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Criar turma (requer autenticação)
curl -X POST http://localhost:3000/classes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Turma Teste"}'
```

## Monitoramento

```bash
# Verificar status dos serviços
docker compose ps

# Logs da API
docker compose logs api

# Logs do MySQL
docker compose logs mysql

# Logs do frontend
docker compose logs web

# Reiniciar serviços
docker compose restart
```

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Autor

Pablo Werlang