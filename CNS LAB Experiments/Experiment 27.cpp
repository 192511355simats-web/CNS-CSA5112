#include <stdio.h>
#include <string.h>

long long mod_pow(long long base, long long exp, long long mod) {
    long long res = 1;
    base %= mod;
    while (exp > 0) {
        if (exp % 2 == 1) res = (res * base) % mod;
        base = (base * base) % mod;
        exp /= 2;
    }
    return res;
}

int main() {
    long long e = 65537, n = 10403; // Public key (101 * 103)
    const char *msg = "HELLO";
    int len = strlen(msg);
    long long ciphertext[10];

    // Alice encrypts character by character (A=0 .. Z=25)
    for (int i = 0; i < len; i++) {
        ciphertext[i] = mod_pow(msg[i] - 'A', e, n);
    }

    // Eve's Attack: Precompute codebook for all 26 letters using public key
    long long codebook[26];
    for (int m = 0; m < 26; m++) {
        codebook[m] = mod_pow(m, e, n);
    }

    printf("Intercepted Ciphertext Blocks: ");
    for (int i = 0; i < len; i++) printf("%lld ", ciphertext[i]);

    printf("\nRecovered Plaintext via Codebook Attack: ");
    for (int i = 0; i < len; i++) {
        for (int m = 0; m < 26; m++) {
            if (ciphertext[i] == codebook[m]) {
                printf("%c", 'A' + m);
                break;
            }
        }
    }
    printf("\n");
    return 0;
}
