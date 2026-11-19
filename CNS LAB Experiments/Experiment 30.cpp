
#include <stdio.h>

int main()
{
    int X, T;
    int secondBlock, result;

    printf("Enter one-block message X: ");
    scanf("%d", &X);

    printf("Enter CBC-MAC value T: ");
    scanf("%d", &T);

    secondBlock = X ^ T;

    result = secondBlock ^ T;

    printf("\nOriginal message: %d", X);

    printf("\nFirst block: %d", X);
    printf("\nSecond block: %d", secondBlock);

    printf("\nFinal CBC input: %d", result);

    if(result == X)
        printf("\nCBC-MAC forgery demonstrated!");

    return 0;
}

