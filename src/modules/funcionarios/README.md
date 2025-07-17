# Módulo Funcionários

Este módulo gerencia todas as operações relacionadas aos funcionários no sistema de registro de ponto.

## Estrutura

```
funcionarios/
├── dto/
│   ├── create-funcionario.dto.ts    # DTO para criação
│   ├── update-funcionario.dto.ts    # DTO para atualização
│   └── index.ts                     # Exportações
├── entities/
│   └── funcionario.entity.ts        # Entidade TypeORM
├── funcionarios.controller.ts       # Controller REST
├── funcionarios.service.ts          # Lógica de negócio
├── funcionarios.module.ts           # Módulo NestJS
└── README.md                        # Este arquivo
```

## Endpoints Disponíveis

### Funcionalidades Básicas (CRUD)

- `POST /api/funcionarios` - Criar funcionário
- `GET /api/funcionarios` - Listar funcionários (com paginação)
- `GET /api/funcionarios/:id` - Buscar funcionário por ID
- `PATCH /api/funcionarios/:id` - Atualizar funcionário
- `DELETE /api/funcionarios/:id` - Excluir funcionário

### Funcionalidades Específicas

- `GET /api/funcionarios/cpf/:cpf` - Buscar por CPF
- `GET /api/funcionarios/email/:email` - Buscar por email
- `GET /api/funcionarios/departamento/:departamento` - Buscar por departamento
- `GET /api/funcionarios/cargo/:cargo` - Buscar por cargo
- `PATCH /api/funcionarios/:id/ativar` - Ativar funcionário
- `PATCH /api/funcionarios/:id/desativar` - Desativar funcionário

### Estatísticas

- `GET /api/funcionarios/estatisticas/departamentos` - Contagem por departamento
- `GET /api/funcionarios/estatisticas/cargos` - Contagem por cargo

## Parâmetros de Query

### Listagem (`GET /api/funcionarios`)

- `page` (number, opcional): Página (padrão: 1)
- `limit` (number, opcional): Itens por página (padrão: 10)
- `ativo` (boolean, opcional): Filtrar por status ativo

### Busca por departamento/cargo

- `ativo` (boolean, opcional): Filtrar por status ativo (padrão: true)

## Exemplos de Uso

### 1. Criar Funcionário

```bash
POST /api/funcionarios
Content-Type: application/json

{
  "nome": "João Silva",
  "cpf": "123.456.789-10",
  "email": "joao.silva@empresa.com",
  "telefone": "(11) 99999-0001",
  "cargo": "Desenvolvedor Frontend",
  "departamento": "Tecnologia",
  "ativo": true,
  "dataAdmissao": "2023-01-15",
  "horarioTrabalho": {
    "entrada": "08:00",
    "saida": "17:00",
    "intervalos": [
      {
        "inicio": "12:00",
        "fim": "13:00"
      }
    ]
  }
}
```

### 2. Listar Funcionários

```bash
GET /api/funcionarios?page=1&limit=10&ativo=true
```

### 3. Buscar por CPF

```bash
GET /api/funcionarios/cpf/123.456.789-10
```

### 4. Atualizar Funcionário

```bash
PATCH /api/funcionarios/f47ac10b-58cc-4372-a567-0e02b2c3d479
Content-Type: application/json

{
  "telefone": "(11) 99999-9999",
  "cargo": "Desenvolvedor Senior"
}
```

### 5. Desativar Funcionário

```bash
PATCH /api/funcionarios/f47ac10b-58cc-4372-a567-0e02b2c3d479/desativar
```

## Validações

### Campos Obrigatórios

- `nome`: 2-255 caracteres
- `cpf`: Formato XXX.XXX.XXX-XX (único)
- `email`: Email válido (único)
- `telefone`: 10-20 caracteres
- `cargo`: 2-100 caracteres
- `departamento`: 2-100 caracteres
- `dataAdmissao`: Data válida (YYYY-MM-DD)
- `horarioTrabalho`: Objeto com entrada, saída e intervalos

### Validações Específicas

- **CPF**: Deve estar no formato XXX.XXX.XXX-XX e ser único
- **Email**: Deve ser um email válido e único
- **Horários**: Devem estar no formato HH:MM (24h)
- **Status**: `ativo` padrão é `true`

## Respostas da API

### Sucesso

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "nome": "João Silva",
  "cpf": "123.456.789-10",
  "email": "joao.silva@empresa.com",
  "telefone": "(11) 99999-0001",
  "cargo": "Desenvolvedor Frontend",
  "departamento": "Tecnologia",
  "ativo": true,
  "dataAdmissao": "2023-01-15",
  "horarioTrabalho": {
    "entrada": "08:00",
    "saida": "17:00",
    "intervalos": [
      {
        "inicio": "12:00",
        "fim": "13:00"
      }
    ]
  },
  "createdAt": "2024-01-22T10:00:00.000Z",
  "updatedAt": "2024-01-22T10:00:00.000Z"
}
```

### Listagem com Paginação

```json
{
  "data": [
    // array de funcionários
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### Erros Comuns

```json
// CPF já cadastrado
{
  "statusCode": 400,
  "message": "CPF já cadastrado",
  "error": "Bad Request"
}

// Funcionário não encontrado
{
  "statusCode": 404,
  "message": "Funcionário não encontrado",
  "error": "Not Found"
}

// Dados inválidos
{
  "statusCode": 400,
  "message": [
    "CPF deve estar no formato XXX.XXX.XXX-XX",
    "Email deve ser um email válido"
  ],
  "error": "Bad Request"
}
```



## Dependências

- `@nestjs/common`
- `@nestjs/typeorm`
- `@nestjs/swagger`
- `class-validator`
- `class-transformer`
- `typeorm`

## Notas Importantes

1. **Exclusão vs Desativação**: Use desativação em vez de exclusão para manter histórico
2. **Unicidade**: CPF e email devem ser únicos no sistema
3. **Paginação**: Sempre use paginação para listagens grandes
4. **Validação**: Todos os dados são validados antes da persistência
5. **Documentação**: Swagger disponível em `/api/docs` 