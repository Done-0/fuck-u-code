/**
 * Tree-sitter AST-based parser
 * Uses web-tree-sitter WASM bindings for precise code analysis
 */

import Parser from 'web-tree-sitter';
import { resolve as pathResolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Parser as IParser, ParseResult, Language, FunctionInfo, ClassInfo } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Per-language AST node type configuration */
interface LanguageQueryConfig {
  wasmFile: string;
  functionNodeTypes: string[];
  classNodeTypes: string[];
  importNodeTypes: string[];
  complexityNodeTypes: string[];
  nestingNodeTypes: string[];
  commentNodeTypes: string[];
  functionNameField: string;
  functionParamsField: string;
  functionBodyField: string;
  classNameField: string;
  classBodyField: string;
  methodNodeTypes: string[];
  fieldNodeTypes: string[];
}

const LANG_CONFIGS: Record<string, LanguageQueryConfig> = {
  go: {
    wasmFile: 'tree-sitter-go.wasm',
    functionNodeTypes: ['function_declaration', 'method_declaration'],
    classNodeTypes: ['type_declaration'],
    importNodeTypes: ['import_declaration'],
    complexityNodeTypes: [
      'if_statement',
      'for_statement',
      'expression_switch_statement',
      'type_switch_statement',
      'select_statement',
      'expression_case',
      'type_case',
      'default_case',
    ],
    nestingNodeTypes: [
      'if_statement',
      'for_statement',
      'expression_switch_statement',
      'type_switch_statement',
      'select_statement',
      'func_literal',
    ],
    commentNodeTypes: ['comment'],
    functionNameField: 'name',
    functionParamsField: 'parameters',
    functionBodyField: 'body',
    classNameField: 'name',
    classBodyField: 'type',
    methodNodeTypes: ['method_declaration'],
    fieldNodeTypes: ['field_declaration'],
  },
  javascript: {
    wasmFile: 'tree-sitter-javascript.wasm',
    functionNodeTypes: [
      'function_declaration',
      'method_definition',
      'arrow_function',
      'generator_function_declaration',
    ],
    classNodeTypes: ['class_declaration'],
    importNodeTypes: ['import_statement'],
    complexityNodeTypes: [
      'if_statement',
      'for_statement',
      'for_in_statement',
      'while_statement',
      'do_statement',
      'switch_case',
      'catch_clause',
      'ternary_expression',
    ],
    nestingNodeTypes: [
      'if_statement',
      'for_statement',
      'for_in_statement',
      'while_statement',
      'do_statement',
      'switch_statement',
      'arrow_function',
      'function',
    ],
    commentNodeTypes: ['comment'],
    functionNameField: 'name',
    functionParamsField: 'parameters',
    functionBodyField: 'body',
    classNameField: 'name',
    classBodyField: 'body',
    methodNodeTypes: ['method_definition'],
    fieldNodeTypes: ['field_definition', 'public_field_definition'],
  },
  typescript: {
    wasmFile: 'tree-sitter-typescript.wasm',
    functionNodeTypes: [
      'function_declaration',
      'method_definition',
      'arrow_function',
      'generator_function_declaration',
    ],
    classNodeTypes: ['class_declaration', 'interface_declaration'],
    importNodeTypes: ['import_statement'],
    complexityNodeTypes: [
      'if_statement',
      'for_statement',
      'for_in_statement',
      'while_statement',
      'do_statement',
      'switch_case',
      'catch_clause',
      'ternary_expression',
    ],
    nestingNodeTypes: [
      'if_statement',
      'for_statement',
      'for_in_statement',
      'while_statement',
      'do_statement',
      'switch_statement',
      'arrow_function',
      'function',
    ],
    commentNodeTypes: ['comment'],
    functionNameField: 'name',
    functionParamsField: 'parameters',
    functionBodyField: 'body',
    classNameField: 'name',
    classBodyField: 'body',
    methodNodeTypes: ['method_definition', 'method_signature'],
    fieldNodeTypes: ['public_field_definition', 'property_signature'],
  },
  python: {
    wasmFile: 'tree-sitter-python.wasm',
    functionNodeTypes: ['function_definition'],
    classNodeTypes: ['class_definition'],
    importNodeTypes: ['import_statement', 'import_from_statement'],
    complexityNodeTypes: [
      'if_statement',
      'elif_clause',
      'for_statement',
      'while_statement',
      'except_clause',
      'with_statement',
      'conditional_expression',
      'boolean_operator',
    ],
    nestingNodeTypes: [
      'if_statement',
      'for_statement',
      'while_statement',
      'with_statement',
      'try_statement',
      'function_definition',
      'class_definition',
    ],
    commentNodeTypes: ['comment'],
    functionNameField: 'name',
    functionParamsField: 'parameters',
    functionBodyField: 'body',
    classNameField: 'name',
    classBodyField: 'body',
    methodNodeTypes: ['function_definition'],
    fieldNodeTypes: ['expression_statement'],
  },
  java: {
    wasmFile: 'tree-sitter-java.wasm',
    functionNodeTypes: ['method_declaration', 'constructor_declaration'],
    classNodeTypes: ['class_declaration', 'interface_declaration', 'enum_declaration'],
    importNodeTypes: ['import_declaration'],
    complexityNodeTypes: [
      'if_statement',
      'for_statement',
      'enhanced_for_statement',
      'while_statement',
      'do_statement',
      'switch_expression',
      'catch_clause',
      'ternary_expression',
    ],
    nestingNodeTypes: [
      'if_statement',
      'for_statement',
      'enhanced_for_statement',
      'while_statement',
      'do_statement',
      'switch_expression',
      'try_statement',
      'lambda_expression',
    ],
    commentNodeTypes: ['line_comment', 'block_comment'],
    functionNameField: 'name',
    functionParamsField: 'parameters',
    functionBodyField: 'body',
    classNameField: 'name',
    classBodyField: 'body',
    methodNodeTypes: ['method_declaration', 'constructor_declaration'],
    fieldNodeTypes: ['field_declaration'],
  },
  c: {
    wasmFile: 'tree-sitter-c.wasm',
    functionNodeTypes: ['function_definition'],
    classNodeTypes: ['struct_specifier', 'enum_specifier', 'union_specifier'],
    importNodeTypes: ['preproc_include'],
    complexityNodeTypes: [
      'if_statement',
      'for_statement',
      'while_statement',
      'do_statement',
      'case_statement',
      'conditional_expression',
    ],
    nestingNodeTypes: [
      'if_statement',
      'for_statement',
      'while_statement',
      'do_statement',
      'switch_statement',
    ],
    commentNodeTypes: ['comment'],
    functionNameField: 'declarator',
    functionParamsField: 'declarator',
    functionBodyField: 'body',
    classNameField: 'name',
    classBodyField: 'body',
    methodNodeTypes: [],
    fieldNodeTypes: ['field_declaration'],
  },
  cpp: {
    wasmFile: 'tree-sitter-cpp.wasm',
    functionNodeTypes: ['function_definition'],
    classNodeTypes: ['class_specifier', 'struct_specifier', 'enum_specifier'],
    importNodeTypes: ['preproc_include'],
    complexityNodeTypes: [
      'if_statement',
      'for_statement',
      'for_range_loop',
      'while_statement',
      'do_statement',
      'case_statement',
      'catch_clause',
      'conditional_expression',
    ],
    nestingNodeTypes: [
      'if_statement',
      'for_statement',
      'for_range_loop',
      'while_statement',
      'do_statement',
      'switch_statement',
      'try_statement',
      'lambda_expression',
    ],
    commentNodeTypes: ['comment'],
    functionNameField: 'declarator',
    functionParamsField: 'declarator',
    functionBodyField: 'body',
    classNameField: 'name',
    classBodyField: 'body',
    methodNodeTypes: ['function_definition'],
    fieldNodeTypes: ['field_declaration'],
  },
  rust: {
    wasmFile: 'tree-sitter-rust.wasm',
    functionNodeTypes: ['function_item'],
    classNodeTypes: ['struct_item', 'enum_item', 'impl_item', 'trait_item'],
    importNodeTypes: ['use_declaration'],
    complexityNodeTypes: [
      'if_expression',
      'for_expression',
      'while_expression',
      'loop_expression',
      'match_arm',
      'closure_expression',
    ],
    nestingNodeTypes: [
      'if_expression',
      'for_expression',
      'while_expression',
      'loop_expression',
      'match_expression',
      'closure_expression',
    ],
    commentNodeTypes: ['line_comment', 'block_comment'],
    functionNameField: 'name',
    functionParamsField: 'parameters',
    functionBodyField: 'body',
    classNameField: 'name',
    classBodyField: 'body',
    methodNodeTypes: ['function_item'],
    fieldNodeTypes: ['field_declaration'],
  },
  csharp: {
    wasmFile: 'tree-sitter-c_sharp.wasm',
    functionNodeTypes: [
      'method_declaration',
      'constructor_declaration',
      'local_function_statement',
    ],
    classNodeTypes: [
      'class_declaration',
      'interface_declaration',
      'struct_declaration',
      'enum_declaration',
    ],
    importNodeTypes: ['using_directive'],
    complexityNodeTypes: [
      'if_statement',
      'for_statement',
      'for_each_statement',
      'while_statement',
      'do_statement',
      'switch_section',
      'catch_clause',
      'conditional_expression',
    ],
    nestingNodeTypes: [
      'if_statement',
      'for_statement',
      'for_each_statement',
      'while_statement',
      'do_statement',
      'switch_statement',
      'try_statement',
      'lambda_expression',
    ],
    commentNodeTypes: ['comment'],
    functionNameField: 'name',
    functionParamsField: 'parameters',
    functionBodyField: 'body',
    classNameField: 'name',
    classBodyField: 'body',
    methodNodeTypes: ['method_declaration', 'constructor_declaration'],
    fieldNodeTypes: ['field_declaration', 'property_declaration'],
  },
  lua: {
    wasmFile: 'tree-sitter-lua.wasm',
    functionNodeTypes: ['function_definition_statement', 'local_function_definition_statement'],
    classNodeTypes: [],
    importNodeTypes: [],
    complexityNodeTypes: [
      'if_statement',
      'elseif_clause',
      'for_statement',
      'for_in_statement',
      'while_statement',
      'repeat_statement',
    ],
    nestingNodeTypes: [
      'if_statement',
      'for_statement',
      'for_in_statement',
      'while_statement',
      'repeat_statement',
      'function_definition_statement',
    ],
    commentNodeTypes: ['comment'],
    functionNameField: 'name',
    functionParamsField: 'parameters',
    functionBodyField: 'body',
    classNameField: 'name',
    classBodyField: 'body',
    methodNodeTypes: [],
    fieldNodeTypes: [],
  },
  php: {
    wasmFile: 'tree-sitter-php.wasm',
    functionNodeTypes: ['function_definition', 'method_declaration'],
    classNodeTypes: ['class_declaration'],
    importNodeTypes: ['namespace_use_declaration'],
    complexityNodeTypes: [
      'if_statement',
      'for_statement',
      'foreach_statement',
      'while_statement',
      'do_statement',
      'switch_statement',
      'case_statement',
      'catch_clause',
      'conditional_expression',
    ],
    nestingNodeTypes: [
      'if_statement',
      'for_statement',
      'foreach_statement',
      'while_statement',
      'do_statement',
      'switch_statement',
      'try_statement',
      'function_definition',
    ],
    commentNodeTypes: ['comment'],
    functionNameField: 'name',
    functionParamsField: 'parameters',
    functionBodyField: 'body',
    classNameField: 'name',
    classBodyField: 'declaration_list',
    methodNodeTypes: ['method_declaration'],
    fieldNodeTypes: ['property_declaration'],
  },
  ruby: {
    wasmFile: 'tree-sitter-ruby.wasm',
    functionNodeTypes: ['method'],
    classNodeTypes: ['class'],
    importNodeTypes: ['call'],
    complexityNodeTypes: [
      'if',
      'unless',
      'case',
      'when',
      'for',
      'while',
      'until',
      'rescue',
      'conditional',
    ],
    nestingNodeTypes: ['if', 'unless', 'case', 'for', 'while', 'until', 'begin', 'method'],
    commentNodeTypes: ['comment'],
    functionNameField: 'name',
    functionParamsField: 'parameters',
    functionBodyField: 'body',
    classNameField: 'constant',
    classBodyField: 'body',
    methodNodeTypes: ['method'],
    fieldNodeTypes: ['instance_variable'],
  },
  swift: {
    wasmFile: 'tree-sitter-swift.wasm',
    functionNodeTypes: ['function_declaration'],
    classNodeTypes: ['class_declaration', 'struct_declaration', 'protocol_declaration'],
    importNodeTypes: ['import_declaration'],
    complexityNodeTypes: [
      'if_statement',
      'guard_statement',
      'switch_statement',
      'switch_entry',
      'for_statement',
      'while_statement',
      'repeat_while_statement',
      'catch_clause',
      'ternary_expression',
    ],
    nestingNodeTypes: [
      'if_statement',
      'guard_statement',
      'switch_statement',
      'for_statement',
      'while_statement',
      'repeat_while_statement',
      'do_statement',
      'function_declaration',
    ],
    commentNodeTypes: ['comment', 'multiline_comment'],
    functionNameField: 'name',
    functionParamsField: 'parameters',
    functionBodyField: 'body',
    classNameField: 'name',
    classBodyField: 'body',
    methodNodeTypes: ['function_declaration'],
    fieldNodeTypes: ['property_declaration'],
  },
  shell: {
    wasmFile: 'tree-sitter-bash.wasm',
    functionNodeTypes: ['function_definition'],
    classNodeTypes: [],
    importNodeTypes: [],
    complexityNodeTypes: [
      'if_statement',
      'case_statement',
      'case_item',
      'for_statement',
      'while_statement',
      'until_statement',
      'elif_clause',
    ],
    nestingNodeTypes: [
      'if_statement',
      'case_statement',
      'for_statement',
      'while_statement',
      'until_statement',
      'function_definition',
      'subshell',
    ],
    commentNodeTypes: ['comment'],
    functionNameField: 'name',
    functionParamsField: 'body', // Shell functions don't have explicit parameters
    functionBodyField: 'body',
    classNameField: 'name',
    classBodyField: 'body',
    methodNodeTypes: [],
    fieldNodeTypes: [],
  },
};

function resolveWasmPath(wasmFile: string): string {
  return pathResolve(__dirname, '..', '..', 'node_modules', 'tree-sitter-wasms', 'out', wasmFile);
}

let parserInitialized = false;
const languageCache = new Map<string, Parser.Language>();

async function ensureParserInit(): Promise<void> {
  if (parserInitialized) return;
  await Parser.init();
  parserInitialized = true;
}

async function loadLanguage(wasmFile: string): Promise<Parser.Language> {
  const cached = languageCache.get(wasmFile);
  if (cached) return cached;
  const wasmPath = resolveWasmPath(wasmFile);
  const lang = await Parser.Language.load(wasmPath);
  languageCache.set(wasmFile, lang);
  return lang;
}

/**
 * Get the LanguageQueryConfig for a given language, or null if unsupported
 */
export function getLanguageConfig(language: Language): LanguageQueryConfig | null {
  return LANG_CONFIGS[language] ?? null;
}

/**
 * Tree-sitter AST-based parser.
 * Provides precise function/class extraction, complexity calculation,
 * and nesting depth analysis via real AST traversal.
 */
export class TreeSitterParser implements IParser {
  private language: Language;
  private config: LanguageQueryConfig;
  private parser: Parser | null = null;
  private initialized = false;

  constructor(language: Language, config: LanguageQueryConfig) {
    this.language = language;
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await ensureParserInit();
    const tsLang = await loadLanguage(this.config.wasmFile);
    this.parser = new Parser();
    this.parser.setLanguage(tsLang);
    this.initialized = true;
  }

  async parse(filePath: string, content: string): Promise<ParseResult> {
    if (!this.initialized || !this.parser) {
      await this.initialize();
    }

    if (!this.parser) {
      throw new Error('Parser initialization failed');
    }

    try {
      const tree = this.parser.parse(content);
      const rootNode = tree.rootNode;

      const functions = this.extractFunctions(rootNode);
      const classes = this.extractClasses(rootNode);
      const imports = this.extractImports(rootNode);
      const { commentLines, blankLines, codeLines, totalLines } = this.countLines(
        rootNode,
        content
      );

      tree.delete();

      return {
        filePath,
        language: this.language,
        totalLines,
        codeLines,
        commentLines,
        blankLines,
        functions,
        classes,
        imports,
        errors: [],
      };
    } catch (error) {
      throw new Error(
        `Tree-sitter parse failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  supportedLanguages(): Language[] {
    return Object.keys(LANG_CONFIGS) as Language[];
  }

  private countLines(
    rootNode: Parser.SyntaxNode,
    content: string
  ): { commentLines: number; blankLines: number; codeLines: number; totalLines: number } {
    const lines = content.split('\n');
    const totalLines = lines.length;

    const commentLineSet = new Set<number>();
    this.collectNodesByTypes(rootNode, this.config.commentNodeTypes, (node) => {
      for (let row = node.startPosition.row; row <= node.endPosition.row; row++) {
        commentLineSet.add(row);
      }
    });

    let blankLines = 0;
    let commentLines = 0;
    for (const [i, line] of lines.entries()) {
      const trimmed = line.trim();
      if (trimmed === '') {
        blankLines++;
      } else if (commentLineSet.has(i)) {
        commentLines++;
      }
    }

    const codeLines = totalLines - commentLines - blankLines;
    return { commentLines, blankLines, codeLines, totalLines };
  }

  private extractImports(rootNode: Parser.SyntaxNode): string[] {
    const imports: string[] = [];
    this.collectNodesByTypes(rootNode, this.config.importNodeTypes, (node) => {
      const stringNode =
        node.descendantsOfType('interpreted_string_literal')[0] ??
        node.descendantsOfType('string')[0] ??
        node.descendantsOfType('string_literal')[0] ??
        node.descendantsOfType('dotted_name')[0] ??
        node.descendantsOfType('scoped_identifier')[0] ??
        node.descendantsOfType('qualified_name')[0] ??
        node.descendantsOfType('identifier')[0] ??
        node.childForFieldName('path') ??
        node.childForFieldName('source') ??
        node.childForFieldName('name');
      if (stringNode) {
        const text = stringNode.text.replace(/^["'`]|["'`]$/g, '');
        if (text) imports.push(text);
      }
    });
    return imports;
  }

  private extractFunctions(rootNode: Parser.SyntaxNode): FunctionInfo[] {
    const functions: FunctionInfo[] = [];

    this.collectNodesByTypes(rootNode, this.config.functionNodeTypes, (node) => {
      const name = this.extractFunctionName(node);
      if (!name) return;

      const startLine = node.startPosition.row + 1;
      const endLine = node.endPosition.row + 1;
      const lineCount = endLine - startLine + 1;

      const parameterCount = this.countParameters(node);
      const bodyNode = node.childForFieldName(this.config.functionBodyField);
      const complexity = bodyNode ? this.calculateComplexity(bodyNode) + 1 : 1;
      const nestingDepth = bodyNode ? this.calculateMaxNesting(bodyNode, 0) : 0;
      const hasDocstring = this.hasDocstring(node);

      functions.push({
        name,
        startLine,
        endLine,
        lineCount,
        complexity,
        parameterCount,
        nestingDepth,
        hasDocstring,
      });
    });

    return functions;
  }

  private extractFunctionName(node: Parser.SyntaxNode): string | null {
    const nameNode = node.childForFieldName(this.config.functionNameField);
    if (nameNode) {
      // C/C++: name field points to function_declarator wrapping the identifier
      if (nameNode.type === 'function_declarator' || nameNode.type === 'pointer_declarator') {
        const inner = nameNode.childForFieldName('declarator') ?? nameNode.namedChildren[0];
        if (inner) {
          if (inner.type === 'qualified_identifier') {
            return inner.childForFieldName('name')?.text ?? inner.text;
          }
          return inner.text;
        }
      }
      return nameNode.text || null;
    }

    // Arrow functions / anonymous functions assigned to variables:
    // parent is variable_declarator with a name field
    const parent = node.parent;
    if (parent?.type === 'variable_declarator') {
      return parent.childForFieldName('name')?.text ?? null;
    }

    return null;
  }

  private extractClasses(rootNode: Parser.SyntaxNode): ClassInfo[] {
    const classes: ClassInfo[] = [];

    this.collectNodesByTypes(rootNode, this.config.classNodeTypes, (node) => {
      let name: string | null = null;
      let bodyNode: Parser.SyntaxNode | null = null;

      // Go: type_declaration wraps type_spec
      if (this.language === 'go' && node.type === 'type_declaration') {
        const typeSpec = node.namedChildren.find((c) => c.type === 'type_spec');
        if (typeSpec) {
          name = typeSpec.childForFieldName('name')?.text ?? null;
          bodyNode = typeSpec.childForFieldName('type');
        }
      } else {
        name = node.childForFieldName(this.config.classNameField)?.text ?? null;
        bodyNode = node.childForFieldName(this.config.classBodyField);
      }

      if (!name) return;

      const startLine = node.startPosition.row + 1;
      const endLine = node.endPosition.row + 1;

      let methodCount = 0;
      let fieldCount = 0;

      if (bodyNode) {
        // Scan body for methods and fields, recursing into wrapper nodes
        // (e.g., Go's field_declaration_list, Rust's declaration_list)
        const scan = (n: Parser.SyntaxNode): void => {
          for (const child of n.namedChildren) {
            if (this.config.methodNodeTypes.includes(child.type)) {
              methodCount++;
            } else if (this.config.fieldNodeTypes.includes(child.type)) {
              fieldCount++;
            } else if (
              child.type.includes('_list') ||
              child.type.includes('_body') ||
              child.type === 'declaration_list'
            ) {
              scan(child);
            }
          }
        };
        scan(bodyNode);
      }

      classes.push({ name, startLine, endLine, methodCount, fieldCount });
    });

    return classes;
  }

  private countParameters(funcNode: Parser.SyntaxNode): number {
    let paramsNode: Parser.SyntaxNode | null = null;

    if (this.config.functionParamsField === 'declarator') {
      // C/C++: parameters inside function_declarator
      const declarator = funcNode.childForFieldName('declarator');
      if (declarator) {
        paramsNode =
          declarator.childForFieldName('parameters') ??
          declarator.descendantsOfType('parameter_list')[0] ??
          null;
      }
    } else {
      paramsNode = funcNode.childForFieldName(this.config.functionParamsField);
    }

    if (!paramsNode) return 0;

    // Go: parameter_declaration can group multiple params (e.g., a, b int)
    // Count identifier children inside each declaration instead of counting declarations
    if (this.language === 'go') {
      let count = 0;
      for (const child of paramsNode.namedChildren) {
        if (
          child.type === 'parameter_declaration' ||
          child.type === 'variadic_parameter_declaration'
        ) {
          for (const inner of child.namedChildren) {
            if (inner.type === 'identifier') count++;
          }
        }
      }
      return count;
    }

    const paramTypes = new Set([
      'parameter_declaration',
      'parameter',
      'formal_parameter',
      'required_parameter',
      'optional_parameter',
      'rest_parameter',
      'typed_parameter',
      'typed_default_parameter',
      'default_parameter',
      'identifier',
      'variadic_parameter_declaration',
      'variadic_parameter',
      'spread_parameter',
    ]);

    let count = 0;
    for (const child of paramsNode.namedChildren) {
      if (paramTypes.has(child.type)) count++;
    }
    return count;
  }

  private hasDocstring(funcNode: Parser.SyntaxNode): boolean {
    const prev = funcNode.previousNamedSibling;
    if (prev && this.config.commentNodeTypes.includes(prev.type)) {
      const text = prev.text;
      if (
        text.startsWith('/**') ||
        text.startsWith('///') ||
        text.startsWith('"""') ||
        text.startsWith("'''") ||
        text.startsWith('--[')
      ) {
        return true;
      }
      // Single-line comment directly above
      if (prev.endPosition.row === funcNode.startPosition.row - 1) {
        return true;
      }
    }

    // Python docstring: string expression as first statement in body
    if (this.language === 'python') {
      const body = funcNode.childForFieldName('body');
      const firstStmt = body?.namedChildren[0];
      if (firstStmt?.type === 'expression_statement') {
        const expr = firstStmt.namedChildren[0];
        if (expr?.type === 'string') return true;
      }
    }

    return false;
  }

  private calculateComplexity(node: Parser.SyntaxNode): number {
    let complexity = 0;
    const complexitySet = new Set(this.config.complexityNodeTypes);

    const walk = (n: Parser.SyntaxNode): void => {
      if (complexitySet.has(n.type)) {
        // For binary/boolean operators, only count logical operators
        if (n.type === 'binary_expression' || n.type === 'boolean_operator') {
          const op = n.childForFieldName('operator')?.text ?? '';
          if (op === '&&' || op === '||' || op === 'and' || op === 'or') {
            complexity++;
          }
        } else {
          complexity++;
        }
      }

      for (const child of n.namedChildren) {
        // Don't recurse into nested function definitions
        if (!this.config.functionNodeTypes.includes(child.type)) {
          walk(child);
        }
      }
    };

    walk(node);
    return complexity;
  }

  private calculateMaxNesting(node: Parser.SyntaxNode, currentDepth: number): number {
    let maxDepth = currentDepth;
    const nestingSet = new Set(this.config.nestingNodeTypes);

    for (const child of node.namedChildren) {
      if (this.config.functionNodeTypes.includes(child.type)) continue;

      if (nestingSet.has(child.type)) {
        maxDepth = Math.max(maxDepth, this.calculateMaxNesting(child, currentDepth + 1));
      } else {
        maxDepth = Math.max(maxDepth, this.calculateMaxNesting(child, currentDepth));
      }
    }

    return maxDepth;
  }

  private collectNodesByTypes(
    rootNode: Parser.SyntaxNode,
    nodeTypes: string[],
    callback: (node: Parser.SyntaxNode) => void
  ): void {
    if (nodeTypes.length === 0) return;
    const typeSet = new Set(nodeTypes);

    const walk = (node: Parser.SyntaxNode): void => {
      if (typeSet.has(node.type)) {
        callback(node);
        // For comments, continue recursing; for functions/classes, don't
        if (
          this.config.commentNodeTypes.includes(node.type) ||
          this.config.importNodeTypes.includes(node.type)
        ) {
          for (const child of node.namedChildren) walk(child);
        }
        return;
      }
      for (const child of node.namedChildren) walk(child);
    };

    walk(rootNode);
  }
}
