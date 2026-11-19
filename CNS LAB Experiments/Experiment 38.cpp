#include <stdio.h>
#include <string.h>
#include <ctype.h>

int mod26(int x) {
    return (x % 26 + 26) % 26;
}

int modInverse(int a) {
    a = mod26(a);
    for (int x = 1; x < 26; x++) {
        if ((a * x) % 26 == 1) return x;
    }
    return -1;
}

int invertMatrix2x2(int m[2][2], int inv[2][2]) {
    int det = mod26(m[0][0] * m[1][1] - m[0][1] * m[1][0]);
    int detInv = modInverse(det);
    if (detInv == -1) return 0;

    inv[0][0] = mod26( m[1][1] * detInv);
    inv[0][1] = mod26(-m[0][1] * detInv);
    inv[1][0] = mod26(-m[1][0] * detInv);
    inv[1][1] = mod26( m[0][0] * detInv);
    return 1;
}

void multiply2x2(int A[2][2], int B[2][2], int res[2][2]) {
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2; j++) {
            res[i][j] = mod26(A[i][0] * B[0][j] + A[i][1] * B[1][j]);
        }
    }
}

int main() {
    char knownP[5], knownC[5];
    int P[2][2], C[2][2], P_inv[2][2], K[2][2];

    printf("Enter 4-letter known/chosen plaintext (e.g., BAAB for chosen): ");
    scanf("%4s", knownP);
    printf("Enter corresponding 4-letter ciphertext: ");
    scanf("%4s", knownC);

    // Arrange column-wise: [p0 p2; p1 p3]
    P[0][0] = toupper(knownP[0]) - 'A';
    P[1][0] = toupper(knownP[1]) - 'A';
    P[0][1] = toupper(knownP[2]) - 'A';
    P[1][1] = toupper(knownP[3]) - 'A';

    C[0][0] = toupper(knownC[0]) - 'A';
    C[1][0] = toupper(knownC[1]) - 'A';
    C[0][1] = toupper(knownC[2]) - 'A';
    C[1][1] = toupper(knownC[3]) - 'A';

    if (!invertMatrix2x2(P, P_inv)) {
        printf("Plaintext matrix is not invertible mod 26. Choose another pair.\n");
        return 1;
    }

    multiply2x2(C, P_inv, K);

    printf("\nRecovered 2x2 Key Matrix K:\n");
    printf("[ %2d  %2d ]\n", K[0][0], K[0][1]);
    printf("[ %2d  %2d ]\n", K[1][0], K[1][1]);

    return 0;
}
