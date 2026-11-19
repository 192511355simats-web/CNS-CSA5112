#include <stdio.h>
#include <string.h>
#include <ctype.h>

const char ENG_FREQ[] = "ETAOINSHRDLCUMWFGYPBVKJXQZ";

void decryptWithMapping(const char *cipher, const char *cipherRank, const char *plainRank, char *out) {
    char map[26];
    for (int i = 0; i < 26; i++) {
        map[cipherRank[i] - 'A'] = plainRank[i];
    }
    for (int i = 0; cipher[i] != '\0'; i++) {
        if (isalpha(cipher[i])) {
            char upper = toupper(cipher[i]);
            char dec = map[upper - 'A'];
            out[i] = isupper(cipher[i]) ? dec : tolower(dec);
        } else {
            out[i] = cipher[i];
        }
    }
    out[strlen(cipher)] = '\0';
}

int main() {
    char cipher[512], output[512];
    int topN, freq[26] = {0};
    char cipherRank[27];

    printf("Enter ciphertext: ");
    fgets(cipher, sizeof(cipher), stdin);
    cipher[strcspn(cipher, "\n")] = '\0';

    printf("Enter number of top plaintexts to display: ");
    scanf("%d", &topN);

    for (int i = 0; cipher[i] != '\0'; i++) {
        if (isalpha(cipher[i])) {
            freq[toupper(cipher[i]) - 'A']++;
        }
    }

    for (int i = 0; i < 26; i++) cipherRank[i] = 'A' + i;
    cipherRank[26] = '\0';

    // Sort cipher letters by descending frequency
    for (int i = 0; i < 25; i++) {
        for (int j = i + 1; j < 26; j++) {
            if (freq[cipherRank[j] - 'A'] > freq[cipherRank[i] - 'A']) {
                char tmp = cipherRank[i];
                cipherRank[i] = cipherRank[j];
                cipherRank[j] = tmp;
            }
        }
    }

    printf("\nTop %d Possible Plaintexts:\n", topN);
    char currentPlainRank[27];
    strcpy(currentPlainRank, ENG_FREQ);

    // Candidate 1: Direct frequency mapping
    decryptWithMapping(cipher, cipherRank, currentPlainRank, output);
    printf("1: %s\n", output);

    // Subsequent candidates: Swap adjacent letters in English frequency order
    int count = 1;
    for (int i = 0; i < 25 && count < topN; i++) {
        strcpy(currentPlainRank, ENG_FREQ);
        char tmp = currentPlainRank[i];
        currentPlainRank[i] = currentPlainRank[i + 1];
        currentPlainRank[i + 1] = tmp;

        decryptWithMapping(cipher, cipherRank, currentPlainRank, output);
        printf("%d: %s\n", ++count, output);
    }

    return 0;
}
