#include <stdio.h>
#include <string.h>
#include <ctype.h>

/* Encrypt: C = (P + k) mod 26   Decrypt: P = (C - k) mod 26 */
void clean(const char *in, char *out) {            /* keep letters only, uppercase */
    int j = 0;
    for (int i = 0; in[i]; i++) if (isalpha((unsigned char)in[i])) out[j++] = toupper(in[i]);
    out[j] = '\0';
}
void otp_encrypt(const char *p, const int *k, char *c) {
    int n = strlen(p);
    for (int i = 0; i < n; i++) c[i] = 'A' + ((p[i] - 'A') + k[i]) % 26;
    c[n] = '\0';
}
void otp_decrypt(const char *c, const int *k, char *p) {
    int n = strlen(c);
    for (int i = 0; i < n; i++) p[i] = 'A' + (((c[i] - 'A') - k[i]) % 26 + 26) % 26;
    p[n] = '\0';
}
/* Part (b): key that makes ciphertext c decrypt to the wanted plaintext w */
void find_key(const char *c, const char *w, int *k) {
    for (int i = 0; c[i]; i++) k[i] = ((c[i] - 'A') - (w[i] - 'A') + 26) % 26;
}
int main(void) {
    int key[] = {9, 0, 1, 7, 23, 15, 21, 14, 11, 11, 2, 8, 9};
    char pt[64], ct[64], back[64], want[64], k2[64];
    int key2[64];

    clean("send more money", pt);
    otp_encrypt(pt, key, ct);
    printf("(a) Plaintext : %s\n    Key stream: ", pt);
    for (int i = 0; i < (int)strlen(pt); i++) printf("%d ", key[i]);
    printf("\n    Ciphertext: %s\n", ct);
    otp_decrypt(ct, key, back);
    printf("    Check decrypt: %s\n\n", back);

    clean("cash not needed", want);
    find_key(ct, want, key2);
    printf("(b) Desired plaintext: %s\n    Key found        : ", want);
    for (int i = 0; i < (int)strlen(ct); i++) printf("%d ", key2[i]);
    otp_decrypt(ct, key2, k2);
    printf("\n    Decrypts to      : %s\n", k2);
    return 0;
}
