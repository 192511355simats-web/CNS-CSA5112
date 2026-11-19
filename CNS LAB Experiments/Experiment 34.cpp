
#include <stdio.h>

int main()
{
    int p[20], e[20], n, key, iv;
    int prev, i;

    printf("Enter number of plaintext blocks: ");
    scanf("%d", &n);

    printf("Enter plaintext blocks (0-255):\n");
    for(i = 0; i < n; i++)
        scanf("%d", &p[i]);

    printf("Enter key: ");
    scanf("%d", &key);

    printf("Enter IV: ");
    scanf("%d", &iv);

    // ECB Mode
    printf("\nECB Mode:\n");
    for(i = 0; i < n; i++)
    {
        e[i] = p[i] ^ key;
        printf("%d ", e[i]);
    }

    // CBC Mode
    printf("\n\nCBC Mode:\n");
    prev = iv;

    for(i = 0; i < n; i++)
    {
        e[i] = (p[i] ^ prev) ^ key;
        prev = e[i];
        printf("%d ", e[i]);
    }

    // CFB Mode
    printf("\n\nCFB Mode:\n");
    prev = iv;

    for(i = 0; i < n; i++)
    {
        e[i] = p[i] ^ (prev ^ key);
        prev = e[i];
        printf("%d ", e[i]);
    }

    printf("\n");
    return 0;
}

