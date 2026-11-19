#include <stdio.h>
#include <stdint.h>

// Permutation helper (1-based indexing from MSB)
uint16_t permute(uint16_t in, const int *p, int p_len, int in_len) {
    uint16_t out = 0;
    for (int i = 0; i < p_len; i++) {
        out = (out << 1) | ((in >> (in_len - p[i])) & 1);
    }
    return out;
}

uint8_t left_shift_5(uint8_t val, int shifts) {
    return ((val << shifts) | (val >> (5 - shifts))) & 0x1F;
}

void generate_keys(uint16_t key, uint8_t *k1, uint8_t *k2) {
    const int P10[] = {3, 5, 2, 7, 4, 10, 1, 9, 8, 6};
    const int P8[]  = {6, 3, 7, 4, 8, 5, 10, 9};
    uint16_t p10 = permute(key, P10, 10, 10);
    uint8_t left = left_shift_5((p10 >> 5) & 0x1F, 1);
    uint8_t right = left_shift_5(p10 & 0x1F, 1);
    *k1 = permute((left << 5) | right, P8, 8, 10);
    left = left_shift_5(left, 2);
    right = left_shift_5(right, 2);
    *k2 = permute((left << 5) | right, P8, 8, 10);
}

uint8_t fk(uint8_t in, uint8_t sk) {
    const int EP[] = {4, 1, 2, 3, 2, 3, 4, 1};
    const int P4[] = {2, 4, 3, 1};
    const int S0[4][4] = {{1,0,3,2},{3,2,1,0},{0,2,1,3},{3,1,3,2}};
    const int S1[4][4] = {{0,1,2,3},{2,0,1,3},{3,0,1,0},{2,1,0,3}};

    uint8_t L = (in >> 4) & 0x0F, R = in & 0x0F;
    uint8_t ep = permute(R, EP, 8, 4) ^ sk;
    uint8_t r0 = ((ep >> 7) & 1) << 1 | ((ep >> 4) & 1);
    uint8_t c0 = ((ep >> 6) & 1) << 1 | ((ep >> 5) & 1);
    uint8_t r1 = ((ep >> 3) & 1) << 1 | (ep & 1);
    uint8_t c1 = ((ep >> 2) & 1) << 1 | ((ep >> 1) & 1);
    uint8_t s_out = (S0[r0][c0] << 2) | S1[r1][c1];
    return ((L ^ permute(s_out, P4, 4, 4)) << 4) | R;
}

uint8_t sdes_encrypt(uint8_t pt, uint16_t key) {
    const int IP[] = {2, 6, 3, 1, 4, 8, 5, 7};
    const int IP_INV[] = {4, 1, 3, 5, 7, 2, 8, 6};
    uint8_t k1, k2;
    generate_keys(key, &k1, &k2);
    uint8_t x = permute(pt, IP, 8, 8);
    x = fk(x, k1);
    x = ((x & 0x0F) << 4) | ((x >> 4) & 0x0F); // SW
    x = fk(x, k2);
    return permute(x, IP_INV, 8, 8);
}

uint8_t sdes_decrypt(uint8_t ct, uint16_t key) {
    const int IP[] = {2, 6, 3, 1, 4, 8, 5, 7};
    const int IP_INV[] = {4, 1, 3, 5, 7, 2, 8, 6};
    uint8_t k1, k2;
    generate_keys(key, &k1, &k2);
    uint8_t x = permute(ct, IP, 8, 8);
    x = fk(x, k2);
    x = ((x & 0x0F) << 4) | ((x >> 4) & 0x0F); // SW
    x = fk(x, k1);
    return permute(x, IP_INV, 8, 8);
}

void print_bin(uint8_t val) {
    for (int i = 7; i >= 0; i--) {
        printf("%d", (val >> i) & 1);
        if (i == 4) printf(" ");
    }
}

int main() {
    uint8_t iv = 0b10101010;
    uint16_t key = 0b0111111101;
    uint8_t pt[2] = {0b00000001, 0b00100011};
    uint8_t ct[2], dec[2];

    // CBC Encrypt
    uint8_t prev = iv;
    for (int i = 0; i < 2; i++) {
        ct[i] = sdes_encrypt(pt[i] ^ prev, key);
        prev = ct[i];
    }

    // CBC Decrypt
    prev = iv;
    for (int i = 0; i < 2; i++) {
        dec[i] = sdes_decrypt(ct[i], key) ^ prev;
        prev = ct[i];
    }

    printf("Plaintext : "); print_bin(pt[0]); printf(" "); print_bin(pt[1]); printf("\n");
    printf("Ciphertext: "); print_bin(ct[0]); printf(" "); print_bin(ct[1]); printf("\n");
    printf("Decrypted : "); print_bin(dec[0]); printf(" "); print_bin(dec[1]); printf("\n");
    return 0;
}
