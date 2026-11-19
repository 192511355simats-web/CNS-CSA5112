#include <stdio.h>
#include <string.h>
#include <ctype.h>

const double ENG_PROB[26] = {
    0.08167, 0.01492, 0.02782, 0.04253, 0.12702, 0.02228, 0.02015,
    0.06094, 0.06966, 0.00153, 0.00772, 0.04025, 0.02406, 0.06749,
    0.07507, 0.01929, 0.00095, 0.05987, 0.06327, 0.09056, 0.02758,
    0.00978, 0.02360, 0.00150, 0.01974, 0.00074
};

typedef struct {
    int key;
    double chi2;
    char text[512];
} Candidate;

double computeChiSquared(const char *text) {
    int count[26] = {0}, total = 0;
    for (int i = 0; text[i] != '\0'; i++) {
        if (isalpha(text[i])) {
            count[toupper(text[i]) - 'A']++;
            total++;
        }
    }
    if (total == 0) return 1e9;

    double chi2 = 0.0;
    for (int i = 0; i < 26; i++) {
        double expected = total * ENG_PROB[i];
        double diff = count[i] - expected;
        chi2 += (diff * diff) / expected;
    }
    return chi2;
}

int main() {
    char cipher[512];
    int topN;
    Candidate list[26];

    printf("Enter additive ciphertext: ");
    fgets(cipher, sizeof(cipher), stdin);
    cipher[strcspn(cipher, "\n")] = '\0';

    printf("Enter number of top plaintexts to display (1-26): ");
    scanf("%d", &topN);
    if (topN > 26) topN = 26;

    for (int k = 0; k < 26; k++) {
        list[k].key = k;
        for (int i = 0; cipher[i] != '\0'; i++) {
            if (isalpha(cipher[i])) {
                char base = isupper(cipher[i]) ? 'A' : 'a';
                list[k].text[i] = ((cipher[i] - base - k + 26) % 26) + base;
            } else {
                list[k].text[i] = cipher[i];
            }
        }
        list[k].text[strlen(cipher)] = '\0';
        list[k].chi2 = computeChiSquared(list[k].text);
    }

    // Sort candidates by ascending Chi-squared score (best fit first)
    for (int i = 0; i < 25; i++) {
        for (int j = i + 1; j < 26; j++) {
            if (list[j].chi2 < list[i].chi2) {
                Candidate tmp = list[i];
                list[i] = list[j];
                list[j] = tmp;
            }
        }
    }

    printf("\nTop %d Most Likely Plaintexts:\n", topN);
    for (int i = 0; i < topN; i++) {
        printf("%2d. [Key=%2d, Chi2=%6.2f]: %s\n",
               i + 1, list[i].key, list[i].chi2, list[i].text);
    }

    return 0;
}
