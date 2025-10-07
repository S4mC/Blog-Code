# C language

## Directives
Directives are special instructions given to the preprocessor (not to the compiler directly). They always start with the c`#` symbol and are executed before the program is compiled.

### Define
Use c`#define Name Value` to create symbolic constants or macros (text substitutions).

```c
    // Example:
    #define PI 3.1416
```

### Librarys
Use c`#include <libraryName.h>` to include a standar library in the program (.h for header file).
Use c`#include "myfile.h"` to include a library of files in your program(?=customLibrary).

:::float-customLibrary
	This library can have **declarations** (functions, structures, macros, etc.), but **definitions** (the code for the functions) must be in a file with the same name, but with a .c extension.
:::


:::conector
    #### c`<stdio.h>`:
    Acronym of *standard input-output header* contains all the basic input and output tools in C, both for working with the console and with files.
    - c`printf("content"); // print formatted`:
    It print data in a specific format to the console. 
    For floating-point numbers (float or double), you can print a certain number of decimal places with the syntax:
    ```c
        printf("%.3f", num); // 3 decimal places
        printf("%.2lf", num); // 2 decimal places
    ```
    - (h=8px) c`scanf("%d", &x); // scan formatted`:<br>
    Gets data from the console in the address parameter in a specific format.

    #### c`<stdlib.h>`:
    Provides functions for performing general-purpose operations.
    - c`int absolute = abs(a); // int absolute value`

    #### c`<math.h>`:
    Manages double type operations.
    - c`double power = pow(n,2); // power`
    - c`double square_root = sqrt(n); // square root`
    - c`double logarithm = log(n)/log(base); // logarithm`
    - c`double absolute = fabs(n); // float absolute value`
:::

## Main
In standard C, every executable program must have a **main function**, because it is the entry point of the program.
```c
    int main(){
        return 0;
    }
```

- The int value c`return 0;` returned by main is the exit code for the operating system (0 = success, non-0 = error).

## Comments
You can use two types of comments.
- Single line comment: c`// Comment`
- Multi-line or block comment: c`/* ... */`

## Data types

| Data type | Description | Format | Size |
|----------|----------|----------|----------|
| c`char` | An integer type representing a single **character in the ASCII table** (smallest data type in C). | %c <br> (char) | 1 byte |
| c`int` | A basic integer type used to store **whole numbers**. | %d <br> (decimal) | 2 - 4 bytes(?=intSize)|
| c`long` | An extended integer type used to store larger whole numbers than c`int`. | %ld <br> (long decimal) | Typically 8 bytes |
| c`float` | A floating-point type used to store single-precision decimal numbers. | %f <br> (float)| 4 bytes |
| c`double` | A **floating-point type** used to store precision decimal numbers. *(The name means that it is double as precise as a c`float` type.)* | %lf <br> (long float) | 8 bytes |

### Get the memory address where a variable is stored

You can use c`&` on variables or objects that take up memory to get that memory address
```c
    #include <stdio.h>

    int main() {
        int x = 42;
        printf("x = %d\n", x); // This prints the variable content
        printf("&x = %p\n", &x); // This prints the address of the variable.
        return 0;
    }
```

:::float-intSize
    use c`#include <limits.h>` and c`printf("%d\n", INT_MAX);` for sure
:::

## Arithmetic operators
Used for basic math operations
```c
    int a = 5 + 3;  // addition
    int a = 10 - 7; // subtraction
    int a = 4 * 3;  // multiplication
    float b = 10.0 / 3; // division
    int a = 10 % 3; // modulus (remainder)
```

## Casting
Casting is the process of explicitly converting a value from one data type to another. It tells the compiler to treat a variable or expression as if it were of a different type.

```c
    int x = 10;
    double y = (double)x; // converts int 10 to double 10.0
```

For example, in this code it is necessary to have a casting to obtain a suitable result:

```c
    #include <stdio.h>

    int main() {
        double quotient;
        
        quotient = (double)5/2; // The (double) is needed to convert an int type to a double type and have all decimal places
        printf("quotient = %lf\n", quotient);
        return 0;
    }
```

## Conditionals
The c`if` condition in c is exactly the same as in javascript:
```c
    int nota = 15;

    if (nota >= 18) {
        printf("Excellent");
    } else if (nota >= 11) {
        printf("Approved");
    } else {
        printf("Disapproved");
    }
```

### Ternary Operator
A shorthand for simple if ... else statements, exactly the same as in javascript:
 javascript`variable = condition ? value_if_true: value_if_false;`

(h=8px)

## Loops
The c`while` loop in c is exactly the same as in javascript:
```c
    while (condition) {
        // code to execute
    }
```

## Functions
If functions are declared after the main function, then they must have a **prototype**, which is simply the function header, before the main function.
```c
    int functionName(int argument1); // Prototype, this is necessary if the function is called before implementation because otherwise the compiler does not know what the structure of the function looks like when it is called in the main function and cannot compile the C program.

    int main() {
        functionName(100);
        return 0;
    }

    int functionName(int argument1) { // Implementation
        // Function code
        return 1;
    }
```
- Functions must have the return type in their header c`func_type functionName(type_arg1 arg1)`, if you don't want to return a value simply use c`void`.
- Arguments must have their type in their header, you can pass a variable memory address using c`functionName(&variable);` and receive it using c`functionName(int *variable_adress)`, the c`*` in the argument is because it gets the value from the variable address:
```c
    void functionName(int *variable_adress); // Prototype

    int main() {
        int variable;
        functionName(&variable);
        // variable now has other value
        return 0;
    }

    void functionName(int *variable_adress) { // Implementation
        *variable_adress = 10 // If you change *variable_address the changes will also have an effect on the variable in the main function.
    }
```
- In general, when you use c`int *ptr = &variable;` it means: "Put the address of **variable** in **ptr** and the value in that address is **int** type"
