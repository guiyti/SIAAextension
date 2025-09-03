# 📚 SIAA Data Extractor

Uma extensão profissional para Chrome/Edge que permite extrair, visualizar e analisar dados acadêmicos do Sistema SIAA da Universidade Cruzeiro do Sul.

## 🚀 Funcionalidades

### 🔍 Extração de Dados
- **Ofertas de Disciplinas**: Código, nome, campus, horários, professores, vagas e matrículas
- **Dados de Alunos**: RGM, nome, e-mail, turma, turno, situação por campus
- **Captura Automática**: Sistema inteligente que detecta e captura dados de múltiplos campus
- **Deduplicação**: Remove automaticamente registros duplicados

### 📊 Visualização e Análise
- **Interface Responsiva**: Adaptável para desktop e mobile
- **Filtros Avançados**: Por campus, período, disciplina e texto livre
- **Ordenação Dinâmica**: Clique nas colunas para ordenar
- **Presets de Visualização**: Configurações predefinidas para diferentes necessidades
- **Alternância de Modos**: Visualização de ofertas ou alunos

### 📋 Gerenciamento de Dados
- **Exportação CSV**: Dados completos ou apenas registros filtrados
- **Importação e Mesclagem**: Combine dados de diferentes capturas
- **Gerenciamento de Colunas**: Oculte/exiba e reordene colunas
- **Armazenamento Local**: Dados salvos automaticamente no navegador

## 🛠️ Instalação e Uso

### Pré-requisitos
- Google Chrome ou Microsoft Edge (versão recente)
- Acesso ao SIAA da Universidade Cruzeiro do Sul
- Credenciais válidas no sistema

### Como Usar

#### 1️⃣ Captura de Dados
1. **Acesse o SIAA**: Faça login em https://siaa.cruzeirodosul.edu.br
2. **Navegue para**: Acadêmico → Consultas → Consultas De Ofertas Por Curso
3. **Ative a Extensão**: Clique no ícone da extensão na barra de ferramentas
4. **Selecione o Curso**: Escolha o curso desejado no dropdown
5. **Inicie a Captura**: Clique em "🔄 Capturar Dados"
6. **Aguarde**: O processo captura ofertas e alunos automaticamente

#### 2️⃣ Visualização de Dados
1. **Abra o Viewer**: Clique em "👁️ Visualizar" na extensão
2. **Alterne Modos**: Use "👥 Visualizar Alunos" para alternar entre ofertas e alunos
3. **Aplique Filtros**: Use a barra lateral para filtrar dados
4. **Configure Colunas**: Use "📊 Organizar Colunas" para personalizar a visualização

#### 3️⃣ Exportação e Backup
1. **Exportar Filtrados**: Use "📥 Exportar Visível" para dados filtrados
2. **Backup Completo**: Use "⬇️ Exportar CSV Completo" para todos os dados
3. **Restaurar Dados**: Use "⬆️ Importar CSV Completo" para restaurar backup

## ⚙️ Configuração

### Presets de Visualização

#### Para Ofertas de Disciplinas
- **Básico**: Código, Nome, Campus, Horário, Professor
- **Detalhado**: Básico + Vagas, Matriculados, Vagas Restantes
- **Por Curso**: Foco em informações acadêmicas e curso
- **Completo**: Todas as colunas disponíveis

#### Para Dados de Alunos
- **Básico**: RGM, Nome, E-mail
- **Detalhado**: Básico + Turma, Turno
- **Por Curso**: Acadêmico + Código do Curso e Campus
- **Completo**: Todas as informações disponíveis

### Cursos Manuais
- Adicione códigos de curso personalizados via "➕ Adicionar Curso"
- Útil para cursos não listados automaticamente pelo sistema

## 🔧 Configuração Avançada

### Arquivo de Configuração
A extensão usa o arquivo `siaa-config.json` para configurações centralizadas:

```json
{
  "api": {
    "academicPeriod": {
      "note": "ano_leti e sem_leti são obtidos dinamicamente do XML comboPeriodo.xml.jsp"
    },
    "extraction": {
      "batchSize": 10,
      "delayBetweenBatches": 800
    }
  }
}
```

### Endpoints Verificados
- **Ofertas**: `/siaa/mod/academico/wacdcon12/comboPeriodo.xml.jsp`
- **Alunos**: `/siaa_academico/secure/academico/relatorio/wacdrel31/XML/combo/XMLComboInst.jsp`

## 📝 Estrutura de Dados

### Ofertas de Disciplinas
| Coluna | Descrição |
|--------|-----------|
| Cód. Disc. | Código da disciplina |
| Nome Disciplina | Nome completo da disciplina |
| Sigla Campus | Sigla do campus (SM, AF, LIB, etc.) |
| Hora | Horários formatados (ex: "Segunda 19:10-20:25") |
| Vagas | Número de vagas disponíveis |
| Matriculados | Alunos já matriculados |
| Nome Professor | Professor responsável |

### Dados de Alunos
| Coluna | Descrição |
|--------|-----------|
| RGM | Registro Geral de Matrícula |
| Nome | Nome completo do aluno |
| E-mail | Endereço de e-mail |
| Turma | Código da turma |
| Turno | Período de aulas |
| Situação | Status da matrícula |

## 🛡️ Segurança e Privacidade

### Dados Locais
- Todos os dados são armazenados localmente no navegador
- Nenhuma informação é enviada para servidores externos
- Use "🗑️ Limpar Todos os Dados" para remover informações armazenadas

### Permissões
- **activeTab**: Acesso à aba ativa do SIAA
- **storage**: Armazenamento local de dados
- **scripting**: Execução de scripts para extração de dados

## 🔍 Solução de Problemas

### Problemas Comuns

#### "Acesse: Acadêmico → Consultas"
**Causa**: Endpoints do SIAA não estão acessíveis
**Solução**: 
1. Navegue até a seção correta no SIAA
2. Verifique se está logado
3. Tente recarregar a página

#### "Nenhum dado disponível"
**Causa**: Primeira execução ou dados não capturados
**Solução**: Execute uma captura de dados primeiro

#### Dados incompletos
**Causa**: Interrupção durante a captura
**Solução**: 
1. Execute nova captura
2. Os dados serão mesclados automaticamente
3. Use "🔄 Limpar Duplicatas" se necessário

### Logs de Debug
Abra o Console do Desenvolvedor (F12) para ver logs detalhados:
- `🔧` = Inicialização
- `🌐` = Requisições de rede
- `📊` = Processamento de dados
- `✅` = Sucesso
- `❌` = Erro

## 📈 Dicas de Uso

### Otimização de Performance
- Capture dados por curso para melhor performance
- Use filtros para reduzir a quantidade de dados exibidos
- Exporte apenas dados necessários

### Workflow Recomendado
1. **Capture**: Dados de todos os cursos necessários
2. **Filtre**: Use filtros para análises específicas
3. **Configure**: Ajuste colunas conforme necessário
4. **Exporte**: Salve resultados filtrados
5. **Backup**: Mantenha backup completo regularmente

### Gestão de Dados
- Execute capturas periódicas para manter dados atualizados
- Use a função de mesclagem para combinar dados de diferentes períodos
- Organize exports por data usando nomes descritivos

## 🏗️ Arquitetura Técnica

### Componentes Principais
- **background.js**: Service Worker principal
- **content.js**: Script injetado no SIAA
- **injected.js**: Lógica de extração de dados
- **popup.js**: Interface da extensão
- **viewer.js**: Visualizador de dados
- **config-manager.js**: Gerenciamento centralizado de configurações

### Configuração Centralizada
- **siaa-config.json**: Configurações unificadas (endpoints, presets, UI)
- **xml-processor.js**: Processamento de dados XML
- Sistema modular para fácil manutenção

## 📄 Changelog

### v1.3.0
- ✅ Sistema de configuração centralizado
- ✅ Verificação de saúde de endpoints (ofertas + alunos)
- ✅ Presets externalizados para fácil configuração
- ✅ Interface otimizada e responsiva
- ✅ Deduplicação automática de dados
- ✅ Suporte completo para dados de alunos

## 🤝 Suporte

### Contato
- **Desenvolvimento**: Equipe interna
- **Documentação**: README.md (este arquivo)
- **Configuração**: siaa-config.json

### Contribuição
Para modificações na configuração, edite o arquivo `siaa-config.json`:
- Endpoints e URLs
- Presets de visualização
- Cores e temas
- Período acadêmico
- Timeouts e performance

---

**💡 Dica**: Esta extensão foi desenvolvida para facilitar análises acadêmicas. Use as funcionalidades de filtro e export para gerar relatórios personalizados conforme suas necessidades.

---

*SIAA Data Extractor - Desenvolvido para a Universidade Cruzeiro do Sul*