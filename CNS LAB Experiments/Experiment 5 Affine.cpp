#include <stdio.h>
#include <ctype.h>

int main()
{
    char text[100];
    int a,b,i,p,inv,ch;

    printf("1.Encrypt  2.Decrypt: ");
    scanf("%d",&ch);
    getchar();

    printf("Text: ");
    gets(text);

    printf("Enter a and b: ");
    scanf("%d%d",&a,&b);

    /* Multiplicative inverse of a */
    for(inv=1; (a*inv)%26!=1; inv++);

    for(i=0;text[i];i++)
    {
        if(isalpha(text[i]))
        {
            p=toupper(text[i])-'A';

            if(ch==1)
                text[i]=(a*p+b)%26+'A';
            else
                text[i]=(inv*(p-b+26))%26+'A';
        }
    }

    printf("Result: %s",text);

    return 0;
}
