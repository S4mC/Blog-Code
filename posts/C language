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
:::details Use⠀ c`#include "myfile.h"`⠀to include a library of files in your program.
 This library can have declarations (functions, structures, macros, etc.), but definitions (the code for the functions) must be in a file with the same name, but with a .c extension.
:::

- `<stdio.h>`: Acronym of *standard input-output header* contains all the basic input and output tools in C, both for working with the console and with files.
#### c`<stdio.h>`:
- c`printf("content");` is a C standard input/output library function that allows you to print data in a specific format to the console.


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


:::float-intSize
use c`#include <limits.h>` and c`printf("%d\n", INT_MAX);` for sure
:::
