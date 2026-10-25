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
/* Error propagation: ECB vs CBC (DES used as the block cipher) */
#define NB 4
static void show(const char *tag,const u8 *p,const u8 *ref){
    printf("  %-22s",tag);
    for(int b=0;b<NB;b++){
        int bad=memcmp(p+8*b,ref+8*b,8)!=0;
        printf(" P%d=",b+1); for(int i=0;i<8;i++) printf("%c",(p[8*b+i]>=32&&p[8*b+i]<127)?p[8*b+i]:'.');
        printf("[%s]",bad?"ERROR":"ok");
    }
    printf("\n");
}
int main(void){
    u8 key[8],iv[8]; hex2b("133457799BBCDFF1",key,8); hex2b("0011223344556677",iv,8);
    int sk[16][48]; des_schedule(key,sk);
    u8 P[8*NB]; memcpy(P,"BLOCK-01BLOCK-02BLOCK-03BLOCK-04",8*NB);
    u8 Ce[8*NB],Cc[8*NB],De[8*NB],Dc[8*NB],prev[8],t[8];

    for(int b=0;b<NB;b++) des_block(P+8*b,Ce+8*b,sk,0);                  /* ECB */
    memcpy(prev,iv,8);                                                   /* CBC */
    for(int b=0;b<NB;b++){ for(int i=0;i<8;i++) t[i]=P[8*b+i]^prev[i]; des_block(t,Cc+8*b,sk,0); memcpy(prev,Cc+8*b,8); }

    printf("=== Part 1: one bit error in transmitted C1 ===\n");
    Ce[0]^=0x01; Cc[0]^=0x01;
    for(int b=0;b<NB;b++) des_block(Ce+8*b,De+8*b,sk,1);
    memcpy(prev,iv,8);
    for(int b=0;b<NB;b++){ des_block(Cc+8*b,t,sk,1); for(int i=0;i<8;i++) Dc[8*b+i]=t[i]^prev[i]; memcpy(prev,Cc+8*b,8); }
    show("ECB receiver output:",De,P);
    show("CBC receiver output:",Dc,P);
    printf("  P2 (CBC) differs from original in exactly: ");
    int diff=0; for(int i=0;i<8;i++) diff+=__builtin_popcount(Dc[8+i]^P[8+i]);
    printf("%d bit (same position as the flipped bit of C1)\n",diff);
    printf("  CBC blocks affected: P1 (garbled), P2 (1 bit); P3, P4 are correct.\n\n");

    printf("=== Part 2: one bit error in the SOURCE plaintext P1 (before encryption) ===\n");
    u8 Pbad[8*NB],Cgood[8*NB],Cbad[8*NB],Dbad[8*NB];
    memcpy(Pbad,P,8*NB); Pbad[0]^=0x01;
    memcpy(prev,iv,8);
    for(int b=0;b<NB;b++){ for(int i=0;i<8;i++) t[i]=P[8*b+i]^prev[i]; des_block(t,Cgood+8*b,sk,0); memcpy(prev,Cgood+8*b,8); }
    memcpy(prev,iv,8);
    for(int b=0;b<NB;b++){ for(int i=0;i<8;i++) t[i]=Pbad[8*b+i]^prev[i]; des_block(t,Cbad+8*b,sk,0); memcpy(prev,Cbad+8*b,8); }
    int changed=0;
    for(int b=0;b<NB;b++){ int d=memcmp(Cgood+8*b,Cbad+8*b,8)!=0; changed+=d; printf("  C%d %s\n",b+1,d?"differs from error-free ciphertext":"same"); }
    printf("  Ciphertext blocks affected: %d of %d\n",changed,NB);
    memcpy(prev,iv,8);
    for(int b=0;b<NB;b++){ des_block(Cbad+8*b,t,sk,1); for(int i=0;i<8;i++) Dbad[8*b+i]=t[i]^prev[i]; memcpy(prev,Cbad+8*b,8); }
    printf("  Receiver decrypts:\n");
    show("vs. ORIGINAL plaintext:",Dbad,P);
    show("vs. plaintext as SENT:",Dbad,Pbad);
    return 0;
}
