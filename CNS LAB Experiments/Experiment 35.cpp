
#include <stdio.h>
#include <string.h>

int main()
{
    char plaintext[100];
    int key[100], ciphertext[100];
    int n, i;

    printf("Enter plaintext: ");
    scanf("%99s", plaintext);

    n = strlen(plaintext);

    printf("Enter %d key values (0-25):\n", n);

    for(i = 0; i < n; i++)
        scanf("%d", &key[i]);

    printf("\nEncrypted text: ");

    for(i = 0; i < n; i++)
    {
        ciphertext[i] =
            ((plaintext[i] - 'A') + key[i]) % 26;

        printf("%c", ciphertext[i] + 'A');
    }

    printf("\nDecrypted text: ");

    for(i = 0; i < n; i++)
    {
        int original =
            (ciphertext[i] - key[i] + 26) % 26;

        printf("%c", original + 'A');
    }

    printf("\n");

    return 0;
}

