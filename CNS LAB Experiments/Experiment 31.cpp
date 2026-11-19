
#include <stdio.h>
#include <stdint.h>

uint64_t generateK1(uint64_t L)
{
    uint64_t R;

    if(L & 0x8000000000000000ULL)
        R = (L << 1) ^ 0x1B;
    else
        R = L << 1;

    return R;
}

uint64_t generateK2(uint64_t K1)
{
    if(K1 & 0x8000000000000000ULL)
        return (K1 << 1) ^ 0x1B;

    return K1 << 1;
}

int main()
{
    uint64_t L, K1, K2;

    printf("Enter 64-bit hexadecimal value L: ");
    scanf("%llx", (unsigned long long *)&L);

    K1 = generateK1(L);
    K2 = generateK2(K1);

    printf("Subkey K1 = %016llX\n",
           (unsigned long long)K1);

    printf("Subkey K2 = %016llX\n",
           (unsigned long long)K2);

    return 0;
}

