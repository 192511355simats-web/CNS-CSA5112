#include <stdio.h>
#include <string.h>
#include <ctype.h>

const char ENG_ORDER[] = "ETAOINSHRDLCUMWFGYPBVKJXQZ";
const char *COMMON_BIGRAMS[] = {
    "TH", "HE", "IN", "ER", "AN", "RE", "ON", "AT", "EN", "ND",
    "TI", "ES", "OR", "TE", "OF", "ED", "IS", "IT", "AL", "AR"
};

int scoreBigramFitness(const char *text) {
    int score = 0;
    int len = strlen(text);
    for (int i = 0; i < len - 1; i++) {
        if (isalpha(text[i]) && isalpha(text[i + 1])) {
            char bg[3] = { (char)toupper(text[i]), (char)toupper(text[i + 1]), '\0' };
            for (int b = 0; b < 20; b++) {
                if (strcmp(bg, COMMON_BIGRAMS[b]) == 0) {
                    score += (20 - b);
                    break;
                }
            }
        }
    }
    return score;
}

void applyKey(const char *cipher, const char *keyMap, char *dest) {
    for (int i = 0; cipher[i] != '\0'; i++) {
        if (isalpha(cipher[i])) {
            char c = toupper(cipher[i]);
            char p = keyMap[c - 'A'];
            dest[i] = isupper(cipher[i]) ? p : tolower(p);
        } else {
            dest[i] = cipher[i];
        }
    }
    dest[strlen(cipher)] = '\0';
}

int main() {
    char cipher[512], cipherRank[27];
    int topN, freq[26] = {0};

    printf("Enter monoalphabetic ciphertext: ");
    fgets(cipher, sizeof(cipher), stdin);
    cipher[strcspn(cipher, "\n")] = '\0';

    printf("Enter number of top plaintexts to display: ");
    scanf("%d", &topN);

    for (int i = 0; cipher[i] != '\0'; i++) {
        if (isalpha(cipher[i])) freq[toupper(cipher[i]) - 'A']++;
    }

    for (int i = 0; i < 26; i++) cipherRank[i] = 'A' + i;
    cipherRank[26] = '\0';

    for (int i = 0; i < 25; i++) {
        for (int j = i + 1; j < 26; j++) {
            if (freq[cipherRank[j] - 'A'] > freq[cipherRank[i] - 'A']) {
                char t = cipherRank[i];
                cipherRank[i] = cipherRank[j];
                cipherRank[j] = t;
            }
        }
    }

    // Generate candidate keys via pairwise swaps on frequency mapping
    char candidates[50][512];
    int scores[50];
    int totalCand = 0;

    for (int step = 0; step < 26 && totalCand < 50; step++) {
        char plainOrder[27];
        strcpy(plainOrder, ENG_ORDER);
        if (step > 0) {
            char t = plainOrder[step - 1];
            plainOrder[step - 1] = plainOrder[step];
            plainOrder[step] = t;
        }

        char keyMap[26];
        for (int i = 0; i < 26; i++) {
            keyMap[cipherRank[i] - 'A'] = plainOrder[i];
        }

        applyKey(cipher, keyMap, candidates[totalCand]);
        scores[totalCand] = scoreBigramFitness(candidates[totalCand]);
        totalCand++;
    }

    // Sort candidates by descending bigram fitness score
    for (int i = 0; i < totalCand - 1; i++) {
        for (int j = i + 1; j < totalCand; j++) {
            if (scores[j] > scores[i]) {
                int ts = scores[i]; scores[i] = scores[j]; scores[j] = ts;
                char tmp[512];
                strcpy(tmp, candidates[i]);
                strcpy(candidates[i], candidates[j]);
                strcpy(candidates[j], tmp);
            }
        }
    }

    printf("\nTop %d Ranked Plaintexts (Bigram-Scored):\n", topN);
    for (int i = 0; i < topN && i < totalCand; i++) {
        printf("%2d. [Score=%3d]: %s\n", i + 1, scores[i], candidates[i]);
    }

    return 0;
}
