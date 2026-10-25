
#include <stdio.h>
#include <string.h>
#include <ctype.h>

char matrix[5][5];

void generateMatrix(char key[]) {
    int used[26] = {0};
    int k = 0;

    used['j' - 'a'] = 1;

    for (int i = 0; key[i] != '\0'; i++) {
        char c = tolower((unsigned char)key[i]);

        if (c == 'j')
            c = 'i';

        if (c >= 'a' && c <= 'z' && !used[c - 'a']) {
            matrix[k / 5][k % 5] = c;
            used[c - 'a'] = 1;
            k++;
        }
    }

    for (char c = 'a'; c <= 'z'; c++) {
        if (!used[c - 'a']) {
            matrix[k / 5][k % 5] = c;
            k++;
        }
    }
}

void findPosition(char c, int *row, int *col) {
    if (c == 'j')
        c = 'i';

    for (int i = 0; i < 5; i++) {
        for (int j = 0; j < 5; j++) {
            if (matrix[i][j] == c) {
                *row = i;
                *col = j;
                return;
            }
        }
    }
}

void process(char text[], int encrypt) {
    char input[512];
    char result[512];

    int len = 0;
    int k = 0;

    // Convert text to lowercase and remove spaces
    for (int i = 0; text[i] != '\0'; i++) {
        char c = tolower((unsigned char)text[i]);

        if (c >= 'a' && c <= 'z') {
            if (c == 'j')
                c = 'i';

            input[len++] = c;
        }
    }

    input[len] = '\0';

    // Prepare plaintext pairs during encryption
    if (encrypt) {
        char prepared[512];
        int p = 0;

        for (int i = 0; i < len;) {
            char a = input[i];

            prepared[p++] = a;

            if (i + 1 >= len) {
                prepared[p++] = 'x';
                i++;
            }
            else if (input[i] == input[i + 1]) {
                prepared[p++] = 'x';
                i++;
            }
            else {
                prepared[p++] = input[i + 1];
                i += 2;
            }
        }

        prepared[p] = '\0';

        strcpy(input, prepared);
        len = p;
    }

    // Encrypt or decrypt letter pairs
    for (int i = 0; i + 1 < len; i += 2) {
        char a = input[i];
        char b = input[i + 1];

        int r1, c1, r2, c2;

        findPosition(a, &r1, &c1);
        findPosition(b, &r2, &c2);

        if (r1 == r2) {
            c1 = (c1 + (encrypt ? 1 : 4)) % 5;
            c2 = (c2 + (encrypt ? 1 : 4)) % 5;
        }
        else if (c1 == c2) {
            r1 = (r1 + (encrypt ? 1 : 4)) % 5;
            r2 = (r2 + (encrypt ? 1 : 4)) % 5;
        }
        else {
            int temp = c1;
            c1 = c2;
            c2 = temp;
        }

        result[k++] = matrix[r1][c1];
        result[k++] = matrix[r2][c2];
    }

    result[k] = '\0';

    printf("\n[Processed Result]: %s\n", result);
}

int main() {
    char text[256];
    char key[100];
    int choice;

    printf("=== PLAYFAIR CIPHER ===\n");
    printf("1. Encrypt\n");
    printf("2. Decrypt\n");

    printf("Enter choice (1-2): ");
    scanf("%d", &choice);
    getchar();

    if (choice != 1 && choice != 2) {
        printf("Invalid choice!\n");
        return 0;
    }

    printf("Enter text: ");
    fgets(text, sizeof(text), stdin);
    text[strcspn(text, "\n")] = '\0';

    printf("Enter Playfair Passphrase Key: ");
    fgets(key, sizeof(key), stdin);
    key[strcspn(key, "\n")] = '\0';

    generateMatrix(key);

    printf("\n[Playfair Matrix]:\n");

    for (int i = 0; i < 5; i++) {
        for (int j = 0; j < 5; j++) {
            printf("%c ", matrix[i][j]);
        }
        printf("\n");
    }

    if (choice == 1)
        process(text, 1);
    else
        process(text, 0);

    return 0;
}

