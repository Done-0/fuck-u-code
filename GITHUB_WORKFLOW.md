# GitHub Workflow for Code Quality Analysis

This repository provides a reusable GitHub workflow that allows you to run `fuck-u-code` analysis in any repository and output markdown reports as artifacts.

## Features

- ✅ **Reusable workflow** - Can be called from any GitHub repository
- 📊 **Markdown reports** - Perfect for AI analysis, documentation, and CI/CD
- 🗃️ **Artifact storage** - Reports are automatically uploaded as GitHub artifacts
- ⚙️ **Configurable** - Supports all fuck-u-code options as workflow inputs
- 🌍 **Multi-language** - Supports both Chinese (zh-CN) and English (en-US) reports
- 📋 **Job summaries** - Displays key metrics directly in the GitHub Actions UI

## Usage

### Basic Usage

Add this to your repository's workflow file (e.g., `.github/workflows/code-quality.yml`):

```yaml
name: Code Quality Analysis

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  code-quality:
    uses: ZhulongNT/fuck-u-code/.github/workflows/code-quality-analysis.yml@main
    with:
      path: '.'
      language: 'en-US'
      artifact-name: 'code-quality-report'
```

### Advanced Usage

```yaml
name: Comprehensive Code Quality Check

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-quality:
    uses: ZhulongNT/fuck-u-code/.github/workflows/code-quality-analysis.yml@main
    with:
      path: './backend'
      language: 'en-US'
      top-files: 10
      max-issues: 8
      verbose: true
      exclude-patterns: '**/*.test.go **/*.mock.go vendor/**'
      artifact-name: 'backend-quality-report'
      
  frontend-quality:
    uses: ZhulongNT/fuck-u-code/.github/workflows/code-quality-analysis.yml@main
    with:
      path: './frontend'
      language: 'en-US'
      top-files: 5
      skip-index: true
      exclude-patterns: 'node_modules/** dist/** build/**'
      artifact-name: 'frontend-quality-report'
```

### Multiple Language Reports

```yaml
jobs:
  quality-en:
    uses: ZhulongNT/fuck-u-code/.github/workflows/code-quality-analysis.yml@main
    with:
      language: 'en-US'
      artifact-name: 'quality-report-english'
      
  quality-zh:
    uses: ZhulongNT/fuck-u-code/.github/workflows/code-quality-analysis.yml@main
    with:
      language: 'zh-CN'
      artifact-name: 'quality-report-chinese'
```

## Input Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | string | `'.'` | Path to analyze (relative to repository root) |
| `language` | string | `'en-US'` | Report language (`zh-CN` or `en-US`) |
| `top-files` | number | `5` | Number of top problematic files to show |
| `max-issues` | number | `5` | Maximum issues to show per file |
| `verbose` | boolean | `false` | Enable verbose output |
| `summary-only` | boolean | `false` | Show only summary, skip details |
| `exclude-patterns` | string | `''` | Space-separated exclude patterns |
| `skip-index` | boolean | `false` | Skip index.js/index.ts files |
| `artifact-name` | string | `'code-quality-report'` | Name for the artifact |

## Output

### Artifacts

The workflow automatically uploads a markdown report as a GitHub artifact with the specified name. The artifact contains:

- **Overall Assessment**: Quality score, level, and basic statistics
- **Quality Metrics Table**: Detailed breakdown of all quality metrics
- **Problem Files**: Top problematic files with specific issues
- **Improvement Suggestions**: Actionable recommendations

### Job Summary

Key metrics are also displayed directly in the GitHub Actions job summary for quick review.

## Example Report Content

```markdown
# 🌸 Code Quality Analysis Report 🌸

## Overall Assessment

- **Quality Score**: 41.05/100
- **Quality Level**: 😷 Code reeks, mask up - Code is starting to stink
- **Analyzed Files**: 25
- **Total Lines**: 7767

## Quality Metrics

| Metric | Score | Weight | Status |
|------|------|------|------|
| Naming Convention | 0.00 | 0.08 | ✓✓ |
| Error Handling | 25.00 | 0.10 | ✓ |
| Comment Ratio | 25.92 | 0.15 | ✓ |
| Code Duplication | 35.00 | 0.15 | ○ |
| Cyclomatic Complexity | 81.88 | 0.30 | !! |

## Problem Files (Top 5)

### 1. path/to/problematic/file.go (Score: 49.56)
**Issue Categories**: 🔄 Complexity Issues:2, 📝 Comment Issues:1

**Main Issues**:
- Function has very high cyclomatic complexity (23), consider refactoring
- Code comment ratio is low (8.60%), consider adding more comments
```

## Integration with Other Tools

### AI Code Review

The markdown format is perfect for AI-powered code review tools:

```yaml
- name: Download quality report
  uses: actions/download-artifact@v4
  with:
    name: code-quality-report
    
- name: AI Code Review
  run: |
    # Send the markdown report to your AI code review service
    curl -X POST "https://ai-review-service.com/analyze" \
         -H "Content-Type: text/markdown" \
         --data-binary @code-quality-report.md
```

### Slack Notifications

```yaml
- name: Send to Slack
  if: always()
  uses: actions/download-artifact@v4
  with:
    name: code-quality-report
    
- name: Notify Slack
  run: |
    SUMMARY=$(head -20 code-quality-report.md)
    curl -X POST -H 'Content-type: application/json' \
         --data "{\"text\":\"Code Quality Report:\n\`\`\`\n$SUMMARY\n\`\`\`\"}" \
         ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Quality Gates

```yaml
- name: Quality Gate
  run: |
    SCORE=$(grep "Quality Score" code-quality-report.md | grep -o '[0-9]*\.[0-9]*')
    echo "Quality Score: $SCORE"
    if (( $(echo "$SCORE > 80" | bc -l) )); then
      echo "❌ Quality gate failed! Score too high: $SCORE"
      exit 1
    else
      echo "✅ Quality gate passed! Score: $SCORE"
    fi
```

## Troubleshooting

### Common Issues

1. **Build failures**: Ensure your repository has the necessary dependencies
2. **Permission errors**: Make sure the workflow has read access to your repository
3. **Large repositories**: Consider using exclude patterns to skip large dependency directories

### Debug Mode

Enable verbose output for debugging:

```yaml
with:
  verbose: true
  language: 'en-US'  # English reports are often clearer for debugging
```

## Contributing

This workflow is part of the fuck-u-code project. For issues or improvements:

1. Open an issue in the [fuck-u-code repository](https://github.com/ZhulongNT/fuck-u-code)
2. Create a pull request with your improvements
3. Follow the existing code style and conventions

## License

This workflow is provided under the same license as the fuck-u-code project (MIT).