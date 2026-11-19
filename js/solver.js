// Решатель цепей постоянного тока: метод узловых потенциалов.
// n — число узлов (узел 0 — «земля»), res — [[a,b,R],...], vs — [[плюс,минус,E],...]
// Возвращает массив потенциалов узлов.
function solve(n, res, vs) {
  const N = n - 1, M = vs.length, S = N + M;
  const A = Array.from({ length: S }, () => new Array(S + 1).fill(0));
  for (let i = 0; i < N; i++) A[i][i] += 1e-9; // утечка, чтобы «висящие» узлы не ломали матрицу
  for (const [a, b, R] of res) {
    const g = 1 / R;
    if (a > 0) A[a - 1][a - 1] += g;
    if (b > 0) A[b - 1][b - 1] += g;
    if (a > 0 && b > 0) { A[a - 1][b - 1] -= g; A[b - 1][a - 1] -= g; }
  }
  vs.forEach(([p, m, E], k) => {
    const r = N + k;
    if (p > 0) { A[p - 1][r] += 1; A[r][p - 1] += 1; }
    if (m > 0) { A[m - 1][r] -= 1; A[r][m - 1] -= 1; }
    A[r][S] = E;
  });
  for (let c = 0; c < S; c++) {
    let p = c;
    for (let r = c + 1; r < S; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    const d = A[c][c] || 1e-12;
    for (let r = 0; r < S; r++) {
      if (r === c) continue;
      const f = A[r][c] / d;
      if (f) for (let k = c; k <= S; k++) A[r][k] -= f * A[c][k];
    }
  }
  const v = [0];
  for (let i = 0; i < N; i++) v.push(A[i][S] / (A[i][i] || 1e-12));
  return v;
}
