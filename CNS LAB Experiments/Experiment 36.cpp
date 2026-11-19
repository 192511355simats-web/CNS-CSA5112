#include <stdio.h>
#include <string.h>
#include <ctype.h>

int gcd(int a, int b) {
    while (b != 0) {
        int temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

int modInverse(int a, int m) {
    a = a % m;
    for (int x = 1; x < m; x++) {
        if ((a * x) % m == 1)
            return x;
    }
    return -1;
}

void affineEncrypt(char *text, int a, int b) {
    for (int i = 0; text[i] != '\0'; i++) {
        if (isalpha(text[i])) {
            char base = isupper(text[i]) ? 'A' : 'a';
            int p = text[i] - base;
            text[i] = ((a * p + b) % 26) + base;
        }
    }
}

void affineDecrypt(char *text, int a, int b) {
    int a_inv = modInverse(a, 26);
    for (int i = 0; text[i] != '\0'; i++) {
        if (isalpha(text[i])) {
            char base = isupper(text[i]) ? 'A' : 'a';
            int c = text[i] - base;
            int p = (a_inv * (c - b + 26)) % 26;
            text[i] = p + base;
        }
    }
}

int main() {
    int a, b;
    char text[256];

    printf("Enter key values a and b: ");
    scanf("%d %d", &a, &b);
    getchar(); // consume newline

    if (gcd(a, 26) != 1) {
        printf("Invalid key: gcd(%d, 26) != 1. Cipher is NOT one-to-one.\n", a);
        printf("Collision example: E([%d,%d], 0) = %d and E([%d,%d], 13) = %d\n",
               a, b, (a * 0 + b) % 26, a, b, (a * 13 + b) % 26);
        return 0;
    }

    printf("Enter plaintext: ");
    fgets(text, sizeof(text), stdin);
    text[strcspn(text, "\n")] = '\0';

    affineEncrypt(text, a, b);
    printf("Encrypted Ciphertext: %s\n", text);

    affineDecrypt(text, a, b);
    printf("Decrypted Plaintext:  %s\n", text);

    return 0;
}
