#include <stdio.h>
#include <string.h>
#include <ctype.h>

int K[2][2] = {{9, 4}, {5, 7}};
int K_inv[2][2] = {{5, 12}, {15, 25}}; // Pre-calculated inverse mod 26

void hillEncrypt(char *text) {
    int len = strlen(text);
    printf("\n[Encrypted Ciphertext]: ");
    for (int i = 0; i < len; i += 2) {
        int p1 = text[i] - 'a';
        int p2 = (i + 1 < len) ? text[i+1] - 'a' : 'x' - 'a';
        
        int c1 = (K[0][0] * p1 + K[0][1] * p2) % 26;
        int c2 = (K[1][0] * p1 + K[1][1] * p2) % 26;
        
        putchar(c1 + 'a');
        putchar(c2 + 'a');
    }
    printf("\n");
}

void hillDecrypt(char *text) {
    int len = strlen(text);
    printf("\n[Decrypted Plaintext]: ");
    for (int i = 0; i < len; i += 2) {
        int c1 = text[i] - 'a';
        int c2 = text[i+1] - 'a';
        
        int p1 = (K_inv[0][0] * c1 + K_inv[0][1] * c2) % 26;
        int p2 = (K_inv[1][0] * c1 + K_inv[1][1] * c2) % 26;
        
        putchar(p1 + 'a');
        putchar(p2 + 'a');
    }
    printf("\n");
}

int main() {
    char plaintext[] = "meetmeattheusualplaceattenratherthaneightoclock";
    char ciphertext[] = "ukixukydromeiwszxwiokunukhxhroajroanqyebtlkjegad";

    printf("=== HILL CIPHER ENCRYPTION & DECRYPTION ===\n");
    hillEncrypt(plaintext);
    hillDecrypt(ciphertext);
    return 0;
}
