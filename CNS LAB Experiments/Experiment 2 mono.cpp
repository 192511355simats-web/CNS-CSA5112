#include <stdio.h>
#include <string.h>
#include <ctype.h>

int main()
{
    char text[100];
    char key[] = "QWERTYUIOPASDFGHJKLZXCVBNM";
    char rev[] = "KXVMCNZLQOWPYSFJUIRATBGHE D";
    int i, j, choice;

    printf("1. Encryption\n");
    printf("2. Decryption\n");
    printf("Enter choice: ");
    scanf("%d", &choice);
    getchar();

    printf("Enter text: ");
    gets(text);

    for(i = 0; text[i] != '\0'; i++)
    {
        if(isalpha(text[i]))
        {
            text[i] = toupper(text[i]);

            if(choice == 1)
                text[i] = key[text[i] - 'A'];
            else
            {
                for(j = 0; j < 26; j++)
                {
                    if(key[j] == text[i])
                    {
                        text[i] = 'A' + j;
                        break;
                    }
                }
            }
        }
    }

    if(choice == 1)
        printf("Encrypted Text: %s", text);
    else
        printf("Decrypted Text: %s", text);

    return 0;
}
