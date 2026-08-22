/**
 * expression-parser.ts
 * Parser AST và Evaluator cực gọn cho biểu thức toán học và logic.
 * Không dùng eval(), không cho phép gọi hàm hoặc truy cập thuộc tính.
 */

export type Primitive = string | number | boolean | null;

interface Node {
  type: "literal" | "reference" | "binary" | "unary" | "group";
  value?: Primitive;
  key?: string;
  operator?: string;
  left?: Node;
  right?: Node;
  argument?: Node;
}

const MAX_EXPRESSION_LENGTH = 1000;
const MAX_NODES = 100;
const MAX_DEPTH = 10;

/**
 * Tokenizer đơn giản
 */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < input.length) {
    const char = input[i];
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    // Tham chiếu {key}
    if (char === "{") {
      let key = "";
      i++;
      while (i < input.length && input[i] !== "}") {
        key += input[i];
        i++;
      }
      tokens.push(`{${key}}`);
      i++;
      continue;
    }
    // String literal
    if (char === '"' || char === "'") {
      const quote = char;
      let str = "";
      i++;
      while (i < input.length && input[i] !== quote) {
        str += input[i];
        i++;
      }
      tokens.push(JSON.stringify(str));
      i++;
      continue;
    }
    // Số
    if (/\d/.test(char) || (char === "." && /\d/.test(input[i + 1] || ""))) {
      let numStr = "";
      while (i < input.length && /[\d.]/.test(input[i])) {
        numStr += input[i];
        i++;
      }
      tokens.push(numStr);
      continue;
    }
    // Toán tử đa ký tự
    const next2 = input.slice(i, i + 2);
    if (["==", "!=", "<=", ">=", "&&", "||"].includes(next2)) {
      tokens.push(next2);
      i += 2;
      continue;
    }
    // Toán tử đơn
    if ("+-*/()<>!".includes(char)) {
      tokens.push(char);
      i++;
      continue;
    }
    // Keywords
    const match = input.slice(i).match(/^(true|false|null)\b/);
    if (match) {
      tokens.push(match[1]);
      i += match[1].length;
      continue;
    }
    // Ký tự không hợp lệ -> chặn luôn từ tokenizer
    throw new Error(`Invalid character: ${char}`);
  }
  return tokens;
}

/**
 * Recursive Descent Parser
 */
class Parser {
  private tokens: string[];
  private pos = 0;
  private nodeCount = 0;

  constructor(tokens: string[]) {
    this.tokens = tokens;
  }

  parse(): Node {
    return this.parseExpression(0);
  }

  private parseExpression(depth: number): Node {
    if (depth > MAX_DEPTH) throw new Error("Expression too deep");
    return this.parseLogicalOr(depth);
  }

  private parseLogicalOr(depth: number): Node {
    let left = this.parseLogicalAnd(depth);
    while (this.match("||")) {
      const operator = "||";
      const right = this.parseLogicalAnd(depth);
      left = this.createBinary(left, operator, right);
    }
    return left;
  }

  private parseLogicalAnd(depth: number): Node {
    let left = this.parseEquality(depth);
    while (this.match("&&")) {
      const operator = "&&";
      const right = this.parseEquality(depth);
      left = this.createBinary(left, operator, right);
    }
    return left;
  }

  private parseEquality(depth: number): Node {
    let left = this.parseComparison(depth);
    while (this.match("==", "!=")) {
      const operator = this.tokens[this.pos - 1];
      const right = this.parseComparison(depth);
      left = this.createBinary(left, operator, right);
    }
    return left;
  }

  private parseComparison(depth: number): Node {
    let left = this.parseTerm(depth);
    while (this.match("<", "<=", ">", ">=")) {
      const operator = this.tokens[this.pos - 1];
      const right = this.parseTerm(depth);
      left = this.createBinary(left, operator, right);
    }
    return left;
  }

  private parseTerm(depth: number): Node {
    let left = this.parseFactor(depth);
    while (this.match("+", "-")) {
      const operator = this.tokens[this.pos - 1];
      const right = this.parseFactor(depth);
      left = this.createBinary(left, operator, right);
    }
    return left;
  }

  private parseFactor(depth: number): Node {
    let left = this.parseUnary(depth);
    while (this.match("*", "/")) {
      const operator = this.tokens[this.pos - 1];
      const right = this.parseUnary(depth);
      left = this.createBinary(left, operator, right);
    }
    return left;
  }

  private parseUnary(depth: number): Node {
    if (this.match("!", "-")) {
      const operator = this.tokens[this.pos - 1];
      const argument = this.parseUnary(depth + 1);
      return this.createUnary(operator, argument);
    }
    return this.parsePrimary(depth);
  }

  private parsePrimary(depth: number): Node {
    const token = this.tokens[this.pos++];
    if (!token) throw new Error("Unexpected end of expression");

    if (token === "(") {
      const node = this.parseExpression(depth + 1);
      if (!this.match(")")) throw new Error("Expected ')'");
      return { type: "group", argument: node };
    }

    if (token.startsWith("{")) {
      return { type: "reference", key: token.slice(1, -1) };
    }

    if (token.startsWith('"') || token.startsWith("'")) {
      return { type: "literal", value: JSON.parse(token) };
    }

    if (token === "true") return { type: "literal", value: true };
    if (token === "false") return { type: "literal", value: false };
    if (token === "null") return { type: "literal", value: null };

    const num = Number(token);
    if (!isNaN(num)) return { type: "literal", value: num };

    throw new Error(`Invalid token: ${token}`);
  }

  private match(...ops: string[]): boolean {
    if (this.pos < this.tokens.length && ops.includes(this.tokens[this.pos])) {
      this.pos++;
      return true;
    }
    return false;
  }

  private createBinary(left: Node, operator: string, right: Node): Node {
    this.checkNodes();
    return { type: "binary", left, operator, right };
  }

  private createUnary(operator: string, argument: Node): Node {
    this.checkNodes();
    return { type: "unary", operator, argument };
  }

  private checkNodes() {
    this.nodeCount++;
    if (this.nodeCount > MAX_NODES) throw new Error("Expression too complex");
  }
}

/**
 * Evaluator
 */
function evaluateNode(node: Node, context: Record<string, any>): any {
  switch (node.type) {
    case "literal":
      return node.value;
    case "reference":
      return context[node.key!] ?? null;
    case "group":
      return evaluateNode(node.argument!, context);
    case "unary": {
      const val = evaluateNode(node.argument!, context);
      if (node.operator === "!") return !val;
      if (node.operator === "-") return -val;
      return null;
    }
    case "binary": {
      const left = evaluateNode(node.left!, context);
      const right = evaluateNode(node.right!, context);
      switch (node.operator) {
        case "+": return left + right;
        case "-": return left - right;
        case "*": return left * right;
        case "/": return right === 0 ? null : left / right;
        case "==": return left == right;
        case "!=": return left != right;
        case "<": return left < right;
        case "<=": return left <= right;
        case ">": return left > right;
        case ">=": return left >= right;
        case "&&": return left && right;
        case "||": return left || right;
        default: return null;
      }
    }
  }
}

export function safeEvaluate(expr: string, context: Record<string, any>): any {
  if (!expr || expr.length > MAX_EXPRESSION_LENGTH) return null;
  try {
    const tokens = tokenize(expr);
    const parser = new Parser(tokens);
    const ast = parser.parse();
    return evaluateNode(ast, context);
  } catch (e) {
    console.warn("[SafeEvaluate Error]", e);
    return null;
  }
}
