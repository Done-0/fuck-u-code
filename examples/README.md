# Usage Examples

This directory contains example workflows showing how to use fuck-u-code in GitHub Actions.

## Files

- **`basic-usage.yml`** - Simple workflow for getting started
- **`advanced-usage.yml`** - Multiple jobs for monorepo analysis
- **`action-usage.yml`** - Using the composite action with quality gates

## Quick Start

1. Copy one of the example files to `.github/workflows/` in your repository
2. Customize the parameters for your needs
3. Commit and push to trigger the workflow
4. Check the Actions tab for results and download the generated report artifacts

## Common Patterns

### Quality Gates
```yaml
- name: Check quality score
  run: |
    SCORE="${{ steps.quality.outputs.quality-score }}"
    if (( $(echo "$SCORE > 80" | bc -l) )); then
      exit 1
    fi
```

### Multiple Languages
```yaml
jobs:
  english-report:
    uses: ZhulongNT/fuck-u-code/.github/workflows/code-quality-analysis.yml@main
    with:
      language: 'en-US'
      
  chinese-report:
    uses: ZhulongNT/fuck-u-code/.github/workflows/code-quality-analysis.yml@main
    with:
      language: 'zh-CN'
```

### Conditional Analysis
```yaml
on:
  pull_request:
    paths:
      - 'src/**'
      - '**.go'
      - '**.js'
      - '**.ts'
```

For more detailed documentation, see [GITHUB_WORKFLOW.md](../GITHUB_WORKFLOW.md).