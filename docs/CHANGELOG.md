# 📋 Changelog - SIAA Data Extractor

Todas as mudanças importantes neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [2.0.5] - 2024-12-19

### 🌟 Adicionado
- **Interface Sóbria Unificada**: Design elegante com gradientes sutis, sombras e efeitos glassmorphism em toda aplicação
- **Mapeamento Persistente de Cursos**: Sistema que salva automaticamente códigos e nomes de cursos no storage
- **Nomes Completos no Popup**: Dropdown de cursos exibe nomes completos ao invés de apenas códigos
- **Layout Header Otimizado**: Reorganização dos controles com melhor distribuição visual
- **Avisos Contextuais**: Notificações específicas para falhas de salvamento com interface pulsante
- **Estados de Filtros Independentes**: Sistema robusto que isola completamente filtros entre Ofertas e Alunos

### 🔧 Corrigido
- **Ponto e Vírgula Automático**: Removida adição automática de `;` ao clicar em sugestões de filtro
- **Vazamento de Filtros**: Filtros aplicados em Alunos não afetam mais visualização de Ofertas
- **Contexto da Extensão**: Tratamento robusto para erro "Extension context invalidated"
- **Sincronização Visual**: Filtros de coluna agora mostram estado correto ao alternar modos
- **Limpeza de Interface**: Remoção de elementos visuais inconsistentes

### 🎨 Melhorado
- **Botões do Header**: Aplicado estilo sóbrio com gradientes e acentos azuis
- **Botões da Sidebar**: Design unificado para todos os botões do menu hamburger
- **Modal de Adicionar Curso**: Interface elegante alinhada com padrão da aplicação
- **Feedback Visual**: Animações suaves e transições melhoradas
- **Tipografia**: Hierarquia visual aprimorada com pesos e cores consistentes

### ⚡ Performance
- **Filtros Otimizados**: Sistema mais eficiente para aplicação de filtros múltiplos
- **Rendering Melhorado**: Redução de re-renderizações desnecessárias
- **Storage Inteligente**: Persistência otimizada de estados e mapeamentos

---

## [2.0.0] - 2024-12-18

### 🌟 Adicionado
- **Mesclagem Automática de Alunos**: Dados de alunos são mesclados automaticamente como ofertas
- **Campos Enriquecidos**: "Nome do Curso" e "Sigla Campus" em dados de alunos
- **Filtros Múltiplos**: Suporte a múltiplos valores usando `;` como separador
- **Deduplicação Visual**: Interface para seleção manual de registros duplicados
- **Sistema de Comunicação Robusto**: Tratamento avançado de erros de comunicação entre scripts

### 🔧 Corrigido
- **Armazenamento de Dados**: Problemas com salvamento no storage resolvidos
- **Loop Infinito**: Erro "message port closed" causado por forward incorreto
- **Perda de Dados**: Sistema de verificação e recuperação implementado

### 🎨 Melhorado
- **Interface de Duplicatas**: Dialog elegante para seleção de registros
- **Notificações**: Sistema de avisos mais informativo e contextual
- **Logs de Debug**: Informações mais detalhadas para troubleshooting

---

## [1.3.0] - 2024-12-15

### 🌟 Adicionado
- **Sistema de Configuração Centralizado**: Arquivo `siaa-config.json` unificado
- **Verificação de Saúde de Endpoints**: Monitoramento automático de ofertas e alunos
- **Presets Externalizados**: Configurações de visualização flexíveis
- **Interface Responsiva Completa**: Design adaptável para mobile e desktop
- **Suporte Completo para Alunos**: Integração total de dados discentes

### 🔧 Corrigido
- **Estabilidade de Extração**: Melhor tratamento de erros de rede
- **Compatibilidade**: Suporte aprimorado para diferentes versões do Chrome
- **Consistência de Dados**: Validação e formatação melhoradas

### 🎨 Melhorado
- **Performance de Loading**: Carregamento mais rápido de grandes volumes
- **UX de Filtros**: Interface mais intuitiva para filtros complexos
- **Organização de Código**: Modularização e manutenibilidade

---

## [1.2.0] - 2024-12-10

### 🌟 Adicionado
- **Modo de Visualização Dual**: Alternância entre Ofertas e Alunos
- **Sistema de Presets**: Configurações predefinidas de colunas
- **Exportação Seletiva**: Export de dados filtrados
- **Gerenciamento de Colunas**: Interface para ocultar/exibir campos

### 🔧 Corrigido
- **Ordenação de Colunas**: Problemas com sorting em campos numéricos
- **Filtros de Data**: Compatibilidade com formatos brasileiros
- **Memory Leaks**: Otimizações de performance

---

## [1.1.0] - 2024-12-05

### 🌟 Adicionado
- **Filtros Avançados**: Sistema completo de filtros por coluna
- **Interface de Hamburger**: Menu lateral para funcionalidades
- **Sistema de Import/Export**: Backup e restauração de dados
- **Validação de Dados**: Verificação de integridade automática

### 🔧 Corrigido
- **Encoding de Caracteres**: Suporte completo para acentos portugueses
- **Timeout de Requisições**: Melhor tratamento de conexões lentas
- **Estabilidade Geral**: Redução significativa de crashes

---

## [1.0.0] - 2024-12-01

### 🌟 Primeira Versão
- **Extração de Ofertas**: Captura básica de dados de disciplinas
- **Extração de Alunos**: Dados básicos de discentes
- **Interface Simples**: Popup e viewer fundamentais
- **Armazenamento Local**: Persistência básica no Chrome Storage
- **Exportação CSV**: Funcionalidade básica de export

---

## 🔍 Categorias de Mudanças

- **🌟 Adicionado**: Novas funcionalidades
- **🔧 Corrigido**: Correções de bugs
- **🎨 Melhorado**: Mudanças em funcionalidades existentes
- **⚡ Performance**: Otimizações de velocidade/eficiência
- **🔒 Segurança**: Correções relacionadas à segurança
- **📚 Documentação**: Atualizações de documentação
- **💥 Breaking**: Mudanças que quebram compatibilidade

---

## 🚀 Próximas Versões

### v2.1.0 (Em Planejamento)
- [ ] Dashboard analítico com gráficos
- [ ] Exportação em múltiplos formatos (PDF, Excel)
- [ ] Sistema de filtros salvos
- [ ] Tema escuro elegante

### v2.2.0 (Roadmap)
- [ ] API de integração externa
- [ ] Relatórios agendados automáticos
- [ ] Comparação temporal de dados
- [ ] Sistema de alertas inteligentes

---

*Para mais detalhes sobre cada versão, consulte o [README.md](README.md) principal.*
