#include <stdio.h>

int extended_gcd(int a, int b, int *x, int *y) {
    if (a == 0) {
        *x = 0; *y = 1;
        return b;
    }
    int x1, y1;
    int gcd = extended_gcd(b % a, a, &x1, &y1);
    *x = y1 - (b / a) * x1;
    *y = x1;
    return gcd;
}

int main() {
    int e = 31, n = 3599, p = 0, q = 0;

    for (int i = 2; i * i <= n; i++) {
        if (n % i == 0) {
            p = i;
            q = n / i;
            break;
        }
    }

    int phi = (p - 1) * (q - 1);
    int x, y;
    extended_gcd(e, phi, &x, &y);
    int d = (x % phi + phi) % phi;

    printf("Factors of %d: p = %d, q = %d\n", n, p, q);
    printf("Euler's Totient phi(n) = %d\n", phi);
    printf("Private Key d = %d\n", d);
    return 0;
}
