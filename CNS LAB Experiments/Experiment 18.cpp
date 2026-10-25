#include <stdio.h>
#include <stdlib.h>
#include <string.h>
typedef unsigned char u8;

static const int IP[64]={58,50,42,34,26,18,10,2,60,52,44,36,28,20,12,4,62,54,46,38,30,22,14,6,64,56,48,40,32,24,16,8,
57,49,41,33,25,17,9,1,59,51,43,35,27,19,11,3,61,53,45,37,29,21,13,5,63,55,47,39,31,23,15,7};
static const int FP[64]={40,8,48,16,56,24,64,32,39,7,47,15,55,23,63,31,38,6,46,14,54,22,62,30,37,5,45,13,53,21,61,29,
36,4,44,12,52,20,60,28,35,3,43,11,51,19,59,27,34,2,42,10,50,18,58,26,33,1,41,9,49,17,57,25};
static const int E[48]={32,1,2,3,4,5,4,5,6,7,8,9,8,9,10,11,12,13,12,13,14,15,16,17,
16,17,18,19,20,21,20,21,22,23,24,25,24,25,26,27,28,29,28,29,30,31,32,1};
static const int P[32]={16,7,20,21,29,12,28,17,1,15,23,26,5,18,31,10,2,8,24,14,32,27,3,9,19,13,30,6,22,11,4,25};
static const int PC1[56]={57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,27,19,11,3,60,52,44,36,
63,55,47,39,31,23,15,7,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,28,20,12,4};
static const int PC2[48]={14,17,11,24,1,5,3,28,15,6,21,10,23,19,12,4,26,8,16,7,27,20,13,2,
41,52,31,37,47,55,30,40,51,45,33,48,44,49,39,56,34,53,46,42,50,36,29,32};
static const int SH[16]={1,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1};
static const int S[8][64]={
{14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7,0,15,7,4,14,2,13,1,10,6,12,11,9,5,3,8,4,1,14,8,13,6,2,11,15,12,9,7,3,10,5,0,15,12,8,2,4,9,1,7,5,11,3,14,10,0,6,13},
{15,1,8,14,6,11,3,4,9,7,2,13,12,0,5,10,3,13,4,7,15,2,8,14,12,0,1,10,6,9,11,5,0,14,7,11,10,4,13,1,5,8,12,6,9,3,2,15,13,8,10,1,3,15,4,2,11,6,7,12,0,5,14,9},
{10,0,9,14,6,3,15,5,1,13,12,7,11,4,2,8,13,7,0,9,3,4,6,10,2,8,5,14,12,11,15,1,13,6,4,9,8,15,3,0,11,1,2,12,5,10,14,7,1,10,13,0,6,9,8,7,4,15,14,3,11,5,2,12},
{7,13,14,3,0,6,9,10,1,2,8,5,11,12,4,15,13,8,11,5,6,15,0,3,4,7,2,12,1,10,14,9,10,6,9,0,12,11,7,13,15,1,3,14,5,2,8,4,3,15,0,6,10,1,13,8,9,4,5,11,12,7,2,14},
{2,12,4,1,7,10,11,6,8,5,3,15,13,0,14,9,14,11,2,12,4,7,13,1,5,0,15,10,3,9,8,6,4,2,1,11,10,13,7,8,15,9,12,5,6,3,0,14,11,8,12,7,1,14,2,13,6,15,0,9,10,4,5,3},
{12,1,10,15,9,2,6,8,0,13,3,4,14,7,5,11,10,15,4,2,7,12,9,5,6,1,13,14,0,11,3,8,9,14,15,5,2,8,12,3,7,0,4,10,1,13,11,6,4,3,2,12,9,5,15,10,11,14,1,7,6,0,8,13},
{4,11,2,14,15,0,8,13,3,12,9,7,5,10,6,1,13,0,11,7,4,9,1,10,14,3,5,12,2,15,8,6,1,4,11,13,12,3,7,14,10,15,6,8,0,5,9,2,6,11,13,8,1,4,10,7,9,5,0,15,14,2,3,12},
{13,2,8,4,6,15,11,1,10,9,3,14,5,0,12,7,1,15,13,8,10,3,7,4,12,5,6,11,0,14,9,2,7,11,4,1,9,12,14,2,0,6,10,13,15,3,5,8,2,1,14,7,4,10,8,13,15,12,9,0,3,5,6,11}};

/* ---- helpers: bytes <-> bit arrays (one int per bit, MSB first) ---- */
static void b2bits(const u8 *b, int *bits, int nbytes){
    for(int i=0;i<nbytes*8;i++) bits[i]=(b[i/8]>>(7-i%8))&1;
}
static void bits2b(const int *bits, u8 *b, int nbytes){
    memset(b,0,nbytes);
    for(int i=0;i<nbytes*8;i++) b[i/8]|=bits[i]<<(7-i%8);
}
static void hex2b(const char *s, u8 *b, int n){
    for(int i=0;i<n;i++){ unsigned v; sscanf(s+2*i,"%2x",&v); b[i]=v; }
}
static void phex(const u8 *b, int n){ for(int i=0;i<n;i++) printf("%02X",b[i]); }
static void bits_hex(const int *bits,int n){            /* print n bits as hex (n multiple of 4) */
    for(int i=0;i<n;i+=4) printf("%X",(bits[i]<<3)|(bits[i+1]<<2)|(bits[i+2]<<1)|bits[i+3]);
}
static void rotl28(int *h,int n){ while(n--){ int t=h[0]; memmove(h,h+1,27*sizeof(int)); h[27]=t; } }
static void rotr28(int *h,int n){ while(n--){ int t=h[27]; memmove(h+1,h,27*sizeof(int)); h[0]=t; } }
static void make_cd(const u8 key[8], int cd[56]){
    int kb[64]; b2bits(key,kb,8);
    for(int i=0;i<56;i++) cd[i]=kb[PC1[i]-1];
}
/* encryption key schedule: sk[0..15] = K1..K16 */
static void des_schedule(const u8 key[8], int sk[16][48]){
    int cd[56]; make_cd(key,cd);
    for(int r=0;r<16;r++){
        rotl28(cd,SH[r]); rotl28(cd+28,SH[r]);
        for(int j=0;j<48;j++) sk[r][j]=cd[PC2[j]-1];
    }
}
static void feistel(const int *r,const int *k,int *out){
    int e[48],s[32];
    for(int i=0;i<48;i++) e[i]=r[E[i]-1]^k[i];
    for(int b=0;b<8;b++){
        int *x=e+6*b;
        int row=(x[0]<<1)|x[5], col=(x[1]<<3)|(x[2]<<2)|(x[3]<<1)|x[4];
        int v=S[b][row*16+col];
        for(int t=0;t<4;t++) s[4*b+t]=(v>>(3-t))&1;
    }
    for(int i=0;i<32;i++) out[i]=s[P[i]-1];
}
/* one 64-bit block; dec=1 uses the 16 subkeys in reverse order */
static void des_block(const u8 in[8],u8 out[8],int sk[16][48],int dec){
    int b[64],t[64],l[32],r[32],f[32],nr[32];
    b2bits(in,b,8);
    for(int i=0;i<64;i++) t[i]=b[IP[i]-1];
    memcpy(l,t,32*sizeof(int)); memcpy(r,t+32,32*sizeof(int));
    for(int rd=0;rd<16;rd++){
        feistel(r,sk[dec?15-rd:rd],f);
        for(int i=0;i<32;i++) nr[i]=l[i]^f[i];
        memcpy(l,r,sizeof r); memcpy(r,nr,sizeof nr);
    }
    int pre[64]; memcpy(pre,r,32*sizeof(int)); memcpy(pre+32,l,32*sizeof(int));
    for(int i=0;i<64;i++) b[i]=pre[FP[i]-1];
    bits2b(b,out,8);
}
/* Track which of the 64 original key bits feed every bit of every subkey. */
#include <stdlib.h>
static void rotl_i(int *h,int n){ while(n--){ int t=h[0]; memmove(h,h+1,27*sizeof(int)); h[27]=t; } }
int main(void){
    int cd[56], sub[16][48];
    for(int i=0;i<56;i++) cd[i]=PC1[i];          /* label = original key bit number (1..64) */
    int firstSet[65]={0}, secondSet[65]={0};
    for(int r=0;r<16;r++){
        rotl_i(cd,SH[r]); rotl_i(cd+28,SH[r]);
        for(int j=0;j<48;j++) sub[r][j]=cd[PC2[j]-1];
    }
    int cs[65]={0}, ds[65]={0};
    for(int i=0;i<28;i++){ cs[PC1[i]]=1; ds[PC1[i+28]]=1; }
    int ok=1;
    for(int r=0;r<16;r++){
        printf("K%-2d first 24 bits <- key bits:",r+1);
        for(int j=0;j<24;j++){ printf(" %2d",sub[r][j]); firstSet[sub[r][j]]=1; if(!cs[sub[r][j]]) ok=0; }
        printf("\n    second 24 bits <- key bits:");
        for(int j=24;j<48;j++){ printf(" %2d",sub[r][j]); secondSet[sub[r][j]]=1; if(!ds[sub[r][j]]) ok=0; }
        printf("\n");
    }
    int n1=0,n2=0,inter=0;
    for(int b=1;b<=64;b++){ n1+=firstSet[b]; n2+=secondSet[b]; inter+=firstSet[b]&&secondSet[b]; }
    printf("\nBits feeding the first 24 bits of subkeys (over all rounds) : %d\n",n1);
    for(int b=1;b<=64;b++) if(firstSet[b]) printf(" %d",b);
    printf("\nBits feeding the second 24 bits of subkeys (over all rounds): %d\n",n2);
    for(int b=1;b<=64;b++) if(secondSet[b]) printf(" %d",b);
    printf("\nSize of intersection of the two sets: %d  -> %s\n",inter,inter==0?"DISJOINT":"overlap");
    printf("First half only uses C0 bits and second half only D0 bits: %s\n",ok?"YES":"NO");
    printf("Parity bits 8,16,...,64 never used: %s\n",
        (firstSet[8]|firstSet[16]|firstSet[24]|firstSet[32]|firstSet[40]|firstSet[48]|firstSet[56]|firstSet[64]|
         secondSet[8]|secondSet[16]|secondSet[24]|secondSet[32]|secondSet[40]|secondSet[48]|secondSet[56]|secondSet[64])?"NO":"YES");
    return 0;
}
