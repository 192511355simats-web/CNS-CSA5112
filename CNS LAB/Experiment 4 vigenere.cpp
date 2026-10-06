#include <stdio.h>
#include <string.h>
#include <ctype.h>

int main()
{
    char text[100], key[100];
    int i, j=0, k, ch;

    printf("1.Encrypt  2.Decrypt: ");
    scanf("%d",&ch);
    getchar();

    printf("Text: ");
    gets(text);

    printf("Key: ");
    gets(key);

    for(i=0;text[i];i++)
    {
        if(isalpha(text[i]))
        {
            k=toupper(key[j%strlen(key)])-'A';

            if(ch==1)
                text[i]=(toupper(text[i])-'A'+k)%26+'A';
            else
                text[i]=(toupper(text[i])-'A'-k+26)%26+'A';

            j++;
        }
    }

    printf("Result: %s",text);

    return 0;
}
