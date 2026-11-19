
#include <stdio.h>

int main()
{
    int p[20], e[20], d[20];
    int n, key, iv, i, prev;

    printf("Enter number of blocks: ");
    scanf("%d", &n);

    printf("Enter plaintext blocks (0-255):\n");
    for(i = 0; i < n; i++)
        scanf("%d", &p[i]);

    printf("Enter key (0-255): ");
    scanf("%d", &key);

    printf("Enter IV (0-255): ");
    scanf("%d", &iv);

    // ECB
    printf("\nECB Mode:\n");
    for(i = 0; i < n; i++)
        e[i] = p[i] ^ key;

    for(i = 0; i < n; i++)
        printf("%d ", e[i]);

    // CBC
    printf("\n\nCBC Mode:\n");
    prev = iv;

    for(i = 0; i < n; i++)
    {
        e[i] = (p[i] ^ prev) ^ key;
        prev = e[i];
        printf("%d ", e[i]);
    }

    // CFB
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

