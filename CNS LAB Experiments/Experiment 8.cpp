#include <stdio.h>
#include <string.h>
#include <ctype.h>

void generateAlphabet(char *keyword, char cipher[]) {
    int visited[26] = {0};
    int idx = 0;
    for (int i = 0; keyword[i] != '\0'; i++) {
        char c = tolower(keyword[i]);
        if (isalpha(c) && !visited[c - 'a']) {
            visited[c - 'a'] = 1;
            cipher[idx++] = c;
        }
    }
    for (char c = 'a'; c <= 'z'; c++) {
        if (!visited[c - 'a']) {
            cipher[idx++] = c;
        }
    }
    cipher[idx] = '\0';
}

void processMono(char *text, char *keyword, int encrypt) {
    char cipher[27], plain[] = "abcdefghijklmnopqrstuvwxyz";
    generateAlphabet(keyword, cipher);

    printf("\n[Result]: ");
    for (int i = 0; text[i] != '\0'; i++) {
        char c = tolower(text[i]);
        if (c >= 'a' && c <= 'z') {
            if (encrypt) {
                int idx = c - 'a';
                putchar(isupper(text[i]) ? toupper(cipher[idx]) : cipher[idx]);
            } else {
                int idx = -1;
                for (int j = 0; j < 26; j++) {
                    if (cipher[j] == c) { idx = j; break; }
                }
                if (idx != -1) putchar(isupper(text[i]) ? toupper(plain[idx]) : plain[idx]);
            }
        } else {
            putchar(text[i]);
        }
    }
    printf("\n");
}

int main() {
    char text[256], keyword[50];
    int choice;

    printf("=== KEYWORD MONOALPHABETIC CIPHER ===\n");
    printf("1. Encrypt\n2. Decrypt\nEnter choice (1-2): ");
    scanf("%d", &choice);
    getchar();

    printf("Enter text: ");
    fgets(text, sizeof(text), stdin);
    text[strcspn(text, "\n")] = 0;

    printf("Enter keyword (e.g., CIPHER): ");
    fgets(keyword, sizeof(keyword), stdin);
    keyword[strcspn(keyword, "\n")] = 0;

    processMono(text, keyword, choice == 1);
    return 0;
}
