import { describe, it, expect } from 'vitest';
import { TreeSitterParser, getLanguageConfig } from '../../src/parser/tree-sitter-parser.js';
import { detectLanguage, type Language } from '../../src/parser/types.js';

describe('detectLanguage', () => {
  it('should detect Go files', () => {
    expect(detectLanguage('main.go')).toBe('go');
    expect(detectLanguage('pkg/analyzer/analyzer.go')).toBe('go');
  });

  it('should detect JavaScript files', () => {
    expect(detectLanguage('index.js')).toBe('javascript');
    expect(detectLanguage('app.mjs')).toBe('javascript');
    expect(detectLanguage('config.cjs')).toBe('javascript');
    expect(detectLanguage('component.jsx')).toBe('javascript');
  });

  it('should detect TypeScript files', () => {
    expect(detectLanguage('index.ts')).toBe('typescript');
    expect(detectLanguage('component.tsx')).toBe('typescript');
    expect(detectLanguage('module.mts')).toBe('typescript');
    expect(detectLanguage('module.cts')).toBe('typescript');
  });

  it('should detect Python files', () => {
    expect(detectLanguage('main.py')).toBe('python');
    expect(detectLanguage('script.pyw')).toBe('python');
  });

  it('should detect Java files', () => {
    expect(detectLanguage('Main.java')).toBe('java');
  });

  it('should detect C files', () => {
    expect(detectLanguage('main.c')).toBe('c');
    expect(detectLanguage('header.h')).toBe('c');
  });

  it('should detect C++ files', () => {
    expect(detectLanguage('main.cpp')).toBe('cpp');
    expect(detectLanguage('main.cc')).toBe('cpp');
    expect(detectLanguage('main.cxx')).toBe('cpp');
    expect(detectLanguage('header.hpp')).toBe('cpp');
    expect(detectLanguage('header.hxx')).toBe('cpp');
  });

  it('should detect Rust files', () => {
    expect(detectLanguage('main.rs')).toBe('rust');
  });

  it('should detect C# files', () => {
    expect(detectLanguage('Program.cs')).toBe('csharp');
  });

  it('should detect Lua files', () => {
    expect(detectLanguage('init.lua')).toBe('lua');
  });

  it('should return unknown for unsupported extensions', () => {
    expect(detectLanguage('file.xyz')).toBe('unknown');
    expect(detectLanguage('README.md')).toBe('unknown');
    expect(detectLanguage('Makefile')).toBe('unknown');
  });

  it('should be case-insensitive for extensions', () => {
    expect(detectLanguage('Main.GO')).toBe('go');
    expect(detectLanguage('App.PY')).toBe('python');
  });
});

function createParser(lang: string) {
  const config = getLanguageConfig(lang as Language);
  if (!config) throw new Error(`No config for ${lang}`);
  return new TreeSitterParser(lang as Language, config);
}

describe('getLanguageConfig', () => {
  const supportedLanguages: Language[] = [
    'go', 'javascript', 'typescript', 'python', 'java',
    'c', 'cpp', 'rust', 'csharp', 'lua',
  ];

  it('should return config for all supported languages', () => {
    for (const lang of supportedLanguages) {
      const config = getLanguageConfig(lang);
      expect(config, `config for ${lang}`).not.toBeNull();
      expect(config!.wasmFile).toBeTruthy();
      expect(config!.functionNodeTypes.length).toBeGreaterThan(0);
      expect(config!.commentNodeTypes.length).toBeGreaterThan(0);
    }
  });

  it('should return null for unsupported languages', () => {
    expect(getLanguageConfig('unknown' as Language)).toBeNull();
    expect(getLanguageConfig('haskell' as Language)).toBeNull();
  });
});

describe('TreeSitterParser', () => {
  describe('Go parsing', () => {
    const parser = createParser('go');

    it('should parse Go functions with correct metadata', async () => {
      const code = `package main

func main() {
    fmt.Println("Hello")
}

func add(a, b int) int {
    return a + b
}
`;
      const result = await parser.parse('test.go', code);

      expect(result.language).toBe('go');
      expect(result.functions).toHaveLength(2);

      const mainFn = result.functions.find((f) => f.name === 'main')!;
      expect(mainFn).toBeDefined();
      expect(mainFn.parameterCount).toBe(0);
      expect(mainFn.complexity).toBeGreaterThanOrEqual(1);

      const addFn = result.functions.find((f) => f.name === 'add')!;
      expect(addFn).toBeDefined();
      expect(addFn.parameterCount).toBe(2);
      expect(addFn.lineCount).toBeGreaterThanOrEqual(3);
    });

    it('should parse Go method declarations', async () => {
      const code = `package main

type Server struct {
    port int
}

func (s *Server) Start() error {
    return nil
}

func (s *Server) Stop() {
}
`;
      const result = await parser.parse('test.go', code);

      expect(result.functions).toHaveLength(2);
      const names = result.functions.map((f) => f.name).sort();
      expect(names).toEqual(['Start', 'Stop']);
    });

    it('should parse Go structs with field counts', async () => {
      const code = `package main

type User struct {
    Name  string
    Email string
    Age   int
}

type Config struct {
    Host string
    Port int
}
`;
      const result = await parser.parse('test.go', code);

      expect(result.classes).toHaveLength(2);

      const user = result.classes.find((c) => c.name === 'User')!;
      expect(user).toBeDefined();
      expect(user.fieldCount).toBe(3);

      const config = result.classes.find((c) => c.name === 'Config')!;
      expect(config).toBeDefined();
      expect(config.fieldCount).toBe(2);
    });

    it('should calculate complexity for branching', async () => {
      const code = `package main

func complex(x int) string {
    if x > 0 {
        if x > 10 {
            return "big"
        }
        return "small"
    }
    for i := 0; i < x; i++ {
        switch i {
        case 1:
            return "one"
        case 2:
            return "two"
        default:
            return "other"
        }
    }
    return "negative"
}
`;
      const result = await parser.parse('test.go', code);

      expect(result.functions).toHaveLength(1);
      // Base 1 + 2 if + 1 for + 1 switch + 3 cases
      expect(result.functions[0]!.complexity).toBeGreaterThanOrEqual(5);
    });

    it('should detect nesting depth', async () => {
      const code = `package main

func nested() {
    if true {
        for i := 0; i < 10; i++ {
            if i > 5 {
                fmt.Println(i)
            }
        }
    }
}
`;
      const result = await parser.parse('test.go', code);

      expect(result.functions[0]!.nestingDepth).toBeGreaterThanOrEqual(3);
    });

    it('should detect Go docstrings', async () => {
      const code = `package main

// Add returns the sum of two integers.
func Add(a, b int) int {
    return a + b
}

func noDoc() {}
`;
      const result = await parser.parse('test.go', code);

      const addFn = result.functions.find((f) => f.name === 'Add')!;
      const noDocFn = result.functions.find((f) => f.name === 'noDoc')!;
      expect(addFn.hasDocstring).toBe(true);
      expect(noDocFn.hasDocstring).toBe(false);
    });

    it('should count lines correctly', async () => {
      const code = `// Comment line
package main

func main() {
    // Another comment
    fmt.Println("Hello")
}
`;
      const result = await parser.parse('test.go', code);

      expect(result.totalLines).toBe(8);
      expect(result.commentLines).toBe(2);
      expect(result.blankLines).toBeGreaterThanOrEqual(1);
      expect(result.codeLines).toBeGreaterThan(0);
    });

    it('should parse Go imports', async () => {
      const code = `package main

import "fmt"
import "os"
`;
      const result = await parser.parse('test.go', code);

      expect(result.imports.length).toBeGreaterThanOrEqual(1);
    });

    it('should parse grouped imports', async () => {
      const code = `package main

import (
    "fmt"
    "os"
    "strings"
)
`;
      const result = await parser.parse('test.go', code);

      expect(result.imports.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('JavaScript parsing', () => {
    const parser = createParser('javascript');

    it('should parse function declarations and arrow functions', async () => {
      const code = `function greet(name) {
    console.log("Hello, " + name);
}

const add = (a, b) => a + b;
`;
      const result = await parser.parse('test.js', code);

      expect(result.language).toBe('javascript');
      expect(result.functions.length).toBeGreaterThanOrEqual(2);
    });

    it('should parse classes with methods', async () => {
      const code = `class Calculator {
    add(a, b) {
        return a + b;
    }
    subtract(a, b) {
        return a - b;
    }
}
`;
      const result = await parser.parse('test.js', code);

      expect(result.classes).toHaveLength(1);
      expect(result.classes[0]!.name).toBe('Calculator');
      expect(result.classes[0]!.methodCount).toBe(2);
    });

    it('should calculate complexity for ternary and loops', async () => {
      const code = `function process(items) {
    for (let i = 0; i < items.length; i++) {
        if (items[i] > 0) {
            while (items[i] > 10) {
                items[i] = items[i] > 100 ? 100 : items[i];
            }
        }
    }
}
`;
      const result = await parser.parse('test.js', code);

      expect(result.functions[0]!.complexity).toBeGreaterThanOrEqual(4);
      expect(result.functions[0]!.nestingDepth).toBeGreaterThanOrEqual(3);
    });

    it('should parse import statements', async () => {
      const code = `import { readFile } from 'fs';
import path from 'path';

function main() {}
`;
      const result = await parser.parse('test.js', code);

      expect(result.imports.length).toBeGreaterThanOrEqual(1);
    });

    it('should count comment lines', async () => {
      const code = `// Single line comment
/* Block comment */
function foo() {
    // inline comment
    return 1;
}
`;
      const result = await parser.parse('test.js', code);

      expect(result.commentLines).toBeGreaterThanOrEqual(2);
    });
  });

  describe('TypeScript parsing', () => {
    const parser = createParser('typescript');

    it('should parse TypeScript with type annotations', async () => {
      const code = `function add(a: number, b: number): number {
    return a + b;
}

interface User {
    name: string;
    age: number;
}

class UserService {
    getUser(id: string): User {
        return { name: "test", age: 0 };
    }
}
`;
      const result = await parser.parse('test.ts', code);

      expect(result.language).toBe('typescript');
      expect(result.functions.length).toBeGreaterThanOrEqual(1);
      expect(result.classes.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect interfaces as classes', async () => {
      const code = `interface Config {
    host: string;
    port: number;
    debug: boolean;
}
`;
      const result = await parser.parse('test.ts', code);

      expect(result.classes).toHaveLength(1);
      expect(result.classes[0]!.name).toBe('Config');
    });

    it('should parse async functions', async () => {
      const code = `async function fetchData(url: string): Promise<string> {
    const response = await fetch(url);
    return response.text();
}
`;
      const result = await parser.parse('test.ts', code);

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0]!.name).toBe('fetchData');
      expect(result.functions[0]!.parameterCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Python parsing', () => {
    const parser = createParser('python');

    it('should parse Python functions and classes', async () => {
      const code = `def greet(name):
    print(f"Hello, {name}")

class Calculator:
    def add(self, a, b):
        return a + b

    def subtract(self, a, b):
        return a - b
`;
      const result = await parser.parse('test.py', code);

      expect(result.language).toBe('python');
      expect(result.functions.length).toBeGreaterThanOrEqual(1);
      expect(result.classes).toHaveLength(1);
      expect(result.classes[0]!.name).toBe('Calculator');
    });

    it('should detect Python docstrings', async () => {
      const code = `def documented():
    """This function has a docstring."""
    pass

def undocumented():
    pass
`;
      const result = await parser.parse('test.py', code);

      const docFn = result.functions.find((f) => f.name === 'documented');
      const noDocFn = result.functions.find((f) => f.name === 'undocumented');
      expect(docFn!.hasDocstring).toBe(true);
      expect(noDocFn!.hasDocstring).toBe(false);
    });

    it('should parse Python imports', async () => {
      const code = `import os
from pathlib import Path
`;
      const result = await parser.parse('test.py', code);

      expect(result.imports.length).toBeGreaterThanOrEqual(1);
    });

    it('should calculate complexity for Python branching', async () => {
      const code = `def process(data):
    if data:
        for item in data:
            if item > 0:
                while item > 10:
                    item -= 1
    elif not data:
        pass
`;
      const result = await parser.parse('test.py', code);

      expect(result.functions[0]!.complexity).toBeGreaterThanOrEqual(4);
      expect(result.functions[0]!.nestingDepth).toBeGreaterThanOrEqual(3);
    });

    it('should count Python comments', async () => {
      const code = `# This is a comment
# Another comment
def foo():
    # Inline comment
    pass
`;
      const result = await parser.parse('test.py', code);

      expect(result.commentLines).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Java parsing', () => {
    const parser = createParser('java');

    it('should parse Java methods and classes', async () => {
      const code = `public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }

    private void log(String msg) {
        System.out.println(msg);
    }
}
`;
      const result = await parser.parse('Test.java', code);

      expect(result.language).toBe('java');
      expect(result.classes).toHaveLength(1);
      expect(result.classes[0]!.name).toBe('Calculator');
      expect(result.classes[0]!.methodCount).toBe(2);
    });

    it('should parse Java imports', async () => {
      const code = `import java.util.List;
import java.io.File;

public class Main {
    public void run() {}
}
`;
      const result = await parser.parse('Main.java', code);

      expect(result.imports.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect Java comments', async () => {
      const code = `// Single line comment
/**
 * Javadoc comment
 */
public class Foo {
    /* block comment */
    public void bar() {}
}
`;
      const result = await parser.parse('Foo.java', code);

      expect(result.commentLines).toBeGreaterThanOrEqual(3);
    });
  });

  describe('C parsing', () => {
    const parser = createParser('c');

    it('should parse C functions and structs', async () => {
      const code = `#include <stdio.h>

struct Point {
    int x;
    int y;
};

int add(int a, int b) {
    return a + b;
}

void greet() {
    printf("Hello\\n");
}
`;
      const result = await parser.parse('test.c', code);

      expect(result.language).toBe('c');
      expect(result.functions.length).toBeGreaterThanOrEqual(2);
      expect(result.classes.length).toBeGreaterThanOrEqual(1);
      expect(result.imports.length).toBeGreaterThanOrEqual(1);
    });

    it('should count struct fields', async () => {
      const code = `struct Color {
    unsigned char r;
    unsigned char g;
    unsigned char b;
    unsigned char a;
};
`;
      const result = await parser.parse('test.c', code);

      expect(result.classes).toHaveLength(1);
      expect(result.classes[0]!.name).toBe('Color');
      expect(result.classes[0]!.fieldCount).toBe(4);
    });

    it('should parse C function parameters', async () => {
      const code = `int compute(int a, int b, int c) {
    return a + b + c;
}
`;
      const result = await parser.parse('test.c', code);

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0]!.name).toBe('compute');
      expect(result.functions[0]!.parameterCount).toBe(3);
    });
  });

  describe('C++ parsing', () => {
    const parser = createParser('cpp');

    it('should parse C++ functions and classes', async () => {
      const code = `#include <iostream>

class Shape {
public:
    virtual double area() {
        return 0.0;
    }
    void print() {
        std::cout << area() << std::endl;
    }
};

double compute(double x, double y) {
    return x * y;
}
`;
      const result = await parser.parse('test.cpp', code);

      expect(result.language).toBe('cpp');
      expect(result.functions.length).toBeGreaterThanOrEqual(1);
      expect(result.classes.length).toBeGreaterThanOrEqual(1);
    });

    it('should parse struct specifiers', async () => {
      const code = `struct Vec3 {
    float x;
    float y;
    float z;
};
`;
      const result = await parser.parse('test.cpp', code);

      expect(result.classes).toHaveLength(1);
      expect(result.classes[0]!.name).toBe('Vec3');
      expect(result.classes[0]!.fieldCount).toBe(3);
    });
  });

  describe('Rust parsing', () => {
    const parser = createParser('rust');

    it('should parse Rust functions and structs', async () => {
      const code = `fn main() {
    println!("Hello");
}

pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

struct Point {
    x: f64,
    y: f64,
}
`;
      const result = await parser.parse('test.rs', code);

      expect(result.language).toBe('rust');
      expect(result.functions).toHaveLength(2);
      expect(result.classes.length).toBeGreaterThanOrEqual(1);
      expect(result.classes[0]!.name).toBe('Point');
    });

    it('should parse Rust enums', async () => {
      const code = `enum Color {
    Red,
    Green,
    Blue,
}
`;
      const result = await parser.parse('test.rs', code);

      expect(result.classes).toHaveLength(1);
      expect(result.classes[0]!.name).toBe('Color');
    });

    it('should parse Rust use declarations', async () => {
      const code = `use std::io;
use std::collections::HashMap;

fn main() {}
`;
      const result = await parser.parse('test.rs', code);

      expect(result.imports.length).toBeGreaterThanOrEqual(1);
    });

    it('should calculate Rust complexity', async () => {
      const code = `fn process(x: i32) -> &str {
    if x > 0 {
        for i in 0..x {
            match i {
                1 => return "one",
                2 => return "two",
                _ => continue,
            }
        }
        "positive"
    } else {
        "negative"
    }
}
`;
      const result = await parser.parse('test.rs', code);

      expect(result.functions[0]!.complexity).toBeGreaterThanOrEqual(4);
      expect(result.functions[0]!.nestingDepth).toBeGreaterThanOrEqual(2);
    });

    it('should detect Rust doc comments', async () => {
      const code = `/// Adds two numbers together.
fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn no_doc() {}
`;
      const result = await parser.parse('test.rs', code);

      const addFn = result.functions.find((f) => f.name === 'add')!;
      const noDocFn = result.functions.find((f) => f.name === 'no_doc')!;
      expect(addFn.hasDocstring).toBe(true);
      expect(noDocFn.hasDocstring).toBe(false);
    });
  });

  describe('C# parsing', () => {
    const parser = createParser('csharp');

    it('should parse C# methods and classes', async () => {
      const code = `using System;

public class Calculator {
    public int Add(int a, int b) {
        return a + b;
    }

    public int Subtract(int a, int b) {
        return a - b;
    }
}
`;
      const result = await parser.parse('Calculator.cs', code);

      expect(result.language).toBe('csharp');
      expect(result.classes).toHaveLength(1);
      expect(result.classes[0]!.name).toBe('Calculator');
      expect(result.classes[0]!.methodCount).toBe(2);
    });

    it('should parse using directives as imports', async () => {
      const code = `using System;
using System.Collections.Generic;

class Foo {}
`;
      const result = await parser.parse('Foo.cs', code);

      expect(result.imports.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Lua parsing', () => {
    const parser = createParser('lua');

    it('should parse Lua functions', async () => {
      const code = `function greet(name)
    print("Hello, " .. name)
end

local function add(a, b)
    return a + b
end
`;
      const result = await parser.parse('test.lua', code);

      expect(result.language).toBe('lua');
      expect(result.functions.length).toBeGreaterThanOrEqual(1);
    });

    it('should have no classes for Lua', async () => {
      const code = `function foo()
    return 1
end
`;
      const result = await parser.parse('test.lua', code);

      expect(result.classes).toHaveLength(0);
    });

    it('should count Lua comments', async () => {
      const code = `-- This is a comment
-- Another comment
function foo()
    -- inline
    return 1
end
`;
      const result = await parser.parse('test.lua', code);

      expect(result.commentLines).toBeGreaterThanOrEqual(2);
    });
  });

  describe('edge cases', () => {
    const parser = createParser('go');

    it('should handle empty content', async () => {
      const result = await parser.parse('empty.go', '');

      expect(result.totalLines).toBe(1);
      expect(result.functions).toHaveLength(0);
      expect(result.classes).toHaveLength(0);
      expect(result.imports).toHaveLength(0);
    });

    it('should handle content with only comments', async () => {
      const code = `// This is a comment
// Another comment
/* Block comment */`;
      const result = await parser.parse('comments.go', code);

      expect(result.commentLines).toBe(3);
      expect(result.functions).toHaveLength(0);
    });

    it('should handle single-line file', async () => {
      const result = await parser.parse('single.go', 'package main');

      expect(result.totalLines).toBe(1);
      expect(result.functions).toHaveLength(0);
    });

    it('should handle file with only blank lines', async () => {
      const result = await parser.parse('blank.go', '\n\n\n');

      expect(result.totalLines).toBe(4);
      expect(result.blankLines).toBe(4);
      expect(result.codeLines).toBe(0);
    });

    it('should set filePath correctly', async () => {
      const result = await parser.parse('path/to/file.go', 'package main');

      expect(result.filePath).toBe('path/to/file.go');
    });

    it('should return empty errors array', async () => {
      const result = await parser.parse('test.go', 'package main');

      expect(result.errors).toEqual([]);
    });
  });

  describe('cross-language consistency', () => {
    const languages = ['go', 'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'rust', 'csharp', 'lua'];

    it('should return valid ParseResult structure for all languages', async () => {
      for (const lang of languages) {
        const parser = createParser(lang);
        const result = await parser.parse(`test.${lang}`, '');

        expect(result.language, `language field for ${lang}`).toBe(lang);
        expect(result.totalLines, `totalLines for ${lang}`).toBeGreaterThanOrEqual(1);
        expect(Array.isArray(result.functions), `functions array for ${lang}`).toBe(true);
        expect(Array.isArray(result.classes), `classes array for ${lang}`).toBe(true);
        expect(Array.isArray(result.imports), `imports array for ${lang}`).toBe(true);
        expect(Array.isArray(result.errors), `errors array for ${lang}`).toBe(true);
      }
    });

    it('should report supportedLanguages for all parsers', () => {
      for (const lang of languages) {
        const parser = createParser(lang);
        const supported = parser.supportedLanguages();
        expect(supported.length, `supportedLanguages for ${lang}`).toBeGreaterThan(0);
      }
    });
  });
});
