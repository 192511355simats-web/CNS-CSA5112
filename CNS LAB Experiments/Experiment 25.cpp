#include <stdio.h>

long long gcd(long long a, long long b) {
    while (b != 0) {
        long long t = b;
        b = a % b;
        a = t;
    }
    return a;
}

long long mod_inverse(long long e, long long phi) {
    long long t = 0, newt = 1, r = phi, newr = e;
    while (newr != 0) {
        long long q = r / newr;
        long long temp = t; t = newt; newt = temp - q * newt;
        temp = r; r = newr; newr = temp - q * newr;
    }
    return (t < 0) ? t + phi : t;
}

long long mod_pow(long long base, long long exp, long long mod) {
    long long res = 1;
    base %= mod;
    while (exp > 0) {
        if (exp % 2 == 1) res = (res * base) % mod;
        base = (base * base) % mod;
        exp /= 2;
    }
    return res;
}

int main() {
    long long n = 3599, e = 31;
    long long c[2] = { mod_pow(118, e, n), mod_pow(42, e, n) };

    printf("Intercepted Ciphertexts: C1 = %lld, C2 = %lld\n", c[0], c[1]);

    long long p = gcd(c[0], n);
    if (p > 1 && p < n) {
        long long q = n / p;
        long long phi = (p - 1) * (q - 1);
        long long d = mod_inverse(e, phi);
        printf("Factor found via GCD: p = %lld, q = %lld\n", p, q);
        printf("Recovered Private Key d = %lld\n", d);
        printf("Decrypted M1 = %lld, M2 = %lld\n", mod_pow(c[0], d, n), mod_pow(c[1], d, n));
    }
    return 0;
}
