
#include <stdio.h>

long long power(int a, int x, int q)
{
    long long result = 1;

    for(int i = 0; i < x; i++)
        result = (result * a) % q;

    return result;
}

int main()
{
    int q, a, xa, xb;
    long long A, B, keyA, keyB;

    printf("Enter prime number q: ");
    scanf("%d", &q);

    printf("Enter primitive root a: ");
    scanf("%d", &a);

    printf("Enter Alice secret number: ");
    scanf("%d", &xa);

    printf("Enter Bob secret number: ");
    scanf("%d", &xb);

    A = power(a, xa, q);
    B = power(a, xb, q);

    keyA = power(B, xa, q);
    keyB = power(A, xb, q);

    printf("\nAlice public value = %lld", A);
    printf("\nBob public value = %lld", B);

    printf("\nAlice shared key = %lld", keyA);
    printf("\nBob shared key = %lld", keyB);

    if(keyA == keyB)
        printf("\nKey Exchange Successful");

    return 0;
}

