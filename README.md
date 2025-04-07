# BusiCode

## Sobre o Projeto

BusiCode é uma aplicação web desenvolvida para auxiliar professores durante a execução da atividade didática de mesmo nome. Esta ferramenta facilita o gerenciamento de turmas, alunos, empresas fictícias e seus recursos financeiros durante as aulas, proporcionando uma experiência prática de gestão financeira.

## Funcionalidades

- **Gerenciamento de Turmas**
  - Criação e administração de múltiplas turmas
  - Importação em massa de alunos via CSV
  - Definição de saldo inicial por aluno

- **Gestão de Alunos**
  - Cadastro individual e em lote de alunos
  - Controle de saldo individual
  - Operações em massa para ajuste de saldos

- **Gerenciamento de Empresas**
  - Criação de empresas fictícias pelos alunos
  - Definição de contribuições dos membros
  - Controle de capital inicial e recursos

- **Gestão Financeira**
  - Registro e acompanhamento de despesas
  - Controle de receitas e vendas
  - Histórico de transações
  - Cálculo automático de lucros e balanços

- **Interface Responsiva**
  - Design adaptável para diferentes dispositivos
  - Notificações via toast messages
  - Modais interativos para ações importantes
  - Navegação intuitiva entre seções

## Requisitos Técnicos

- Node.js v22 ou superior
- Express.js v4.21.2 ou superior
- Navegador web moderno com suporte a ES6+

## Como Executar

### Localmente

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie a aplicação:
   ```bash
   npm start
   ```
4. Acesse a aplicação em `http://localhost:3000`

### Com Docker

1. Construa e inicie os contêineres:
   ```bash
   docker-compose up -d
   ```
2. Acesse a aplicação em `http://localhost:80`

## Estrutura do Projeto

```
busicode/
├── web/                    # Frontend e servidor web
│   ├── app.js             # Servidor Express
│   ├── public/            # Arquivos estáticos
│   │   ├── components/    # Componentes web reutilizáveis
│   │   │   ├── modal.js   # Sistema de modais
│   │   │   ├── toast.js   # Sistema de notificações
│   │   │   └── navigation-manager.js  # Gerenciador de navegação
│   │   ├── helpers/       # Classes auxiliares
│   │   │   ├── class-manager.js     # Gerenciamento de turmas
│   │   │   ├── company-manager.js   # Gerenciamento de empresas
│   │   │   ├── product-manager.js   # Gerenciamento de produtos
│   │   │   └── storage.js           # Gerenciamento de armazenamento
│   │   ├── model/         # Classes de modelo
│   │   │   ├── company.js  # Modelo de empresa
│   │   │   ├── product.js  # Modelo de produto
│   │   │   └── student.js  # Modelo de aluno
│   │   ├── css/           # Estilos da aplicação
│   │   │   ├── index.css          # Estilos principais
│   │   │   └── notifications.css   # Estilos de notificações
│   │   ├── index.html     # Página principal
│   │   └── index.js       # JavaScript principal
│   └── package.json       # Dependências do frontend
├── Dockerfile-node        # Configuração Docker para Node.js
├── compose.yaml          # Configuração Docker Compose
├── package.json          # Dependências do projeto
└── LICENSE              # Licença MIT

## Desenvolvimento

O projeto utiliza uma arquitetura modular baseada em componentes JavaScript, com:
- Classes ES6+ para gerenciamento de estado e lógica de negócios
- Sistema de navegação SPA (Single Page Application)
- Armazenamento local para persistência de dados
- Sistema de notificações e modais para feedback ao usuário
- CSS modular com variáveis para fácil customização

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Autor

Pablo Werlang