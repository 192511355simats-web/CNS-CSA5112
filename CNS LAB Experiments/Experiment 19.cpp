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
/* CBC with 3DES (EDE).  Two arrangements:
   OUTER-CBC : C_i = E3( D2( E1( P_i XOR C_{i-1} ) ) )       (one CBC loop around 3DES)
   INNER-CBC : three separate CBC passes  (E,K1,IV1) -> (D,K2,IV2) -> (E,K3,IV3) */
static void ede_enc(const u8 *in,u8 *out,int k1[16][48],int k2[16][48],int k3[16][48]){
    u8 a[8],b[8]; des_block(in,a,k1,0); des_block(a,b,k2,1); des_block(b,out,k3,0);
}
static void ede_dec(const u8 *in,u8 *out,int k1[16][48],int k2[16][48],int k3[16][48]){
    u8 a[8],b[8]; des_block(in,a,k3,1); des_block(a,b,k2,0); des_block(b,out,k1,1);
}
static void xor8(u8 *d,const u8 *a,const u8 *b){ for(int i=0;i<8;i++) d[i]=a[i]^b[i]; }

static void outer_enc(const u8 *p,u8 *c,int n,const u8 *iv,int k1[16][48],int k2[16][48],int k3[16][48]){
    u8 prev[8],t[8]; memcpy(prev,iv,8);
    for(int i=0;i<n;i+=8){ xor8(t,p+i,prev); ede_enc(t,c+i,k1,k2,k3); memcpy(prev,c+i,8); }
}
static void outer_dec(const u8 *c,u8 *p,int n,const u8 *iv,int k1[16][48],int k2[16][48],int k3[16][48]){
    u8 prev[8],t[8]; memcpy(prev,iv,8);
    for(int i=0;i<n;i+=8){ ede_dec(c+i,t,k1,k2,k3); xor8(p+i,t,prev); memcpy(prev,c+i,8); }
}
static void cbc_e(const u8 *p,u8 *c,int n,const u8 *iv,int k[16][48]){
    u8 prev[8],t[8]; memcpy(prev,iv,8);
    for(int i=0;i<n;i+=8){ xor8(t,p+i,prev); des_block(t,c+i,k,0); memcpy(prev,c+i,8); }
}
static void cbc_d(const u8 *c,u8 *p,int n,const u8 *iv,int k[16][48]){
    u8 prev[8],t[8]; memcpy(prev,iv,8);
    for(int i=0;i<n;i+=8){ des_block(c+i,t,k,1); xor8(p+i,t,prev); memcpy(prev,c+i,8); }
}
int main(void){
    u8 key1[8],key2[8],key3[8],iv1[8],iv2[8],iv3[8];
    hex2b("0123456789ABCDEF",key1,8); hex2b("23456789ABCDEF01",key2,8); hex2b("456789ABCDEF0123",key3,8);
    hex2b("1234567890ABCDEF",iv1,8);  hex2b("FEDCBA0987654321",iv2,8);  hex2b("0F1E2D3C4B5A6978",iv3,8);
    int k1[16][48],k2[16][48],k3[16][48];
    des_schedule(key1,k1); des_schedule(key2,k2); des_schedule(key3,k3);

    const char *msg="Cipher block chaining with Triple DES!";   /* 38 bytes -> PKCS#7 pad to 40 */
    int len=strlen(msg), n=(len/8+1)*8, padv=n-len;
    u8 p[64],c[64],d[64],t1[64],t2[64];
    memcpy(p,msg,len); memset(p+len,padv,padv);

    printf("Plaintext (%d bytes, padded to %d): \"%s\"\n",len,n,msg);
    printf("Keys: K1=0123456789ABCDEF K2=23456789ABCDEF01 K3=456789ABCDEF0123\n\n");

    outer_enc(p,c,n,iv1,k1,k2,k3);
    printf("OUTER-CBC (IV=1234567890ABCDEF)\n  Ciphertext: "); phex(c,n);
    outer_dec(c,d,n,iv1,k1,k2,k3); d[n-padv]=0;
    printf("\n  Decrypted : \"%s\"\n\n",d);

    cbc_e(p,t1,n,iv1,k1); cbc_d(t1,t2,n,iv2,k2); cbc_e(t2,c,n,iv3,k3);
    printf("INNER-CBC (IV1=1234567890ABCDEF IV2=FEDCBA0987654321 IV3=0F1E2D3C4B5A6978)\n  Ciphertext: "); phex(c,n);
    cbc_d(c,t2,n,iv3,k3); cbc_e(t2,t1,n,iv2,k2); cbc_d(t1,d,n,iv1,k1); d[n-padv]=0;
    printf("\n  Decrypted : \"%s\"\n",d);
    return 0;
}
