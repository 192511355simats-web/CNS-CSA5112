#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

static const double ENG[26] = {8.17,1.49,2.78,4.25,12.70,2.23,2.02,6.09,6.97,0.15,0.77,
    4.03,2.41,6.75,7.51,1.93,0.10,5.99,6.33,9.06,2.76,0.98,2.36,0.15,1.97,0.07};
typedef struct { int shift; double chi; char text[1024]; } Cand;

int cmp(const void *a, const void *b) {
    double d = ((const Cand *)a)->chi - ((const Cand *)b)->chi;
    return (d > 0) - (d < 0);
}
void shift_text(const char *c, int k, char *out) {   /* decrypt with shift k, keep non-letters */
    int i;
    for (i = 0; c[i]; i++)
        out[i] = isalpha((unsigned char)c[i]) ? 'a' + ((tolower(c[i]) - 'a' - k + 26) % 26) : c[i];
    out[i] = '\0';
}
double chi_square(const char *t) {
    int cnt[26] = {0}, n = 0;
    for (int i = 0; t[i]; i++) if (isalpha((unsigned char)t[i])) { cnt[tolower(t[i]) - 'a']++; n++; }
    double chi = 0;
    for (int i = 0; i < 26; i++) {
        double e = n * ENG[i] / 100.0, d = cnt[i] - e;
        chi += d * d / e;
    }
    return chi;                                   /* lower = more English-like */
}
int main(int argc, char **argv) {
    int top = 10;
    char cipher[1024];
    if (argc > 1) top = atoi(argv[1]);
    if (argc > 2) strncpy(cipher, argv[2], sizeof cipher - 1), cipher[sizeof cipher - 1] = 0;
    else {                                         /* demo: shift of 7 */
        const char *pt = "the quick brown fox jumps over the lazy dog and runs away from the farmer";
        int i; for (i = 0; pt[i]; i++) cipher[i] = isalpha((unsigned char)pt[i]) ? 'a' + (pt[i]-'a'+7)%26 : pt[i];
        cipher[i] = 0;
    }
    if (top < 1) top = 1; if (top > 26) top = 26;
    Cand c[26];
    for (int k = 0; k < 26; k++) {
        c[k].shift = k;
        shift_text(cipher, k, c[k].text);
        c[k].chi = chi_square(c[k].text);
    }
    qsort(c, 26, sizeof(Cand), cmp);
    printf("Ciphertext: %s\nTop %d candidate plaintexts (best first):\n", cipher, top);
    for (int i = 0; i < top; i++)
        printf("%2d. key=%2d  chi2=%8.2f  %s\n", i + 1, c[i].shift, c[i].chi, c[i].text);
    return 0;
}
