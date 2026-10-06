#include <stdio.h>
#include <string.h>
#include <ctype.h>

char m[5][5];

void find(char x,int *r,int *c)
{
    int i,j;
    for(i=0;i<5;i++)
        for(j=0;j<5;j++)
            if(m[i][j]==x){*r=i;*c=j;}
}

int main()
{
    char key[30],s[100],x,y;
    int used[26]={0},i,j,k=0,r1,r2,c1,c2,ch;

    printf("1.Encrypt  2.Decrypt: ");
    scanf("%d",&ch);
    getchar();

    printf("Key: ");
    gets(key);

    printf("Text: ");
    gets(s);

    for(i=0;key[i];i++)
    {
        x=toupper(key[i]);
        if(x=='J') x='I';

        if(x>='A'&&x<='Z'&&!used[x-'A'])
        {
            m[k/5][k%5]=x;
            used[x-'A']=1;
            k++;
        }
    }

    for(i=0;i<26;i++)
        if(i!=9&&!used[i])
        {
            m[k/5][k%5]='A'+i;
            k++;
        }

    printf("Result: ");

    for(i=0;s[i];i+=2)
    {
        x=toupper(s[i]);
        y=toupper(s[i+1]);

        if(x=='J')x='I';
        if(y=='J')y='I';

        find(x,&r1,&c1);
        find(y,&r2,&c2);

        if(r1==r2)
        {
            if(ch==1)
                printf("%c%c",m[r1][(c1+1)%5],m[r2][(c2+1)%5]);
            else
                printf("%c%c",m[r1][(c1+4)%5],m[r2][(c2+4)%5]);
        }
        else if(c1==c2)
        {
            if(ch==1)
                printf("%c%c",m[(r1+1)%5][c1],m[(r2+1)%5][c2]);
            else
                printf("%c%c",m[(r1+4)%5][c1],m[(r2+4)%5][c2]);
        }
        else
            printf("%c%c",m[r1][c2],m[r2][c1]);
    }

    return 0;
}
