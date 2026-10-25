#include <stdio.h>
#include <string.h>

int mod(int a) { a %= 26; if (a < 0) a += 26; return a; }

int modinv(int a) {                       /* modular inverse mod 26 */
    a = mod(a);
    for (int i = 1; i < 26; i++)
        if ((a * i) % 26 == 1) return i;
    return -1;                            /* no inverse */
}

/* Hill encryption: each pair (a,b) is a row vector, C = P*K mod 26 */
void encrypt(const char *pt, int K[2][2], char *ct) {
    int n = strlen(pt);
    for (int i = 0; i < n; i += 2) {
        int a = pt[i] - 'A', b = pt[i + 1] - 'A';
        ct[i]     = 'A' + mod(a * K[0][0] + b * K[1][0]);
        ct[i + 1] = 'A' + mod(a * K[0][1] + b * K[1][1]);
    }
    ct[n] = '\0';
}

/* Recover K = P^-1 * C (mod 26) from two known plaintext/ciphertext blocks */
int recoverKey(int P[2][2], int C[2][2], int K[2][2]) {
    int det = mod(P[0][0] * P[1][1] - P[0][1] * P[1][0]);
    int inv = modinv(det);
    if (inv == -1) return 0;              /* P not invertible: need other pairs */

    int Pi[2][2];
    Pi[0][0] = mod( inv * P[1][1]);
    Pi[0][1] = mod(-inv * P[0][1]);
    Pi[1][0] = mod(-inv * P[1][0]);
    Pi[1][1] = mod( inv * P[0][0]);

    for (int i = 0; i < 2; i++)
        for (int j = 0; j < 2; j++)
            K[i][j] = mod(Pi[i][0] * C[0][j] + Pi[i][1] * C[1][j]);
    return 1;
}

void printMat(const char *title, int M[2][2]) {
    printf("%s\n", title);
    for (int i = 0; i < 2; i++) printf("  %2d %2d\n", M[i][0], M[i][1]);
}

int main(void) {
    int secret[2][2] = {{3, 3}, {2, 5}};  /* unknown to the attacker */
    char ct[20];

    printMat("Secret key (unknown to attacker):", secret);

    /* ---------- Known plaintext attack ---------- */
    const char *known = "HELP";
    encrypt(known, secret, ct);
    printf("\n--- Known Plaintext Attack ---\n");
    printf("Known plaintext : %s\n", known);
    printf("Ciphertext      : %s\n", ct);

    int P[2][2] = {{known[0]-'A', known[1]-'A'}, {known[2]-'A', known[3]-'A'}};
    int C[2][2] = {{ct[0]-'A', ct[1]-'A'},       {ct[2]-'A', ct[3]-'A'}};
    int K[2][2];

    if (recoverKey(P, C, K)) {
        printMat("Recovered key matrix:", K);
        int ok = 1;
        for (int i = 0; i < 2; i++)
            for (int j = 0; j < 2; j++)
                if (K[i][j] != secret[i][j]) ok = 0;
        printf("Key recovered correctly: %s\n", ok ? "YES" : "NO");
    } else {
        printf("Plaintext matrix not invertible, need more pairs.\n");
    }

    /* ---------- Chosen plaintext attack ---------- */
    const char *chosen = "BAAB";          /* rows [1 0] and [0 1] = identity */
    encrypt(chosen, secret, ct);
    printf("\n--- Chosen Plaintext Attack ---\n");
    printf("Chosen plaintext: %s  (identity matrix)\n", chosen);
    printf("Ciphertext      : %s\n", ct);

    int R[2][2] = {{ct[0]-'A', ct[1]-'A'}, {ct[2]-'A', ct[3]-'A'}};
    printMat("Ciphertext rows = key rows:", R);
    return 0;
}
