/**
 * Custom Assembly Studio - Compiler Coordinator
 * Orchestrates the full 7-stage compilation pipeline:
 * Source Code -> Lexical -> Syntax -> Semantic -> IR -> CodeGen -> Machine Code Loader
 */

import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { SemanticAnalyzer } from './semantic.js';
import { IRGenerator } from './ir-generator.js';
import { CodeGenerator } from './code-generator.js';

export class Compiler {
  constructor() {
    this.lastResult = null;
  }

  compile(sourceCode) {
    const startTime = performance.now();
    const rawLines = sourceCode.split('\n');

    // Stage 1: Lexical Analysis
    const lexer = new Lexer(sourceCode);
    const lexResult = lexer.tokenize();

    // Stage 2: Syntax Analysis (Parsing to AST)
    const parser = new Parser(lexResult.tokens, rawLines);
    const parseResult = parser.parse();

    // Stage 3: Semantic Analysis
    const semantic = new SemanticAnalyzer(parseResult.ast);
    const semanticResult = semantic.analyze();

    // Consolidate all errors & warnings
    const allErrors = [
      ...lexResult.errors.map(e => ({ stage: 'Lexical Analysis', ...e })),
      ...parseResult.errors.map(e => ({ stage: 'Syntax Analysis', ...e })),
      ...semanticResult.errors.map(e => ({ stage: 'Semantic Analysis', ...e }))
    ];

    const allWarnings = [
      ...parseResult.warnings.map(w => ({ stage: 'Syntax Analysis', ...w })),
      ...semanticResult.warnings.map(w => ({ stage: 'Semantic Analysis', ...w }))
    ];

    const isSuccess = allErrors.length === 0;

    // Stage 4: Intermediate Representation (IR)
    let irQuadruples = [];
    if (isSuccess || parseResult.ast.length > 0) {
      const irGen = new IRGenerator(parseResult.ast, semanticResult.symbolTable);
      irQuadruples = irGen.generate();
    }

    // Stage 5 & 6: Code Generation & Machine Code
    let codeGenResult = { instructions: [], binaryStream: [], totalBytes: 0 };
    if (isSuccess) {
      const codeGen = new CodeGenerator(parseResult.ast, semanticResult.symbolTable);
      codeGenResult = codeGen.generate();
    }

    const compileTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    this.lastResult = {
      success: isSuccess,
      sourceCode,
      rawLines,
      compileTimeMs,
      tokens: lexResult.tokens,
      ast: parseResult.ast,
      symbolTable: semanticResult.symbolTable,
      semanticLog: semanticResult.log,
      ir: irQuadruples,
      codeGen: codeGenResult,
      errors: allErrors,
      warnings: allWarnings,
      stageStatus: {
        sourceCode: { status: 'Success', details: `${rawLines.length} lines` },
        lexical: {
          status: lexResult.errors.length === 0 ? 'Success' : 'Failed',
          details: `${lexResult.tokens.length} tokens generated`
        },
        syntax: {
          status: parseResult.errors.length === 0 ? 'Success' : 'Failed',
          details: `${parseResult.ast.length} AST nodes constructed`
        },
        semantic: {
          status: semanticResult.errors.length === 0 ? 'Success' : 'Failed',
          details: `${semanticResult.symbolTable.length} symbols resolved`
        },
        ir: {
          status: isSuccess ? 'Success' : 'Failed',
          details: `${irQuadruples.length} quadruples generated`
        },
        codeGen: {
          status: isSuccess ? 'Success' : 'Failed',
          details: `${codeGenResult.instructions.length} machine instructions`
        },
        machineCode: {
          status: isSuccess ? 'Success' : 'Failed',
          details: `${codeGenResult.totalBytes} bytes binary output`
        }
      }
    };

    return this.lastResult;
  }
}
