#include <stdio.h>
#include <string.h>
#include <ctype.h>

int modInverse(int a, int m) {
    a = a % m;
    for (int x = 1; x < m; x++) {
        if ((a * x) % m == 1) return x;
    }
    return -1;
}

void encryptAffine(char *text, int a, int b) {
    printf("\n[Encrypted Ciphertext]: ");
    for (int i = 0; text[i] != '\0'; i++) {
        char c = text[i];
        if (isupper(c)) putchar(((a * (c - 'A') + b) % 26) + 'A');
        else if (islower(c)) putchar(((a * (c - 'a') + b) % 26) + 'a');
        else putchar(c);
    }
    printf("\n");
}

void decryptAffine(char *text, int a, int b) {
    int a_inv = modInverse(a, 26);
    if (a_inv == -1) {
        printf("\n[Error]: Key 'a' must be coprime with 26 (e.g., 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25).\n");
        return;
    }
    printf("\n[Decrypted Plaintext]:  ");
    for (int i = 0; text[i] != '\0'; i++) {
        char c = text[i];
        if (isupper(c)) putchar((a_inv * (c - 'A' - b + 26) % 26) + 'A');
        else if (islower(c)) putchar((a_inv * (c - 'a' - b + 26) % 26) + 'a');
        else putchar(c);
    }
    printf("\n");
}

int main() {
    char text[256];
    int choice, a, b;

    printf("=== AFFINE CIPHER PROGRAM ===\n");
    printf("1. Encrypt\n2. Decrypt\nEnter choice (1-2): ");
    scanf("%d", &choice);
    getchar(); // consume newline

    printf("Enter text: ");
    fgets(text, sizeof(text), stdin);
    text[strcspn(text, "\n")] = 0;

    printf("Enter key 'a' (coprime to 26, e.g., 3): ");
    scanf("%d", &a);
    printf("Enter key 'b' (e.g., 15): ");
    scanf("%d", &b);

    if (choice == 1) encryptAffine(text, a, b);
    else if (choice == 2) decryptAffine(text, a, b);
    else printf("Invalid choice!\n");

    return 0;
}
