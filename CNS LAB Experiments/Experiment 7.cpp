#include <stdio.h>
#include <string.h>

void substitute(char *text, char *from, char *to) {
    int map[256];
    for (int i = 0; i < 256; i++) map[i] = i;

    for (int i = 0; from[i] != '\0' && to[i] != '\0'; i++) {
        map[(unsigned char)from[i]] = to[i];
    }

    printf("\n[Result]: ");
    for (int i = 0; text[i] != '\0'; i++) {
        putchar(map[(unsigned char)text[i]]);
    }
    printf("\n");
}

int main() {
    char text[256], from[50], to[50];
    int choice;

    printf("=== SIMPLE SUBSTITUTION CIPHER ===\n");
    printf("1. Encrypt (Plain to Cipher)\n2. Decrypt (Cipher to Plain)\nEnter choice (1-2): ");
    scanf("%d", &choice);
    getchar();

    printf("Enter text: ");
    fgets(text, sizeof(text), stdin);
    text[strcspn(text, "\n")] = 0;

    printf("Enter source alphabet/symbols (e.g., abcdef): ");
    fgets(from, sizeof(from), stdin);
    from[strcspn(from, "\n")] = 0;

    printf("Enter target alphabet/symbols (e.g., 53‡‡†3): ");
    fgets(to, sizeof(to), stdin);
    to[strcspn(to, "\n")] = 0;

    if (choice == 1) substitute(text, from, to);
    else substitute(text, to, from);

    return 0;
}
