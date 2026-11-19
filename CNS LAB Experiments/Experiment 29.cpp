
#include <stdio.h>

int main()
{
    int state = 1600;
    int block = 1024;
    int lane = 64;

    int rateLanes = block / lane;
    int capacity = state - block;
    int capacityLanes = capacity / lane;

    printf("SHA-3 Configuration\n");
    printf("State size = %d bits\n", state);
    printf("Block size = %d bits\n", block);
    printf("Lane size = %d bits\n", lane);

    printf("Rate lanes = %d\n", rateLanes);
    printf("Capacity = %d bits\n", capacity);
    printf("Capacity lanes = %d\n", capacityLanes);

    printf("\nInitial capacity lanes are zero.\n");
    printf("Without permutation, they remain zero.\n");
    printf("Therefore, they never become nonzero.\n");

    return 0;
}

