
#include <stdio.h>

int main()
{
    int n = 3599;
    int old_e = 31;
    int old_d = 3031;

    int new_e = 7;
    int new_d = 0;
    int phi = 3480;
    int i;

    printf("RSA Key Security\n");
    printf("Old public key: (%d, %d)\n", old_e, n);
    printf("Leaked private key: %d\n", old_d);

    for(i = 1; i < phi; i++)
    {
        if((new_e * i) % phi == 1)
        {
            new_d = i;
            break;
        }
    }

    printf("New public key: (%d, %d)\n", new_e, n);
    printf("New private key: %d\n", new_d);

    printf("\nWarning: Modulus is unchanged!\n");
    printf("Generating a new key pair with the same modulus is unsafe.\n");

    return 0;
}

