// _tmp/runtime/node_modules/@tangent.to/ode/dist/index.js
var Xt = Object.defineProperty;
var p = (s, a) => Xt(s, "name", { value: a, configurable: true });
function ot(s) {
  if (typeof s == "number") return { y: Float64Array.of(s), scalar: true };
  if (Array.isArray(s) || ArrayBuffer.isView(s)) {
    if (s.length === 0) throw new Error("y0 must be a non-empty array or a number");
    return { y: Float64Array.from(s), scalar: false };
  }
  throw new Error("y0 must be a number or an array of numbers");
}
p(ot, "normalizeState");
function nt(s, a) {
  return (o, t) => {
    let n = s(o, Array.from(t)), e = typeof n == "number" ? [n] : n;
    if (!e || e.length !== a) throw new Error(`f(t, y) must return ${a} value(s), got ${e?.length}`);
    let r = new Float64Array(a);
    for (let i = 0; i < a; i++) if (r[i] = e[i], !Number.isFinite(r[i])) throw new Error(`f(t, y) returned a non-finite value at component ${i} (t=${o})`);
    return r;
  };
}
p(nt, "wrapRhs");
function ut(s, a, o, t, n) {
  let e = s.length, r = 0;
  for (let i = 0; i < e; i++) {
    let f = t + n * Math.max(Math.abs(a[i]), Math.abs(o[i])), c = s[i] / f;
    r += c * c;
  }
  return Math.sqrt(r / e);
}
p(ut, "errorNorm");
function mt(s, a, o, t, n, e, r, i) {
  let f = o.length, c = 0, u = 0;
  for (let m = 0; m < f; m++) {
    let w = e + r * Math.abs(o[m]);
    c += (o[m] / w) ** 2, u += (t[m] / w) ** 2;
  }
  c = Math.sqrt(c / f), u = Math.sqrt(u / f);
  let d = c < 1e-5 || u < 1e-5 ? 1e-6 : 0.01 * (c / u), v = new Float64Array(f);
  for (let m = 0; m < f; m++) v[m] = o[m] + i * d * t[m];
  let l = s(a + i * d, v), y = 0;
  for (let m = 0; m < f; m++) {
    let w = e + r * Math.abs(o[m]);
    y += ((l[m] - t[m]) / w) ** 2;
  }
  y = Math.sqrt(y / f) / d;
  let h = Math.max(u, y), b = h <= 1e-15 ? Math.max(1e-6, d * 1e-3) : (0.01 / h) ** (1 / (n + 1));
  return i * Math.min(100 * d, b);
}
p(mt, "initialStep");
function rt(s, a, o, t) {
  let n = a.length ? a[0].length : 0, e = [];
  for (let r = 0; r < n; r++) e.push(s.map((i, f) => a[f][r]));
  return { t: s.slice(), y: o ? e[0] ?? [] : e, ...t };
}
p(rt, "makeResult");
var zt = [0, 1 / 5, 3 / 10, 4 / 5, 8 / 9, 1, 1];
var Dt = [[], [1 / 5], [3 / 40, 9 / 40], [44 / 45, -56 / 15, 32 / 9], [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729], [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656], [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84]];
var _t = [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84, 0];
var Bt = [71 / 57600, 0, -71 / 16695, 71 / 1920, -17253 / 339200, 22 / 525, -1 / 40];
var ht = 4;
function yt(s, a, o, t = {}) {
  let n = t.rtol ?? 1e-6, e = t.atol ?? 1e-9, r = t.maxStep ?? 1 / 0, i = t.maxSteps ?? 1e5, [f, c] = a, u = c >= f ? 1 : -1, { y: d, scalar: v } = ot(o), l = d.length, y = nt(s, l), h = t.events ? Array.isArray(t.events) ? t.events : [t.events] : [], b = p((q, k) => h.map((g) => g(q, Array.from(k))), "evalG"), m = t.tEval ? t.tEval.slice() : null;
  if (m) {
    for (let q of m) if (u * (q - f) < -1e-12 || u * (q - c) > 1e-12) throw new Error(`tEval point ${q} is outside tSpan [${f}, ${c}]`);
  }
  let w = f, x = Float64Array.from(d), F = y(w, x), P = 1, M = t.firstStep !== void 0 ? Math.abs(t.firstStep) * u : mt(y, w, x, F, ht, e, n, u), I = Array.from({ length: 7 }, () => new Float64Array(l)), U = new Float64Array(l), S = new Float64Array(l), Q = new Float64Array(l), Y = [], J = [], D = 0;
  m || (Y.push(w), J.push(Float64Array.from(x)));
  let R = h.map(() => []), _ = h.length ? b(w, x) : null, L = 0.9, ct = 0.2, et = 10, B = 1e-4, X = 0;
  function V(q, k, g, N, E) {
    let O = new Float64Array(l);
    for (let C = 0; C < l; C++) {
      let z = 0;
      for (let T = 0; T < 7; T++) {
        let Z = Jt[T], K = E * (Z[0] + E * (Z[1] + E * (Z[2] + E * Z[3])));
        z += g[T][C] * K;
      }
      O[C] = k[C] + N * z;
    }
    return O;
  }
  p(V, "interpolate");
  function G(q, k, g, N, E, O) {
    if (!h.length) return;
    let C = b(E, O);
    for (let z = 0; z < h.length; z++) {
      let T = _[z], Z = C[z];
      if (T === 0) R[z].push({ t: q, y: Array.from(k) });
      else if (T < 0 != Z < 0) {
        let K = 0, A = 1, st = T;
        for (let Rt = 0; Rt < 60; Rt++) {
          let ft = 0.5 * (K + A), Lt = V(q, k, g, N, ft), Et = h[z](q + ft * N, Array.from(Lt));
          if (Et === 0 || A - K < 1e-14) {
            K = A = ft;
            break;
          }
          st < 0 != Et < 0 ? A = ft : (K = ft, st = Et);
        }
        let tt = 0.5 * (K + A), Tt = V(q, k, g, N, tt);
        R[z].push({ t: q + tt * N, y: Array.from(Tt) });
      }
    }
    _ = C;
  }
  for (p(G, "recordEvents"); u * (w - c) < 0; ) {
    if (X++ > i) return j(false, `exceeded maxSteps (${i})`);
    let q = Math.min(Math.abs(M), r, Math.abs(c - w));
    if (q < 1e-14 * Math.max(1, Math.abs(w))) return j(false, "step size underflow");
    M = q * u;
    for (let g = 0; g < l; g++) I[0][g] = F[g];
    for (let g = 1; g < 7; g++) {
      for (let E = 0; E < l; E++) {
        let O = 0;
        for (let C = 0; C < g; C++) O += Dt[g][C] * I[C][E];
        U[E] = x[E] + M * O;
      }
      let N = y(w + zt[g] * M, U);
      P++, I[g] = N;
    }
    for (let g = 0; g < l; g++) {
      let N = 0, E = 0;
      for (let O = 0; O < 7; O++) N += _t[O] * I[O][g], E += Bt[O] * I[O][g];
      S[g] = x[g] + M * N, Q[g] = M * E;
    }
    let k = ut(Q, x, S, e, n);
    if (k <= 1) {
      let g = w, N = x, E = m || h.length ? I.map((z) => Float64Array.from(z)) : null, O = y(w + M, S);
      if (P++, m) for (; D < m.length && u * (m[D] - (g + M)) <= 1e-12 && u * (m[D] - g) >= -1e-12; ) {
        let z = M === 0 ? 0 : (m[D] - g) / M;
        Y.push(m[D]), J.push(V(g, N, E, M, z)), D++;
      }
      G(g, N, E, M, g + M, S), w = g + M, x = S, S = N, F = O, m || (Y.push(w), J.push(Float64Array.from(x)));
      let C = k === 0 ? et : Math.min(et, L * k ** (-0.7 / (ht + 1)) * B ** (0.4 / (ht + 1)));
      B = Math.max(k, 1e-10), M = q * Math.max(ct, C) * u;
    } else {
      let g = Math.max(ct, L * k ** (-1 / (ht + 1)));
      M = q * g * u;
    }
  }
  return j(true, "integration successful");
  function j(q, k) {
    let g = { success: q, message: k, nfev: P, nsteps: X };
    return h.length && (g.events = R.map((N) => ({ t: N.map((E) => E.t), y: v ? N.map((E) => E.y[0]) : N.map((E) => E.y) }))), rt(Y, J, v, g);
  }
}
p(yt, "rk45");
var Jt = [[1, -8048581381 / 2820520608, 8663915743 / 2820520608, -12715105075 / 11282082432], [0, 0, 0, 0], [0, 131558114200 / 32700410799, -68118460800 / 10900136933, 87487479700 / 32700410799], [0, -1754552775 / 470086768, 14199869525 / 1410260304, -10690763975 / 1880347072], [0, 127303824393 / 49829197408, -318862633887 / 49829197408, 701980252875 / 199316789632], [0, -282668133 / 205662961, 2019193451 / 616988883, -1453857185 / 822651844], [0, 40617522 / 29380423, -110615467 / 29380423, 69997945 / 29380423]];
var Ut = Object.defineProperty;
var $ = p((s, a) => Ut(s, "name", { value: a, configurable: true }), "w");
function H(s, a = "A") {
  if (!Array.isArray(s) || s.length === 0 || !Array.isArray(s[0])) throw new Error(`${a} must be a non-empty array of rows`);
  let o = s.length, t = s[0].length;
  if (t === 0) throw new Error(`${a} must have at least one column`);
  let n = new Float64Array(o * t);
  for (let e = 0; e < o; e++) {
    let r = s[e];
    if (!Array.isArray(r) || r.length !== t) throw new Error(`${a} is not rectangular (row ${e} has length ${r?.length}, expected ${t})`);
    for (let i = 0; i < t; i++) n[e * t + i] = r[i];
  }
  return { data: n, m: o, n: t };
}
p(H, "M");
$(H, "fromNested");
function W(s, a, o) {
  let t = new Array(a);
  for (let n = 0; n < a; n++) {
    let e = new Array(o);
    for (let r = 0; r < o; r++) e[r] = s[n * o + r];
    t[n] = e;
  }
  return t;
}
p(W, "F");
$(W, "toNested");
function lt(s, a, o = "b") {
  if (!Array.isArray(s) || s.length !== a) throw new Error(`${o} must be an array of length ${a} (got ${s?.length})`);
  return Float64Array.from(s);
}
p(lt, "j");
$(lt, "vecFrom");
function St(s, a, o = 1e-10) {
  let { data: t, m: n, n: e } = s;
  if (n !== e) throw new Error(`${a}: matrix must be square (got ${n}x${e})`);
  let r = 0;
  for (let f = 0; f < t.length; f++) r = Math.max(r, Math.abs(t[f]));
  let i = o * Math.max(1, r);
  for (let f = 0; f < e; f++) for (let c = f + 1; c < e; c++) if (Math.abs(t[f * e + c] - t[c * e + f]) > i) throw new Error(`${a}: matrix is not symmetric (A[${f}][${c}] != A[${c}][${f}])`);
}
p(St, "B");
$(St, "assertSymmetric");
function it(s, a) {
  let o = Float64Array.from(s), t = new Int32Array(a), n = new Float64Array(a), e = 0;
  for (let c = 0; c < o.length; c++) e = Math.max(e, Math.abs(o[c]));
  let r = 1e-13 * e, i = 1, f = e === 0;
  for (let c = 0; c < a; c++) {
    t[c] = c;
    let u = 0;
    for (let d = 0; d < a; d++) u = Math.max(u, Math.abs(o[c * a + d]));
    n[c] = u;
  }
  for (let c = 0; c < a; c++) {
    let u = c, d = -1;
    for (let l = c; l < a; l++) {
      let y = n[l] > 0 ? Math.abs(o[l * a + c]) / n[l] : 0;
      y > d && (d = y, u = l);
    }
    if (u !== c) {
      for (let h = 0; h < a; h++) {
        let b = o[c * a + h];
        o[c * a + h] = o[u * a + h], o[u * a + h] = b;
      }
      let l = n[c];
      n[c] = n[u], n[u] = l;
      let y = t[c];
      t[c] = t[u], t[u] = y, i = -i;
    }
    let v = o[c * a + c];
    if (Math.abs(v) <= r) {
      f = true;
      continue;
    }
    for (let l = c + 1; l < a; l++) {
      let y = o[l * a + c] / v;
      o[l * a + c] = y;
      for (let h = c + 1; h < a; h++) o[l * a + h] -= y * o[c * a + h];
    }
  }
  return { a: o, perm: t, sign: i, singular: f };
}
p(it, "O");
$(it, "luDecompose");
function at(s, a) {
  let o = H(s, "A");
  if (o.m !== o.n) throw new Error(`${a}: matrix must be square (got ${o.m}x${o.n})`);
  return o;
}
p(at, "V");
$(at, "squareFromNested");
function Yt(s) {
  let { data: a, n: o } = at(s, "lu"), { a: t, perm: n } = it(a, o), e = new Float64Array(o * o), r = new Float64Array(o * o), i = new Float64Array(o * o);
  for (let f = 0; f < o; f++) {
    e[f * o + f] = 1, i[f * o + n[f]] = 1;
    for (let c = 0; c < f; c++) e[f * o + c] = t[f * o + c];
    for (let c = f; c < o; c++) r[f * o + c] = t[f * o + c];
  }
  return { L: W(e, o, o), U: W(r, o, o), P: W(i, o, o) };
}
p(Yt, "G");
$(Yt, "lu");
function $t(s) {
  let { data: a, n: o } = at(s, "luFactor"), { a: t, perm: n, sign: e, singular: r } = it(a, o);
  return { lu: t, perm: n, n: o, sign: e, singular: r };
}
p($t, "H");
$($t, "luFactor");
function kt(s, a) {
  let { lu: o, perm: t, n } = s, e = new Float64Array(n);
  for (let r = 0; r < n; r++) e[r] = a[t[r]];
  return At(o, t, n, e), e;
}
p(kt, "J");
$(kt, "luFactorSolve");
function At(s, a, o, t) {
  for (let n = 1; n < o; n++) {
    let e = t[n];
    for (let r = 0; r < n; r++) e -= s[n * o + r] * t[r];
    t[n] = e;
  }
  for (let n = o - 1; n >= 0; n--) {
    let e = t[n];
    for (let r = n + 1; r < o; r++) e -= s[n * o + r] * t[r];
    t[n] = e / s[n * o + n];
  }
}
p(At, "X");
$(At, "luSolveInPlace");
function It(s, a) {
  let { data: o, n: t } = at(s, "solve"), { a: n, perm: e, singular: r } = it(o, t);
  if (r) throw new Error("solve: matrix is singular (pivot below tolerance)");
  if (!(Array.isArray(a) && Array.isArray(a[0]))) {
    let d = lt(a, t, "b"), v = new Float64Array(t);
    for (let l = 0; l < t; l++) v[l] = d[e[l]];
    return At(n, e, t, v), Array.from(v);
  }
  let i = H(a, "b");
  if (i.m !== t) throw new Error(`solve: b must have ${t} rows (got ${i.m})`);
  let f = i.n, c = new Float64Array(t * f), u = new Float64Array(t);
  for (let d = 0; d < f; d++) {
    for (let v = 0; v < t; v++) u[v] = i.data[e[v] * f + d];
    At(n, e, t, u);
    for (let v = 0; v < t; v++) c[v * f + d] = u[v];
  }
  return W(c, t, f);
}
p(It, "_");
$(It, "solve");
function Vt(s) {
  let { data: a, n: o } = at(s, "det"), { a: t, sign: n, singular: e } = it(a, o);
  if (e) return 0;
  let r = n;
  for (let i = 0; i < o; i++) r *= t[i * o + i];
  return r;
}
p(Vt, "K");
$(Vt, "det");
function Ht(s) {
  let a = at(s, "inv").n, o = new Array(a);
  for (let t = 0; t < a; t++) {
    let n = new Array(a).fill(0);
    n[t] = 1, o[t] = n;
  }
  return It(s, o);
}
p(Ht, "T");
$(Ht, "inv");
function Ct(s) {
  let a = H(s, "A");
  St(a, "cholesky");
  let { data: o, n: t } = a, n = new Float64Array(t * t);
  for (let e = 0; e < t; e++) {
    let r = o[e * t + e];
    for (let f = 0; f < e; f++) r -= n[e * t + f] * n[e * t + f];
    if (r <= 0) throw new Error(`cholesky: matrix is not positive definite (pivot ${e} is ${r})`);
    let i = Math.sqrt(r);
    n[e * t + e] = i;
    for (let f = e + 1; f < t; f++) {
      let c = o[f * t + e];
      for (let u = 0; u < e; u++) c -= n[f * t + u] * n[e * t + u];
      n[f * t + e] = c / i;
    }
  }
  return W(n, t, t);
}
p(Ct, "z");
$(Ct, "cholesky");
function Qt(s, a) {
  let o = H(s, "L");
  if (o.m !== o.n) throw new Error(`choleskySolve: L must be square (got ${o.m}x${o.n})`);
  let { data: t, n } = o, e = lt(a, n, "b");
  for (let r = 0; r < n; r++) {
    let i = e[r];
    for (let f = 0; f < r; f++) i -= t[r * n + f] * e[f];
    e[r] = i / t[r * n + r];
  }
  for (let r = n - 1; r >= 0; r--) {
    let i = e[r];
    for (let f = r + 1; f < n; f++) i -= t[f * n + r] * e[f];
    e[r] = i / t[r * n + r];
  }
  return Array.from(e);
}
p(Qt, "Y");
$(Qt, "choleskySolve");
function Gt(s) {
  try {
    return Ct(s), true;
  } catch {
    return false;
  }
}
p(Gt, "Z");
$(Gt, "isPositiveDefinite");
function Nt(s, a, o) {
  let t = Math.min(a, o), n = new Array(t), e = new Float64Array(t);
  for (let r = 0; r < t; r++) {
    let i = 0;
    for (let l = r; l < a; l++) {
      let y = s[l * o + r];
      i += y * y;
    }
    i = Math.sqrt(i);
    let f = new Float64Array(a - r);
    if (n[r] = f, i === 0) {
      e[r] = 0;
      continue;
    }
    let c = s[r * o + r], u = c >= 0 ? 1 : -1;
    f[0] = c + u * i;
    for (let l = r + 1; l < a; l++) f[l - r] = s[l * o + r];
    let d = 0;
    for (let l = 0; l < f.length; l++) d += f[l] * f[l];
    let v = 2 / d;
    e[r] = v;
    for (let l = r + 1; l < o; l++) {
      let y = 0;
      for (let h = r; h < a; h++) y += f[h - r] * s[h * o + l];
      y *= v;
      for (let h = r; h < a; h++) s[h * o + l] -= y * f[h - r];
    }
    s[r * o + r] = -u * i;
    for (let l = r + 1; l < a; l++) s[l * o + r] = 0;
  }
  return { vs: n, betas: e, k: t };
}
p(Nt, "mt");
$(Nt, "householderFactor");
function Pt(s, a, o, t) {
  let n = new Float64Array(o * t);
  for (let e = 0; e < t; e++) n[e * t + e] = 1;
  for (let e = s.length - 1; e >= 0; e--) {
    let r = s[e], i = a[e];
    if (i !== 0) for (let f = 0; f < t; f++) {
      let c = 0;
      for (let u = e; u < o; u++) c += r[u - e] * n[u * t + f];
      c *= i;
      for (let u = e; u < o; u++) n[u * t + f] -= c * r[u - e];
    }
  }
  return n;
}
p(Pt, "ht");
$(Pt, "accumulateQ");
function Wt(s, a = {}) {
  let { data: o, m: t, n } = H(s, "A"), e = a.mode !== void 0 ? a.mode : "reduced";
  if (e !== "reduced" && e !== "full") throw new Error(`qr: options.mode must be 'reduced' or 'full' (got '${e}')`);
  let { vs: r, betas: i, k: f } = Nt(o, t, n), c = e === "full" ? t : f, u = Pt(r, i, t, c), d = e === "full" ? t : f;
  return { Q: W(u, t, c), R: W(o.subarray(0, d * n), d, n) };
}
p(Wt, "C");
$(Wt, "qr");
function Kt(s, a) {
  let { data: o, m: t, n } = H(s, "A");
  if (t < n) throw new Error(`lstsq: A must have at least as many rows as columns (got ${t}x${n})`);
  let e = lt(a, t, "b"), r = o.slice(), { vs: i, betas: f, k: c } = Nt(o, t, n), u = 0;
  for (let l = 0; l < c; l++) for (let y = l; y < n; y++) u = Math.max(u, Math.abs(o[l * n + y]));
  for (let l = 0; l < n; l++) if (Math.abs(o[l * n + l]) < 1e-12 * u || u === 0) throw new Error(`lstsq: A is rank deficient (R[${l}][${l}] is negligible); use pinv for a minimum-norm solution`);
  for (let l = 0; l < c; l++) {
    let y = i[l], h = f[l];
    if (h === 0) continue;
    let b = 0;
    for (let m = l; m < t; m++) b += y[m - l] * e[m];
    b *= h;
    for (let m = l; m < t; m++) e[m] -= b * y[m - l];
  }
  let d = new Array(n).fill(0);
  for (let l = n - 1; l >= 0; l--) {
    let y = e[l];
    for (let h = l + 1; h < n; h++) y -= o[l * n + h] * d[h];
    d[l] = y / o[l * n + l];
  }
  let v = 0;
  for (let l = 0; l < t; l++) {
    let y = -a[l];
    for (let h = 0; h < n; h++) y += r[l * n + h] * d[h];
    v += y * y;
  }
  return { x: d, residualNorm: Math.sqrt(v) };
}
p(Kt, "tt");
$(Kt, "lstsq");
function wt(s, a = {}) {
  let o = H(s), t = o.m < o.n, n = t ? o.n : o.m, e = t ? o.m : o.n, r = new Float64Array(n * e);
  if (t) for (let m = 0; m < e; m++) for (let w = 0; w < n; w++) r[m * n + w] = o.data[m * o.n + w];
  else for (let m = 0; m < e; m++) for (let w = 0; w < n; w++) r[m * n + w] = o.data[w * o.n + m];
  let i = new Float64Array(e * e);
  for (let m = 0; m < e; m++) i[m * e + m] = 1;
  let f = a.maxSweeps || 60, c = a.tol || 1e-15;
  for (let m = 0; m < f; m++) {
    let w = false;
    for (let x = 0; x < e - 1; x++) for (let F = x + 1; F < e; F++) {
      let P = 0, M = 0, I = 0, U = x * n, S = F * n;
      for (let R = 0; R < n; R++) {
        let _ = r[U + R], L = r[S + R];
        P += _ * _, M += L * L, I += _ * L;
      }
      if (Math.abs(I) <= c * Math.sqrt(P * M) || P === 0 || M === 0) continue;
      w = true;
      let Q = (M - P) / (2 * I), Y = (Q >= 0 ? 1 : -1) / (Math.abs(Q) + Math.sqrt(1 + Q * Q)), J = 1 / Math.sqrt(1 + Y * Y), D = J * Y;
      for (let R = 0; R < n; R++) {
        let _ = r[U + R], L = r[S + R];
        r[U + R] = J * _ - D * L, r[S + R] = D * _ + J * L;
      }
      for (let R = 0; R < e; R++) {
        let _ = i[x * e + R], L = i[F * e + R];
        i[x * e + R] = J * _ - D * L, i[F * e + R] = D * _ + J * L;
      }
    }
    if (!w) break;
  }
  let u = new Array(e);
  for (let m = 0; m < e; m++) {
    let w = 0;
    for (let x = 0; x < n; x++) w += r[m * n + x] * r[m * n + x];
    u[m] = Math.sqrt(w);
  }
  let d = Array.from({ length: e }, (m, w) => w).sort((m, w) => u[w] - u[m]), v = d.map((m) => u[m]), l = new Float64Array(n * e), y = new Float64Array(e * e);
  for (let m = 0; m < e; m++) {
    let w = d[m], x = u[w];
    if (x > 0) for (let F = 0; F < n; F++) l[F * e + m] = r[w * n + F] / x;
    for (let F = 0; F < e; F++) y[F * e + m] = i[w * e + F];
  }
  let h = W(l, n, e), b = W(y, e, e);
  return t ? { U: b, s: v, V: h } : { U: h, s: v, V: b };
}
p(wt, "R");
$(wt, "svd");
function Zt(s, a) {
  let { s: o } = wt(s), t = s.length, n = s[0].length, e = a !== void 0 ? a : Math.max(t, n) * Number.EPSILON * (o[0] || 0);
  return o.filter((r) => r > e).length;
}
p(Zt, "rt");
$(Zt, "rank");
function tr(s) {
  let { s: a } = wt(s), o = a[a.length - 1];
  return o > 0 ? a[0] / o : 1 / 0;
}
p(tr, "ot");
$(tr, "cond");
function jt(s, a) {
  let { U: o, s: t, V: n } = wt(s), e = o.length, r = n.length, i = t.length, f = (a !== void 0 ? a : Math.max(e, r) * Number.EPSILON) * (t[0] || 0), c = new Array(r);
  for (let u = 0; u < r; u++) c[u] = new Array(e).fill(0);
  for (let u = 0; u < i; u++) {
    if (t[u] <= f) continue;
    let d = 1 / t[u];
    for (let v = 0; v < r; v++) {
      let l = n[v][u] * d;
      if (l === 0) continue;
      let y = c[v];
      for (let h = 0; h < e; h++) y[h] += l * o[h][u];
    }
  }
  return c;
}
p(jt, "W");
$(jt, "pinv");
function rr(s, a) {
  let o = s.length;
  lt(a, o, "b");
  let t = jt(s), n = t.length, e = new Array(n).fill(0);
  for (let r = 0; r < n; r++) {
    let i = 0;
    for (let f = 0; f < o; f++) i += t[r][f] * a[f];
    e[r] = i;
  }
  return e;
}
p(rr, "et");
$(rr, "pinvSolve");
function er(s, a = {}) {
  let o = H(s);
  St(o, "eigSym");
  let t = o.n, n = a.maxSweeps || 60, e = a.tol || 1e-14, r = Float64Array.from(o.data), i = new Float64Array(t * t);
  for (let l = 0; l < t; l++) i[l * t + l] = 1;
  let f = 0;
  for (let l = 0; l < t; l++) f = Math.max(f, Math.abs(r[l * t + l]));
  for (let l = 0; l < r.length; l++) f = Math.max(f, Math.abs(r[l]));
  let c = e * Math.max(1, f);
  for (let l = 0; l < n; l++) {
    let y = 0;
    for (let h = 0; h < t; h++) for (let b = h + 1; b < t; b++) y += Math.abs(r[h * t + b]);
    if (y <= c * t) break;
    for (let h = 0; h < t; h++) for (let b = h + 1; b < t; b++) {
      let m = r[h * t + b];
      if (Math.abs(m) <= c * 0.01) continue;
      let w = r[h * t + h], x = r[b * t + b], F = (x - w) / (2 * m), P = Math.sign(F) / (Math.abs(F) + Math.sqrt(F * F + 1)) || 1 / (F + Math.sign(F || 1) * Math.sqrt(F * F + 1)), M = 1 / Math.sqrt(P * P + 1), I = P * M, U = I / (1 + M);
      r[h * t + h] = w - P * m, r[b * t + b] = x + P * m, r[h * t + b] = 0, r[b * t + h] = 0;
      for (let S = 0; S < t; S++) {
        if (S !== h && S !== b) {
          let J = r[S * t + h], D = r[S * t + b];
          r[S * t + h] = J - I * (D + U * J), r[S * t + b] = D + I * (J - U * D), r[h * t + S] = r[S * t + h], r[b * t + S] = r[S * t + b];
        }
        let Q = i[S * t + h], Y = i[S * t + b];
        i[S * t + h] = Q - I * (Y + U * Q), i[S * t + b] = Y + I * (Q - U * Y);
      }
    }
  }
  let u = Array.from({ length: t }, (l, y) => y).sort((l, y) => r[y * t + y] - r[l * t + l]), d = u.map((l) => r[l * t + l]), v = new Float64Array(t * t);
  for (let l = 0; l < t; l++) {
    let y = u[l], h = 0, b = 1;
    for (let m = 0; m < t; m++) {
      let w = i[m * t + y];
      Math.abs(w) > h && (h = Math.abs(w), b = w >= 0 ? 1 : -1);
    }
    for (let m = 0; m < t; m++) v[m * t + l] = b * i[m * t + y];
  }
  return { values: d, vectors: W(v, t, t) };
}
p(er, "nt");
$(er, "eigSym");
function or(s, a) {
  let o = H(s, "A"), { data: t, m: n, n: e } = o;
  if (Array.isArray(a) && !Array.isArray(a[0])) {
    let u = lt(a, e, "B"), d = new Float64Array(n);
    for (let v = 0; v < n; v++) {
      let l = 0;
      for (let y = 0; y < e; y++) l += t[v * e + y] * u[y];
      d[v] = l;
    }
    return Array.from(d);
  }
  let r = H(a, "B");
  if (r.m !== e) throw new Error(`matmul: dimension mismatch (A is ${n}x${e}, B is ${r.m}x${r.n})`);
  let i = r.data, f = r.n, c = new Float64Array(n * f);
  for (let u = 0; u < n; u++) for (let d = 0; d < e; d++) {
    let v = t[u * e + d];
    if (v !== 0) for (let l = 0; l < f; l++) c[u * f + l] += v * i[d * f + l];
  }
  return W(c, n, f);
}
p(or, "st");
$(or, "matmul");
function nr(s) {
  let { data: a, m: o, n: t } = H(s, "A"), n = new Float64Array(t * o);
  for (let e = 0; e < o; e++) for (let r = 0; r < t; r++) n[r * o + e] = a[e * t + r];
  return W(n, t, o);
}
p(nr, "at");
$(nr, "transpose");
function lr(s) {
  if (!Number.isInteger(s) || s <= 0) throw new Error(`identity: n must be a positive integer (got ${s})`);
  let a = new Array(s);
  for (let o = 0; o < s; o++) {
    let t = new Array(s).fill(0);
    t[o] = 1, a[o] = t;
  }
  return a;
}
p(lr, "lt");
$(lr, "identity");
function ar(s) {
  if (!Array.isArray(s) || s.length === 0) throw new Error("diag: argument must be a non-empty vector or nested matrix");
  if (Array.isArray(s[0])) {
    let { data: t, m: n, n: e } = H(s, "A"), r = Math.min(n, e), i = new Array(r);
    for (let f = 0; f < r; f++) i[f] = t[f * e + f];
    return i;
  }
  let a = s.length, o = new Array(a);
  for (let t = 0; t < a; t++) {
    let n = new Array(a).fill(0);
    n[t] = s[t], o[t] = n;
  }
  return o;
}
p(ar, "it");
$(ar, "diag");
function sr(s, a = "fro") {
  if (!Array.isArray(s) || s.length === 0) throw new Error("norm: argument must be a non-empty vector or nested matrix");
  if (!Array.isArray(s[0])) {
    if (a === "fro" || a === 2) {
      let e = 0;
      for (let r = 0; r < s.length; r++) e += s[r] * s[r];
      return Math.sqrt(e);
    }
    if (a === 1) {
      let e = 0;
      for (let r = 0; r < s.length; r++) e += Math.abs(s[r]);
      return e;
    }
    if (a === 1 / 0) {
      let e = 0;
      for (let r = 0; r < s.length; r++) e = Math.max(e, Math.abs(s[r]));
      return e;
    }
    throw new Error(`norm: unsupported vector norm kind ${String(a)}`);
  }
  let { data: o, m: t, n } = H(s, "A");
  if (a === "fro") {
    let e = 0;
    for (let r = 0; r < o.length; r++) e += o[r] * o[r];
    return Math.sqrt(e);
  }
  if (a === 1) {
    let e = 0;
    for (let r = 0; r < n; r++) {
      let i = 0;
      for (let f = 0; f < t; f++) i += Math.abs(o[f * n + r]);
      e = Math.max(e, i);
    }
    return e;
  }
  if (a === 1 / 0) {
    let e = 0;
    for (let r = 0; r < t; r++) {
      let i = 0;
      for (let f = 0; f < n; f++) i += Math.abs(o[r * n + f]);
      e = Math.max(e, i);
    }
    return e;
  }
  throw new Error(`norm: unsupported matrix norm kind ${String(a)} (use 'fro', 1, or Infinity)`);
}
p(sr, "ct");
$(sr, "norm");
function fr(s) {
  let { data: a, m: o, n: t } = H(s, "A");
  if (o !== t) throw new Error(`trace: matrix must be square (got ${o}x${t})`);
  let n = 0;
  for (let e = 0; e < t; e++) n += a[e * t + e];
  return n;
}
p(fr, "ft");
$(fr, "trace");
var ir = 1 / 2;
var cr = 2;
var ur = 48 / 25;
var mr = 6 / 25;
var hr = -8;
var yr = 372 / 25;
var Ar = 12 / 5;
var wr = -112 / 125;
var pr = -54 / 125;
var gr = -2 / 5;
var pt = [19 / 9, 1 / 2, 25 / 108, 125 / 108];
var gt = [17 / 54, 7 / 36, 0, 125 / 108];
var dr = 1 / 2;
var vr = -3 / 2;
var br = 121 / 50;
var Mr = 29 / 250;
var xr = 1;
var Fr = 3 / 5;
var dt = 3;
var Ot = Math.sqrt(Number.EPSILON);
function Er(s, a, o) {
  let t = o.length, n = [];
  for (let r = 0; r < t; r++) n.push(new Array(t).fill(0));
  let e = Float64Array.from(o);
  for (let r = 0; r < t; r++) {
    let i = Ot * Math.max(1, Math.abs(o[r]));
    e[r] = o[r] + i;
    let f = s(a, e);
    e[r] = o[r] - i;
    let c = s(a, e);
    e[r] = o[r];
    for (let u = 0; u < t; u++) n[u][r] = (f[u] - c[u]) / (2 * i);
  }
  return n;
}
p(Er, "fdJacobian");
function Sr(s) {
  let a = $t(s), { lu: o, n: t } = a, n = 0;
  for (let e = 0; e < t; e++) for (let r = e; r < t; r++) n = Math.max(n, Math.abs(o[e * t + r]));
  for (let e = 0; e < t; e++) if (!(Math.abs(o[e * t + e]) > 1e-13 * n)) throw new Error("rosenbrock: W = I/(gamma*h) - J is singular");
  return a;
}
p(Sr, "factorize");
function vt(s, a) {
  return kt(s, a);
}
p(vt, "luSolve");
function bt(s, a, o, t = {}) {
  let n = t.rtol ?? 1e-6, e = t.atol ?? 1e-9, r = t.maxStep ?? 1 / 0, i = t.maxSteps ?? 1e5;
  if (t.events) throw new Error("rosenbrock does not support events yet; use rk45 for event detection");
  let [f, c] = a, u = c >= f ? 1 : -1, { y: d, scalar: v } = ot(o), l = d.length, y = nt(s, l), h = t.jac ? (B, X) => {
    let V = t.jac(B, Array.from(X));
    if (!Array.isArray(V) || V.length !== l || V.some((G) => G.length !== l)) throw new Error(`options.jac must return an ${l}x${l} nested matrix`);
    return V.map((G) => Array.from(G, Number));
  } : null, b = t.tEval ? t.tEval.slice() : null;
  if (b) {
    for (let B of b) if (u * (B - f) < -1e-12 || u * (B - c) > 1e-12) throw new Error(`tEval point ${B} is outside tSpan [${f}, ${c}]`);
  }
  let m = f, w = Float64Array.from(d), x = y(m, w), F = 1, P = 0, M = t.firstStep !== void 0 ? Math.abs(t.firstStep) * u : mt(y, m, w, x, dt, e, n, u), I = [], U = [], S = 0;
  b || (I.push(m), U.push(Float64Array.from(w)));
  let Q = 0.9, Y = 0.2, J = 10, D = 1e-4, R = 0, _ = null, L = null;
  function ct(B, X, V, G, j, q) {
    let k = new Float64Array(l), g = q * q, N = g * q, E = 2 * N - 3 * g + 1, O = N - 2 * g + q, C = -2 * N + 3 * g, z = N - g;
    for (let T = 0; T < l; T++) k[T] = E * B[T] + O * j * X[T] + C * V[T] + z * j * G[T];
    return k;
  }
  for (p(ct, "interpolate"); u * (m - c) < 0; ) {
    if (R++ > i) return et(false, `exceeded maxSteps (${i})`);
    let B = Math.min(Math.abs(M), r, Math.abs(c - m));
    if (B < 1e-14 * Math.max(1, Math.abs(m))) return et(false, "step size underflow");
    if (M = B * u, _ === null) {
      h ? _ = h(m, w) : (_ = Er(y, m, w), F += 2 * l), P++;
      let j = Ot * Math.max(Math.abs(m), Math.abs(M)) * u, q = y(m + j, w);
      F++, L = new Float64Array(l);
      for (let k = 0; k < l; k++) L[k] = (q[k] - x[k]) / j;
    }
    let X = null, V = null;
    try {
      let j = [], q = 1 / (ir * M);
      for (let A = 0; A < l; A++) {
        let st = new Array(l);
        for (let tt = 0; tt < l; tt++) st[tt] = (A === tt ? q : 0) - _[A][tt];
        j.push(st);
      }
      let k = Sr(j), g = new Float64Array(l), N = new Float64Array(l);
      for (let A = 0; A < l; A++) g[A] = x[A] + M * dr * L[A];
      let E = vt(k, g);
      for (let A = 0; A < l; A++) N[A] = w[A] + cr * E[A];
      let O = y(m + xr * M, N);
      F++;
      for (let A = 0; A < l; A++) g[A] = O[A] + M * vr * L[A] + hr * E[A] / M;
      let C = vt(k, g);
      for (let A = 0; A < l; A++) N[A] = w[A] + ur * E[A] + mr * C[A];
      let z = y(m + Fr * M, N);
      F++;
      for (let A = 0; A < l; A++) g[A] = z[A] + M * br * L[A] + (yr * E[A] + Ar * C[A]) / M;
      let T = vt(k, g);
      for (let A = 0; A < l; A++) g[A] = z[A] + M * Mr * L[A] + (wr * E[A] + pr * C[A] + gr * T[A]) / M;
      let Z = vt(k, g);
      X = new Float64Array(l), V = new Float64Array(l);
      let K = true;
      for (let A = 0; A < l; A++) X[A] = w[A] + pt[0] * E[A] + pt[1] * C[A] + pt[2] * T[A] + pt[3] * Z[A], V[A] = gt[0] * E[A] + gt[1] * C[A] + gt[2] * T[A] + gt[3] * Z[A], K = K && Number.isFinite(X[A]) && Number.isFinite(V[A]);
      K || (X = null);
    } catch {
      X = null;
    }
    if (X === null) {
      M = B * 0.5 * u;
      continue;
    }
    let G = ut(V, w, X, e, n);
    if (G <= 1) {
      let j = m, q = w, k = x, g = y(j + M, X);
      if (F++, b) for (; S < b.length && u * (b[S] - (j + M)) <= 1e-12 && u * (b[S] - j) >= -1e-12; ) {
        let E = M === 0 ? 0 : (b[S] - j) / M;
        I.push(b[S]), U.push(ct(q, k, X, g, M, E)), S++;
      }
      m = j + M, w = X, x = g, _ = null, b || (I.push(m), U.push(Float64Array.from(w)));
      let N = G === 0 ? J : Math.min(J, Q * G ** (-0.9 / (dt + 1)) * D ** (0.2 / (dt + 1)));
      D = Math.max(G, 1e-10), M = B * Math.max(Y, N) * u;
    } else {
      let j = Math.max(Y, Q * G ** (-1 / (dt + 1)));
      M = B * j * u;
    }
  }
  return et(true, "integration successful");
  function et(B, X) {
    return rt(I, U, v, { success: B, message: X, nfev: F, njev: P, nsteps: R });
  }
}
p(bt, "rosenbrock");
function qt(s, a, o, t, n = {}) {
  let [e, r] = o, i = r >= e ? 1 : -1, f;
  if (n.step !== void 0) {
    if (!(n.step > 0)) throw new Error("options.step must be a positive number");
    f = n.step;
  } else if (n.nSteps !== void 0) {
    if (!Number.isInteger(n.nSteps) || n.nSteps < 1) throw new Error("options.nSteps must be a positive integer");
    f = Math.abs(r - e) / n.nSteps;
  } else throw new Error("either options.step or options.nSteps is required");
  let { y: c, scalar: u } = ot(t), d = c.length, v = nt(a, d), l = e, y = Float64Array.from(c), h = 0, b = 0, m = [l], w = [Float64Array.from(y)];
  try {
    for (; i * (r - l) > 0; ) {
      let x = Math.abs(r - l), F = x <= f * (1 + 1e-9), P = F ? x : f, [M, I] = s(v, l, y, P * i, d);
      h += I, b++, l = F ? r : l + P * i, y = M, m.push(l), w.push(Float64Array.from(y));
    }
  } catch (x) {
    return rt(m, w, u, { success: false, message: x.message, nfev: h, nsteps: b });
  }
  return rt(m, w, u, { success: true, message: "integration successful", nfev: h, nsteps: b });
}
p(qt, "integrate");
function $r(s, a, o, t, n) {
  let e = s(a, o), r = new Float64Array(n);
  for (let i = 0; i < n; i++) r[i] = o[i] + t * e[i];
  return [r, 1];
}
p($r, "eulerStep");
function kr(s, a, o, t, n) {
  let e = s(a, o), r = new Float64Array(n);
  for (let c = 0; c < n; c++) r[c] = o[c] + 0.5 * t * e[c];
  let i = s(a + 0.5 * t, r), f = new Float64Array(n);
  for (let c = 0; c < n; c++) f[c] = o[c] + t * i[c];
  return [f, 2];
}
p(kr, "rk2Step");
function Nr(s, a, o, t, n) {
  let e = s(a, o), r = new Float64Array(n);
  for (let l = 0; l < n; l++) r[l] = o[l] + 0.5 * t * e[l];
  let i = s(a + 0.5 * t, r), f = new Float64Array(n);
  for (let l = 0; l < n; l++) f[l] = o[l] + 0.5 * t * i[l];
  let c = s(a + 0.5 * t, f), u = new Float64Array(n);
  for (let l = 0; l < n; l++) u[l] = o[l] + t * c[l];
  let d = s(a + t, u), v = new Float64Array(n);
  for (let l = 0; l < n; l++) v[l] = o[l] + t / 6 * (e[l] + 2 * i[l] + 2 * c[l] + d[l]);
  return [v, 4];
}
p(Nr, "rk4Step");
function Mt(s, a, o, t) {
  return qt($r, s, a, o, t);
}
p(Mt, "euler");
function xt(s, a, o, t) {
  return qt(kr, s, a, o, t);
}
p(xt, "rk2");
function Ft(s, a, o, t) {
  return qt(Nr, s, a, o, t);
}
p(Ft, "rk4");
function qr(s, a, o, t = {}) {
  let { method: n = "rk45", ...e } = t, r = { rk45: yt, rosenbrock: bt, euler: Mt, rk2: xt, rk4: Ft }, i = r[String(n).toLowerCase()];
  if (!i) throw new Error(`solve: unknown method '${n}'. Available: ${Object.keys(r).join(", ")}`);
  return i(s, a, o, e);
}
p(qr, "solve");

// src/model.js
var EXPERIMENTS = [
  { id: "early", title: "Read product early", change: "No intervention", sensor: "Product P", time: 0.75, first: 1, second: 1, variable: 2, description: "A short time-course readout, before both routes converge." },
  { id: "late", title: "Read product late", change: "No intervention", sensor: "Product P", time: 5.25, first: 1, second: 1, variable: 2, description: "A late product measurement after more of the pathway has run." },
  { id: "intermediate", title: "Measure the hidden state", change: "No intervention", sensor: "Intermediate I", time: 1.4, first: 1, second: 1, variable: 1, description: "Check whether an intermediate accumulates at all." },
  { id: "block-step", title: "Slow the candidate second step", change: "Reduce k\u2082 by 65%", sensor: "Product P", time: 2.5, first: 1, second: 0.35, variable: 2, description: "Apply an idealized perturbation to the proposed I \u2192 P conversion." }
];
function integrate(model, rates, settings) {
  const { time, first = 1, second = 1, initial = 1 } = settings;
  const end = Math.max(time, 0.01);
  const sample = yt(model(rates, first, second), [0, end], [initial, 0, 0], { tEval: [end] });
  return sample.y.map((series) => Math.max(0, series.at(-1) ?? 0));
}
function directModel({ directRate }, first) {
  return (_t2, [substrate]) => {
    const flux = directRate * first * substrate;
    return [-flux, 0, flux];
  };
}
function stagedModel({ entryRate, exitRate }, first, second) {
  return (_t2, [substrate, intermediate]) => {
    const entering = entryRate * first * substrate;
    const leaving = exitRate * second * intermediate;
    return [-entering, entering - leaving, leaving];
  };
}
function predictPair(rates, settings) {
  return {
    direct: integrate(directModel, rates, settings),
    staged: integrate(stagedModel, rates, settings)
  };
}
function calibrateExitRate(directRate, entryRate, anchorTime) {
  const target = 1 - Math.exp(-directRate * anchorTime);
  let low = 0.015;
  let high = Math.max(6, entryRate * 8);
  for (let index = 0; index < 42; index += 1) {
    const middle = (low + high) / 2;
    const state2 = integrate(stagedModel, { entryRate, exitRate: middle }, { time: anchorTime });
    if (state2[2] < target) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}
function rankExperiments(rates, noise) {
  return EXPERIMENTS.map((experiment) => {
    const pair = predictPair(rates, experiment);
    const delta = Math.abs(pair.direct[experiment.variable] - pair.staged[experiment.variable]);
    const separation = delta / Math.sqrt(2 * noise ** 2);
    return { ...experiment, pair, delta, separation };
  }).sort((a, b) => b.separation - a.separation);
}
function simulateTrajectories(rates, options = {}) {
  const end = options.time ?? 6;
  const count = options.count ?? 121;
  const tEval = Array.from({ length: count }, (_, index) => end * index / (count - 1));
  const initial = options.initial ?? 1;
  const direct = yt(directModel(rates, options.first ?? 1), [0, end], [initial, 0, 0], { tEval });
  const staged = yt(stagedModel(rates, options.first ?? 1, options.second ?? 1), [0, end], [initial, 0, 0], { tEval });
  return { times: direct.t, direct: direct.y, staged: staged.y };
}

// src/app.js
var $2 = (id) => document.getElementById(id);
var inputs = {
  directRate: $2("direct-rate"),
  entryRate: $2("entry-rate"),
  noise: $2("noise"),
  anchorTime: $2("anchor-time")
};
var chart = $2("trajectory-chart");
var context = chart.getContext("2d");
var state = { rates: {}, ranked: [], selectedId: "early" };
var resizeObserver;
var format = (value, digits = 3) => Number(value).toFixed(digits);
function readControls() {
  const directRate = Number(inputs.directRate.value);
  const entryRate = Number(inputs.entryRate.value);
  const anchorTime = Number(inputs.anchorTime.value);
  const exitRate = calibrateExitRate(directRate, entryRate, anchorTime);
  state.rates = { directRate, entryRate, exitRate, anchorTime };
  state.ranked = rankExperiments(state.rates, Number(inputs.noise.value));
  return state;
}
function canvasSize() {
  const bounds = chart.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(bounds.width * pixelRatio));
  const height = Math.max(1, Math.floor(bounds.height * pixelRatio));
  if (chart.width !== width || chart.height !== height) {
    chart.width = width;
    chart.height = height;
  }
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  return { width: bounds.width, height: bounds.height };
}
function drawChart() {
  const { width, height } = canvasSize();
  const selected = EXPERIMENTS.find((item) => item.id === state.selectedId) ?? EXPERIMENTS[0];
  const index = selected.variable;
  const paths = simulateTrajectories(state.rates, selected.id === "block-step" ? { time: 6, count: 121, second: selected.second } : { time: 6, count: 121 });
  const maxValue = Math.max(0.12, ...paths.direct[index], ...paths.staged[index]) * 1.16;
  const padding = { left: 42, right: 15, top: 14, bottom: 30 };
  const plotWidth = Math.max(30, width - padding.left - padding.right);
  const plotHeight = Math.max(30, height - padding.top - padding.bottom);
  const x = (time) => padding.left + time / 6 * plotWidth;
  const y = (value) => padding.top + plotHeight - value / maxValue * plotHeight;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.font = "9px DM Mono, monospace";
  context.textAlign = "right";
  context.textBaseline = "middle";
  for (let tick = 0; tick <= 4; tick += 1) {
    const value = maxValue * tick / 4;
    const py = y(value);
    context.strokeStyle = "#edf1ef";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(padding.left, py);
    context.lineTo(width - padding.right, py);
    context.stroke();
    context.fillStyle = "#8b9693";
    context.fillText(value.toFixed(2), padding.left - 8, py);
  }
  context.textAlign = "center";
  context.textBaseline = "top";
  for (let tick = 0; tick <= 6; tick += 1) {
    const px = x(tick);
    context.strokeStyle = "#f0f3f1";
    context.beginPath();
    context.moveTo(px, padding.top);
    context.lineTo(px, padding.top + plotHeight);
    context.stroke();
    context.fillStyle = "#8b9693";
    context.fillText(String(tick), px, height - 19);
  }
  const anchorX = x(state.rates.anchorTime);
  context.save();
  context.setLineDash([3, 4]);
  context.strokeStyle = "#b5a06a";
  context.beginPath();
  context.moveTo(anchorX, padding.top);
  context.lineTo(anchorX, padding.top + plotHeight);
  context.stroke();
  context.restore();
  const selectedX = x(selected.time);
  context.save();
  context.setLineDash([2, 3]);
  context.strokeStyle = "#b1bbb7";
  context.beginPath();
  context.moveTo(selectedX, padding.top);
  context.lineTo(selectedX, padding.top + plotHeight);
  context.stroke();
  context.restore();
  const renderLine = (series, color) => {
    context.beginPath();
    series.forEach((value, indexAt) => {
      const px = x(paths.times[indexAt]);
      const py = y(value);
      if (indexAt === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    });
    context.strokeStyle = color;
    context.lineWidth = 2.2;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.stroke();
  };
  renderLine(paths.direct[index], "#1c8b70");
  renderLine(paths.staged[index], "#cf674e");
  const prediction = state.ranked.find((item) => item.id === selected.id);
  if (prediction) {
    [[prediction.pair.direct[index], "#1c8b70"], [prediction.pair.staged[index], "#cf674e"]].forEach(([value, color]) => {
      context.beginPath();
      context.arc(selectedX, y(value), 4.2, 0, Math.PI * 2);
      context.fillStyle = "#fff";
      context.fill();
      context.lineWidth = 2;
      context.strokeStyle = color;
      context.stroke();
    });
  }
}
function updateReadouts() {
  $2("direct-rate-value").value = format(state.rates.directRate, 2);
  $2("entry-rate-value").value = format(state.rates.entryRate, 2);
  $2("noise-value").value = format(Number(inputs.noise.value), 2);
  $2("anchor-value").value = format(state.rates.anchorTime, 1);
  $2("exit-rate-label").textContent = `k\u2082 ${format(state.rates.exitRate, 2)}`;
  const baseline = predictPair(state.rates, { time: state.rates.anchorTime });
  const baselineDelta = Math.abs(baseline.direct[2] - baseline.staged[2]);
  $2("baseline-a").textContent = format(baseline.direct[2]);
  $2("baseline-b").textContent = format(baseline.staged[2]);
  $2("match-value").textContent = `\u0394 ${format(baselineDelta)}`;
  $2("match-copy").textContent = `Both predict the same product amount at t = ${format(state.rates.anchorTime, 1)}.`;
  $2("match-title").textContent = baselineDelta < 2e-3 ? "Same at the reference point" : "Reference-point mismatch";
  $2("match-title").style.color = baselineDelta < 2e-3 ? "#146c58" : "#a54e3e";
}
function renderExperiments() {
  const rows = $2("experiment-rows");
  rows.innerHTML = "";
  const maxSeparation = Math.max(0.01, state.ranked[0]?.separation ?? 0);
  state.ranked.forEach((experiment, index) => {
    const isBest = index === 0;
    const active = experiment.id === state.selectedId;
    const row = document.createElement("tr");
    if (isBest) row.classList.add("is-best");
    const aValue = experiment.pair.direct[experiment.variable];
    const bValue = experiment.pair.staged[experiment.variable];
    row.innerHTML = `<td class="test-name"><span class="test-number">${String(index + 1).padStart(2, "0")}</span>${experiment.title}</td>
      <td>${experiment.change}</td><td>${experiment.sensor} \xB7 t ${format(experiment.time, 2)}</td>
      <td class="model-value">${format(aValue)}</td><td class="model-value">${format(bValue)}</td>
      <td class="score-cell"><div class="score-wrap"><span class="score-bar"><i style="width:${Math.min(100, experiment.separation / maxSeparation * 100)}%"></i></span><span class="score-number">${format(experiment.separation, 1)}\u03C3</span></div></td>
      <td><button class="select-test" type="button" data-experiment="${experiment.id}">${active ? "Viewing" : "Preview"}</button></td>`;
    rows.append(row);
  });
  $2("experiment-count").textContent = `${state.ranked.length} candidate tests`;
  rows.querySelectorAll("[data-experiment]").forEach((button) => button.addEventListener("click", () => {
    state.selectedId = button.dataset.experiment;
    render();
  }));
}
function updateBestTest() {
  const best = state.ranked[0];
  if (!best) return;
  $2("best-title").textContent = best.title;
  $2("best-description").textContent = best.description;
  $2("separation-value").textContent = `${format(best.separation, 1)}\u03C3`;
  $2("meter-fill").style.width = `${Math.min(100, best.separation / 8 * 100)}%`;
  $2("apply-best").dataset.experiment = best.id;
  $2("chart-assay").textContent = `Preview: ${EXPERIMENTS.find((item) => item.id === state.selectedId)?.sensor ?? "Product P"}`;
}
function render() {
  readControls();
  updateReadouts();
  updateBestTest();
  renderExperiments();
  drawChart();
}
var toastTimer;
function showToast(message) {
  const toast = $2("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2100);
}
Object.values(inputs).forEach((input) => input.addEventListener("input", render));
$2("apply-best").addEventListener("click", () => {
  state.selectedId = $2("apply-best").dataset.experiment;
  render();
  showToast("Test preview updated. No external experiment was run.");
});
$2("reset").addEventListener("click", () => {
  inputs.directRate.value = "0.90";
  inputs.entryRate.value = "1.20";
  inputs.noise.value = "0.06";
  inputs.anchorTime.value = "2.5";
  state.selectedId = "early";
  render();
  showToast("Model controls reset.");
});
resizeObserver = new ResizeObserver(drawChart);
resizeObserver.observe(chart.parentElement);
render();
