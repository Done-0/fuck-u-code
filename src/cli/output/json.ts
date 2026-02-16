/**
 * JSON output formatter
 */

import type { ProjectAnalysisResult } from '../../metrics/types.js';
import { t } from '../../i18n/index.js';
import { VERSION } from '../../version.js';

export class JsonOutput {
  render(result: ProjectAnalysisResult): string {
    return JSON.stringify(
      {
        $schema: {
          version: VERSION,
          description: t('json_schema_description'),
          fields: {
            projectPath: t('json_field_projectPath'),
            overallScore: t('json_field_overallScore'),
            summary: {
              description: t('json_field_summary'),
              totalFiles: t('json_field_summary_totalFiles'),
              analyzedFiles: t('json_field_summary_analyzedFiles'),
              skippedFiles: t('json_field_summary_skippedFiles'),
              analysisTime: t('json_field_summary_analysisTime'),
            },
            aggregatedMetrics: {
              description: t('json_field_aggregatedMetrics'),
              name: t('json_field_aggregatedMetrics_name'),
              category: t('json_field_aggregatedMetrics_category'),
              average: t('json_field_aggregatedMetrics_average'),
              min: t('json_field_aggregatedMetrics_min'),
              max: t('json_field_aggregatedMetrics_max'),
              median: t('json_field_aggregatedMetrics_median'),
            },
            files: {
              description: t('json_field_files'),
              path: t('json_field_files_path'),
              score: t('json_field_files_score'),
              metrics: {
                description: t('json_field_files_metrics'),
                name: t('json_field_files_metrics_name'),
                category: t('json_field_files_metrics_category'),
                value: t('json_field_files_metrics_value'),
                normalizedScore: t('json_field_files_metrics_normalizedScore'),
                severity: t('json_field_files_metrics_severity'),
                details: t('json_field_files_metrics_details'),
              },
              parseResult: {
                description: t('json_field_files_parseResult'),
                language: t('json_field_files_parseResult_language'),
                totalLines: t('json_field_files_parseResult_totalLines'),
                codeLines: t('json_field_files_parseResult_codeLines'),
                commentLines: t('json_field_files_parseResult_commentLines'),
                functionCount: t('json_field_files_parseResult_functionCount'),
                classCount: t('json_field_files_parseResult_classCount'),
              },
            },
          },
          metricCategories: {
            complexity: t('json_category_complexity'),
            size: t('json_category_size'),
            duplication: t('json_category_duplication'),
            structure: t('json_category_structure'),
            error: t('json_category_error'),
            documentation: t('json_category_documentation'),
            naming: t('json_category_naming'),
          },
          severityLevels: {
            info: t('json_severity_info'),
            warning: t('json_severity_warning'),
            error: t('json_severity_error'),
            critical: t('json_severity_critical'),
          },
        },
        projectPath: result.projectPath,
        overallScore: result.overallScore,
        summary: {
          totalFiles: result.totalFiles,
          analyzedFiles: result.analyzedFiles,
          skippedFiles: result.skippedFiles,
          analysisTime: result.analysisTime,
        },
        aggregatedMetrics: result.aggregatedMetrics.map((m) => ({
          name: m.name,
          category: m.category,
          average: m.average,
          min: m.min,
          max: m.max,
          median: m.median,
        })),
        files: result.fileResults.map((f) => ({
          path: f.filePath,
          score: f.score,
          metrics: f.metrics.map((m) => ({
            name: m.name,
            category: m.category,
            value: m.value,
            normalizedScore: m.normalizedScore,
            severity: m.severity,
            details: m.details,
          })),
          parseResult: {
            language: f.parseResult.language,
            totalLines: f.parseResult.totalLines,
            codeLines: f.parseResult.codeLines,
            commentLines: f.parseResult.commentLines,
            functionCount: f.parseResult.functions.length,
            classCount: f.parseResult.classes.length,
          },
        })),
      },
      null,
      2
    );
  }
}
