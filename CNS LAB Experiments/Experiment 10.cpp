
#include <stdio.h>
#include <string.h>
#include <ctype.h>

char matrix[5][5] = {
    {'M','F','H','I','K'},
    {'U','N','O','P','Q'},
    {'Z','V','W','X','Y'},
    {'E','L','A','R','G'},
    {'D','S','T','B','C'}
};

void findPosition(char c, int *r, int *col) {
    if (c == 'J')
        c = 'I';

    for (int i = 0; i < 5; i++) {
        for (int j = 0; j < 5; j++) {
            if (matrix[i][j] == c) {
                *r = i;
                *col = j;
                return;
            }
        }
    }
}

int main() {
    char text[] = "Must see you over Cadogan West. Coming at once.";
    char plain[256], result[512];

    int len = 0, k = 0;

    printf("=== PLAYFAIR CIPHER ===\n");

    printf("\nGiven Message:\n%s\n", text);

    // Convert to uppercase and remove spaces
    for (int i = 0; text[i] != '\0'; i++) {
        char c = toupper((unsigned char)text[i]);

        if (c >= 'A' && c <= 'Z') {
            if (c == 'J')
                c = 'I';

            plain[len++] = c;
        }
    }

    plain[len] = '\0';

    // Encrypt letter pairs
    for (int i = 0; i < len;) {
        char a = plain[i];
        char b;

        if (i + 1 >= len) {
            b = 'X';
            i++;
        }
        else if (plain[i] == plain[i + 1]) {
            b = 'X';
            i++;
        }
        else {
            b = plain[i + 1];
            i += 2;
        }

        int r1, c1, r2, c2;

        findPosition(a, &r1, &c1);
        findPosition(b, &r2, &c2);

        // Same row
        if (r1 == r2) {
            c1 = (c1 + 1) % 5;
            c2 = (c2 + 1) % 5;
        }

        // Same column
        else if (c1 == c2) {
            r1 = (r1 + 1) % 5;
            r2 = (r2 + 1) % 5;
        }

        // Rectangle rule
        else {
            int temp = c1;
            c1 = c2;
            c2 = temp;
        }

        result[k++] = matrix[r1][c1];
        result[k++] = matrix[r2][c2];
    }

    result[k] = '\0';

    printf("\nEncrypted Message:\n%s\n", result);

    return 0;
}

