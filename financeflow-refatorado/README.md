# FinanceFlow Refatorado

Esta versão foi reorganizada a partir do arquivo HTML monolítico original.

## Estrutura
- `index.html`: estrutura principal da aplicação
- `css/`: estilos separados por responsabilidade
- `js/`: regras separadas por estado, persistência, cálculos, renderização, CRUD, navegação e inicialização

## Objetivo desta versão
Preservar o comportamento atual do app enquanto prepara a base para futuras melhorias estruturais.

## Próximos passos recomendados
1. Adicionar validação forte na importação de JSON.
2. Corrigir a modelagem de saldo inicial vs saldo atual nas contas.
3. Evoluir de `localStorage` para backend real.
4. Reestruturar investimentos e patrimônio.
