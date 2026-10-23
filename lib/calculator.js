// Evaluator matematika aman (tanpa eval): + - * / % ^, kurung, fungsi & konstanta umum.
const FUNCTIONS = {
  sqrt: Math.sqrt, akar: Math.sqrt, abs: Math.abs, round: Math.round, floor: Math.floor, ceil: Math.ceil,
  sin: x => Math.sin(x * Math.PI / 180), cos: x => Math.cos(x * Math.PI / 180), tan: x => Math.tan(x * Math.PI / 180),
  log: Math.log10, ln: Math.log, exp: Math.exp,
};
const CONSTANTS = { pi: Math.PI, e: Math.E };
const MAX_LENGTH = 200;

function tokenize(input) {
  const source = String(input).toLowerCase()
    .replace(/×|x(?=\s*[\d(])/g, '*').replace(/÷|:/g, '/').replace(/,/g, '.').replace(/π/g, 'pi').replace(/√/g, 'sqrt');
  const tokens = [];
  const pattern = /\s*(?:(\d+(?:\.\d+)?(?:e[+-]?\d+)?)|([a-z]+)|(\*\*|[-+*/%^()!]))/y;
  let index = 0;
  while (index < source.length) {
    if (/\s/.test(source[index])) { index++; continue; }
    pattern.lastIndex = index;
    const match = pattern.exec(source);
    if (!match) throw new Error(`Karakter tidak dikenal: "${source[index]}"`);
    index = pattern.lastIndex;
    if (match[1]) tokens.push({ type: 'num', value: Number(match[1]) });
    else if (match[2]) tokens.push({ type: 'id', value: match[2] });
    else tokens.push({ type: 'op', value: match[3] === '**' ? '^' : match[3] });
  }
  return tokens;
}

function evaluate(input) {
  if (!String(input).trim()) throw new Error('Ekspresi kosong.');
  if (String(input).length > MAX_LENGTH) throw new Error(`Ekspresi maksimal ${MAX_LENGTH} karakter.`);
  const tokens = tokenize(input);
  let position = 0;
  const peek = () => tokens[position];
  const take = value => {
    const token = tokens[position];
    if (value !== undefined && token?.value !== value) throw new Error(`Diharapkan "${value}"`);
    position++;
    return token;
  };

  function primary() {
    const token = peek();
    if (!token) throw new Error('Ekspresi tidak lengkap.');
    if (token.type === 'num') { take(); return token.value; }
    if (token.value === '(') { take(); const value = expression(); take(')'); return value; }
    if (token.type === 'id') {
      take();
      if (CONSTANTS[token.value] !== undefined) return CONSTANTS[token.value];
      const fn = FUNCTIONS[token.value];
      if (!fn) throw new Error(`Fungsi "${token.value}" tidak dikenal.`);
      if (peek()?.value === '(') { take('('); const value = expression(); take(')'); return fn(value); }
      return fn(unary());
    }
    throw new Error(`Simbol "${token.value}" tidak terduga.`);
  }

  function postfix() {
    let value = primary();
    while (peek()?.value === '!' || peek()?.value === '%') {
      const op = take().value;
      if (op === '%') {
        // "50%" = 0.5, tetapi "10 % 3" = sisa bagi
        const next = peek();
        if (next && (next.type === 'num' || next.value === '(' || next.type === 'id')) { position--; break; }
        value /= 100;
      } else {
        if (!Number.isInteger(value) || value < 0 || value > 170) throw new Error('Faktorial hanya untuk bilangan bulat 0–170.');
        let result = 1;
        for (let i = 2; i <= value; i++) result *= i;
        value = result;
      }
    }
    return value;
  }

  function power() {
    const base = postfix();
    if (peek()?.value === '^') { take(); return base ** unary(); }
    return base;
  }

  function unary() {
    if (peek()?.value === '-') { take(); return -unary(); }
    if (peek()?.value === '+') { take(); return unary(); }
    return power();
  }

  function term() {
    let value = unary();
    while (['*', '/', '%'].includes(peek()?.value)) {
      const op = take().value;
      const right = unary();
      if ((op === '/' || op === '%') && right === 0) throw new Error('Tidak bisa dibagi nol.');
      value = op === '*' ? value * right : op === '/' ? value / right : value % right;
    }
    return value;
  }

  function expression() {
    let value = term();
    while (['+', '-'].includes(peek()?.value)) {
      const op = take().value;
      value = op === '+' ? value + term() : value - term();
    }
    return value;
  }

  const result = expression();
  if (position < tokens.length) throw new Error(`Simbol "${peek().value}" tidak terduga.`);
  if (!Number.isFinite(result)) throw new Error('Hasil tidak terdefinisi.');
  return Number.parseFloat(result.toPrecision(12));
}

module.exports = { evaluate, tokenize };
