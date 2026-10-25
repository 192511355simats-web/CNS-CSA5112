#include <stdio.h>
#include <math.h>

int main() {
    // A Playfair cipher uses a 5x5 matrix containing 25 distinct letters (usually combining I and J)
    int total_letters = 25;
    
    // Calculate 25! (factorial of 25) using double precision to prevent integer overflow
    double total_keys = 1.0;
    for (int i = 1; i <= total_letters; i++) {
        total_keys *= i;
    }
    
    // Express as an approximate power of 2: log2(total_keys)
    double power_of_two_total = log2(total_keys);
    
    // Account for equivalent keys:
    // Cyclic shifts of the rows (5 possibilities) and columns (5 possibilities) 
    // yield the exact same encryption rules. Total equivalent matrices = 5 * 5 = 25.
    double unique_keys = total_keys / 25.0;
    double power_of_two_unique = log2(unique_keys);
    
    // Print the results
    printf("=== Playfair Cipher Key Analysis ===\n\n");
    
    printf("a. Ignoring identical encryption results:\n");
    printf("   Total possible keys: %.0f\n", total_keys);
    printf("   Expressed as an approximate power of 2: 2^%.2f (or ~2^84)\n\n", power_of_two_total);
    
    printf("b. Taking into account identical encryption results:\n");
    printf("   Effectively unique keys (25! / 25 = 24!): %.0f\n", unique_keys);
    printf("   Expressed as an approximate power of 2: 2^%.2f (or ~2^79)\n", power_of_two_unique);
    
    return 0;
}

