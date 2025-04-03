# BusiCode

## Sobre o Projeto

BusiCode é uma aplicação desenvolvida para auxiliar professores durante a execução da atividade didática de mesmo nome. Esta ferramenta facilita o gerenciamento de recursos financeiros fictícios, empresas, despesas e lucros que são administrados pelos alunos durante as aulas.

## Funcionalidades

- Gerenciamento de empresas fictícias criadas pelos alunos
- Controle de recursos financeiros atribuídos às empresas
- Registro e acompanhamento de despesas
- Cálculo e visualização de lucros
- Interface amigável para facilitar o uso em sala de aula

## Requisitos Técnicos

- Node.js
- Express
- Docker (opcional para deployment)

## Como Executar

### Localmente

1. Clone o repositório
2. Instale as dependências:
   ```
   npm install
   ```
3. Inicie a aplicação:
   ```
   npm start
   ```
4. Acesse a aplicação em `http://localhost:3000`

### Com Docker

1. Construa as imagens:
   ```
   docker-compose build
   ```
2. Inicie os contêineres:
   ```
   docker-compose up -d
   ```
3. Acesse a aplicação em `http://localhost:3000`

## Estrutura do Projeto

```
busicode/
├── web/                 # Frontend e servidor web
│   ├── app.js           # Aplicação Express
│   ├── public/          # Arquivos estáticos
│   └── package.json     # Dependências do frontend
├── Dockerfile-node      # Configuração Docker para Node.js
├── compose.yaml         # Configuração Docker Compose
└── package.json         # Dependências gerais do projeto
```

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Autor

Pablo Werlang