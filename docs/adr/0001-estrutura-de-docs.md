---

## docs/adr/0001-estrutura-de-docs.md

```md
# ADR 0001 – Estrutura de documentação no repositório

**Status:** Aceito
**Data:** 2025-08-26

## Contexto

Precisamos organizar a documentação técnica e de uso, manter proximidade com o código e facilitar contribuições.

## Decisão

Centralizar documentação em `docs/` com arquivos dedicados: `vision.md`, `technical.md`, `how-to-run.md`, subpastas `api/`, `ops/` (quando necessário) e `adr/` para decisões.

## Consequências

- 👍 Facilita versionamento e PRs que atualizam código e docs juntos.
- 👉 README da raiz enxuto, apontando para `docs/`.
- 🚧 Requer disciplina para manter docs atualizados nas PRs.
```
