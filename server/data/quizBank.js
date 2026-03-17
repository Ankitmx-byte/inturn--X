// Lightweight predefined quiz bank organized by language and level.
// Extend by adding more levels and questions. Keep ~10 Qs per level ideally.

const LANGUAGES = [
  { key: 'javascript', label: 'JavaScript' },
  { key: 'python', label: 'Python' },
  { key: 'cpp', label: 'C++' },
  { key: 'java', label: 'Java' },
];

// Each question: { id, question, type, options?: string[], answerIndex?, tags: string[], explanation: string, codeExample?: string, expectedOutput?: string, description?: string, constraints?: string[] }
const QUIZ_BANK = {
  javascript: {
    1: [
      {
        id: 'js-1-1',
        type: 'mcq',
        question: 'What is the result of typeof null in JavaScript?',
        options: ['"object"', '"null"', '"undefined"', '"number"'],
        answerIndex: 0,
        tags: ['basics', 'types'],
        explanation: 'In JavaScript, typeof null returns "object" due to a historical bug in the language that remains for backward compatibility.',
        codeExample: 'console.log(typeof null); // "object"',
        testCases: [] // MCQ doesn't need test cases
      },
      {
        id: 'js-1-2',
        type: 'mcq',
        question: 'Which method converts a JSON string into a JavaScript object?',
        options: ['JSON.parse', 'JSON.stringify', 'Object.fromJSON', 'JSON.toObject'],
        answerIndex: 0,
        tags: ['json', 'basics'],
        explanation: 'Use JSON.parse to parse a JSON string into an object. JSON.stringify does the inverse (object -> string).',
        codeExample: 'const obj = JSON.parse("{\\"a\\":1}");',
        testCases: []
      },
      {
        id: 'js-1-3',
        type: 'mcq',
        question: 'What does the spread operator (...) do when used in an array literal?',
        options: ['It copies by reference', 'It creates a shallow copy/spreads elements', 'It deep-clones nested structures', 'It sorts the array'],
        answerIndex: 1,
        tags: ['arrays', 'syntax'],
        explanation: 'The spread operator spreads elements into a new array, creating a shallow copy (nested objects are still by reference).',
        codeExample: 'const a = [1,2]; const b = [...a, 3]; // b = [1,2,3]',
        testCases: []
      },
    ],
    2: [
      {
        id: 'js-2-1',
        type: 'mcq',
        question: 'Which keyword declares a block-scoped variable?',
        options: ['var', 'let', 'function', 'with'],
        answerIndex: 1,
        tags: ['scope', 'basics'],
        explanation: 'let and const are block-scoped. var is function-scoped.',
        codeExample: 'if(true){ let x = 1; } // x not accessible here',
      },
    ],
    100: [
      {
        id: 'js-100-1',
        type: 'mcq',
        question: 'What is the time complexity of the V8 engine\'s garbage collector for marking phase?',
        options: ['O(n)', 'O(n log n)', 'O(1)', 'O(n²)'],
        answerIndex: 0,
        tags: ['performance', 'v8', 'gc'],
        explanation: 'V8\'s garbage collector uses a mark-and-sweep algorithm with O(n) time complexity for the marking phase, where n is the number of live objects.',
        codeExample: '// V8 GC phases: Mark (O(n)) -> Sweep -> Compact',
      },
      {
        id: 'js-100-2',
        question: 'Which ES2020 feature allows for optional chaining in property access?',
        options: ['?.', '??', '&&', '||'],
        answerIndex: 0,
        tags: ['es2020', 'syntax', 'nullish'],
        explanation: 'The optional chaining operator (?.) allows reading the value of a property located deep within a chain of connected objects without having to expressly validate that each reference in the chain is valid.',
        codeExample: 'const name = user?.profile?.name; // Safe property access',
      },
      {
        id: 'js-100-3',
        question: 'What does the WeakMap constructor accept as keys?',
        options: ['Any value', 'Only strings', 'Only objects', 'Only primitives'],
        answerIndex: 2,
        tags: ['es6', 'weakmap', 'memory'],
        explanation: 'WeakMap keys must be objects. Primitive values like strings, numbers, or symbols are not allowed as keys.',
        codeExample: 'const wm = new WeakMap(); wm.set({}, "value"); // OK\nwm.set("string", "value"); // Error',
      },
      {
        id: 'js-100-4',
        question: 'Which method is used to implement custom iteration behavior in ES6?',
        options: ['[Symbol.iterator]', 'iterator', 'next', 'Symbol.iterator'],
        answerIndex: 0,
        tags: ['es6', 'iterators', 'symbols'],
        explanation: 'The Symbol.iterator method defines the default iterator for an object, allowing it to be used in for...of loops and spread syntax.',
        codeExample: 'class Range {\n  *[Symbol.iterator]() {\n    for(let i = 0; i < 10; i++) yield i;\n  }\n}',
      },
      {
        id: 'js-100-5',
        question: 'What is the purpose of the Reflect API in JavaScript?',
        options: ['DOM manipulation', 'Metaprogramming operations', 'String formatting', 'Date handling'],
        answerIndex: 1,
        tags: ['reflect', 'metaprogramming', 'es6'],
        explanation: 'The Reflect API provides methods for interceptable JavaScript operations, enabling metaprogramming and proxy traps.',
        codeExample: 'Reflect.get(target, property, receiver); // Equivalent to target[property]',
      },
      {
        id: 'js-100-6',
        question: 'Which of the following is true about JavaScript\'s event loop?',
        options: ['It\'s single-threaded but non-blocking', 'It uses multiple threads', 'It blocks on I/O operations', 'It has no timers'],
        answerIndex: 0,
        tags: ['event-loop', 'async', 'concurrency'],
        explanation: 'JavaScript has a single-threaded event loop that handles asynchronous operations through callbacks, promises, and the microtask/macrotask queues.',
        codeExample: '// Event loop handles: Timers -> I/O -> Microtasks -> Render',
      },
      {
        id: 'js-100-7',
        question: 'What does the `super` keyword refer to in a class constructor?',
        options: ['The instance', 'The parent class', 'The prototype', 'The constructor function'],
        answerIndex: 1,
        tags: ['classes', 'inheritance', 'es6'],
        explanation: 'In a class constructor, super() calls the parent class constructor, and super refers to the parent class for method access.',
        codeExample: 'class Child extends Parent {\n  constructor() {\n    super(); // Calls Parent constructor\n  }\n}',
      },
      {
        id: 'js-100-8',
        question: 'Which Web API provides the fetch function?',
        options: ['DOM API', 'Fetch API', 'XHR API', 'WebSocket API'],
        answerIndex: 1,
        tags: ['fetch', 'web-api', 'async'],
        explanation: 'The Fetch API provides the fetch() method for making HTTP requests, returning Promises and supporting modern async/await patterns.',
        codeExample: 'fetch("/api/data").then(res => res.json()).then(data => console.log(data));',
      },
      {
        id: 'js-100-9',
        question: 'What is the correct way to create a private field in a JavaScript class?',
        options: ['#fieldName', '_fieldName', 'private fieldName', 'fieldName_'],
        answerIndex: 0,
        tags: ['classes', 'private-fields', 'es2020'],
        explanation: 'Private fields in JavaScript classes are declared using the # prefix, making them inaccessible from outside the class.',
        codeExample: 'class MyClass {\n  #privateField = "secret";\n  getPrivate() { return this.#privateField; }\n}',
      },
      {
        id: 'js-100-10',
        question: 'Which method is used to schedule a function to run after the current call stack is clear?',
        options: ['setTimeout(0)', 'setImmediate', 'process.nextTick', 'requestAnimationFrame'],
        answerIndex: 0,
        tags: ['timers', 'event-loop', 'async'],
        explanation: 'setTimeout with 0ms delay schedules the callback to run after the current call stack clears, allowing the event loop to process other operations first.',
        codeExample: 'setTimeout(() => console.log("Runs after stack clears"), 0);',
      },
    ],
  },
  python: {
    1: [
      {
        id: 'py-1-1',
        question: 'Which of the following creates a list in Python?',
        options: ['(1, 2, 3)', '{1, 2, 3}', '[1, 2, 3]', 'list:1,2,3'],
        answerIndex: 2,
        tags: ['lists', 'basics'],
        explanation: 'Square brackets [] denote a list. Parentheses () are tuples, curly braces {} are sets/dicts.',
        codeExample: 'items = [1, 2, 3]'
      },
      {
        id: 'py-1-2',
        question: 'What is the result of len({"a": 1, "b": 2})?',
        options: ['1', '2', '3', 'Error'],
        answerIndex: 1,
        tags: ['dict', 'basics'],
        explanation: 'len on a dict returns the number of keys. There are two keys: a and b.',
        codeExample: 'print(len({"a":1, "b":2})) # 2'
      }
    ],
    100: [
      {
        id: 'py-100-1',
        question: 'What is the Global Interpreter Lock (GIL) in CPython?',
        options: ['A thread synchronization mechanism', 'A memory management system', 'A bytecode compiler', 'An import system'],
        answerIndex: 0,
        tags: ['gil', 'concurrency', 'cpython'],
        explanation: 'The GIL is a mutex that protects access to Python objects, preventing multiple native threads from executing Python bytecodes simultaneously in CPython.',
        codeExample: '# GIL prevents true parallelism in CPU-bound tasks\n# Use multiprocessing for CPU-intensive work',
      },
      {
        id: 'py-100-2',
        question: 'Which decorator is used to create a class method in Python?',
        options: ['@staticmethod', '@classmethod', '@property', '@abstractmethod'],
        answerIndex: 1,
        tags: ['decorators', 'oop', 'methods'],
        explanation: '@classmethod binds the method to the class, receiving the class as the first parameter (cls) instead of the instance (self).',
        codeExample: 'class MyClass:\n    @classmethod\n    def from_string(cls, s):\n        return cls(s)',
      },
      {
        id: 'py-100-3',
        question: 'What does the `yield from` syntax do in Python?',
        options: ['Creates a generator', 'Delegates to a sub-generator', 'Returns from a function', 'Imports a module'],
        answerIndex: 1,
        tags: ['generators', 'async', 'yield'],
        explanation: 'yield from delegates to another generator or iterable, automatically forwarding send() and throw() calls.',
        codeExample: 'def gen():\n    yield from range(3)\n    yield from [3, 4, 5]\n# Equivalent to: for x in range(3): yield x; for x in [3,4,5]: yield x',
      },
      {
        id: 'py-100-4',
        question: 'Which module provides high-level threading interface in Python?',
        options: ['thread', 'threading', '_thread', 'concurrent'],
        answerIndex: 1,
        tags: ['threading', 'concurrency', 'modules'],
        explanation: 'The threading module provides a high-level interface for threading, including Thread class, locks, and synchronization primitives.',
        codeExample: 'import threading\nt = threading.Thread(target=my_function)\nt.start()',
      },
      {
        id: 'py-100-5',
        question: 'What is the purpose of `__slots__` in a Python class?',
        options: ['Method binding', 'Memory optimization', 'Property definition', 'Inheritance control'],
        answerIndex: 1,
        tags: ['memory', 'optimization', 'attributes'],
        explanation: '__slots__ restricts the attributes a class instance can have, reducing memory usage by preventing the creation of __dict__.',
        codeExample: 'class Point:\n    __slots__ = ("x", "y")\n    def __init__(self, x, y):\n        self.x, self.y = x, y',
      },
      {
        id: 'py-100-6',
        question: 'Which of the following is true about Python\'s asyncio?',
        options: ['It uses multiple threads', 'It\'s single-threaded concurrency', 'It blocks on I/O', 'It requires callbacks'],
        answerIndex: 1,
        tags: ['asyncio', 'async', 'concurrency'],
        explanation: 'asyncio provides single-threaded concurrency through coroutines, event loops, and cooperative multitasking.',
        codeExample: 'import asyncio\n\nasync def main():\n    await asyncio.sleep(1)\n    print("Done")\n\nasyncio.run(main())',
      },
      {
        id: 'py-100-7',
        question: 'What does the `functools.lru_cache` decorator do?',
        options: ['Logs function calls', 'Caches function results', 'Limits function execution time', 'Profiles performance'],
        answerIndex: 1,
        tags: ['caching', 'optimization', 'decorators'],
        explanation: 'lru_cache implements memoization, caching the results of function calls based on arguments to avoid redundant computations.',
        codeExample: 'from functools import lru_cache\n\n@lru_cache(maxsize=128)\ndef fibonacci(n):\n    if n < 2: return n\n    return fibonacci(n-1) + fibonacci(n-2)',
      },
      {
        id: 'py-100-8',
        question: 'Which protocol allows objects to be used in `with` statements?',
        options: ['__enter__', '__exit__', 'Both __enter__ and __exit__', '__context__'],
        answerIndex: 2,
        tags: ['context-managers', 'protocols', 'with'],
        explanation: 'Context managers implement both __enter__ (setup) and __exit__ (cleanup) methods to work with the with statement.',
        codeExample: 'class MyContext:\n    def __enter__(self):\n        print("Entering")\n        return self\n    \n    def __exit__(self, exc_type, exc_val, exc_tb):\n        print("Exiting")',
      },
      {
        id: 'py-100-9',
        question: 'What is the purpose of `collections.defaultdict`?',
        options: ['Default sorting', 'Default values for missing keys', 'Default list operations', 'Default string formatting'],
        answerIndex: 1,
        tags: ['collections', 'dict', 'data-structures'],
        explanation: 'defaultdict automatically creates default values for missing keys, eliminating the need for manual key existence checks.',
        codeExample: 'from collections import defaultdict\n\nd = defaultdict(list)\nd["missing"].append(1)  # Creates [] automatically\nprint(d["missing"])  # [1]',
      },
      {
        id: 'py-100-10',
        question: 'Which of the following is true about Python metaclasses?',
        options: ['They create classes', 'They modify class behavior at creation time', 'They handle inheritance', 'They manage instances'],
        answerIndex: 1,
        tags: ['metaclasses', 'oop', 'advanced'],
        explanation: 'Metaclasses are classes whose instances are classes. They allow customization of class creation, adding methods or modifying behavior.',
        codeExample: 'class Meta(type):\n    def __new__(cls, name, bases, dct):\n        dct["added_method"] = lambda self: "Hello"\n        return super().__new__(cls, name, bases, dct)',
      },
    ],
  },
  cpp: {
    1: [
      {
        id: 'cpp-1-1',
        question: 'Which is the correct way to include the iostream library?',
        options: ['include <iostream>', '#include <iostream>', '#include iostream', 'use iostream;'],
        answerIndex: 1,
        tags: ['includes', 'basics'],
        explanation: 'C++ headers are included using the preprocessor directive: #include <iostream>.',
        codeExample: '#include <iostream>\nint main(){ std::cout << "Hi"; }'
      },
    ],
  },
  java: {
    1: [
      {
        id: 'java-1-1',
        question: 'Which keyword is used to inherit a class in Java?',
        options: ['this', 'implements', 'extends', 'inherits'],
        answerIndex: 2,
        tags: ['oop', 'inheritance'],
        explanation: 'Use extends for class inheritance. Use implements for interfaces.',
        codeExample: 'class Child extends Parent { }'
      },
    ],
    100: [
      {
        id: 'java-100-1',
        question: 'What is the Java Memory Model (JMM) primarily concerned with?',
        options: ['Garbage collection algorithms', 'Thread synchronization and visibility', 'Heap vs stack allocation', 'Method dispatch optimization'],
        answerIndex: 1,
        tags: ['jmm', 'concurrency', 'memory-model'],
        explanation: 'The Java Memory Model defines how threads interact through memory, ensuring visibility and ordering of operations in concurrent programs.',
        codeExample: '// Volatile ensures visibility across threads\nvolatile boolean flag = false;\n\n// Happens-before relationship\nsynchronized(this) { x = 1; } // Write\nint y = x; // Read (guaranteed to see x=1)',
      },
      {
        id: 'java-100-2',
        question: 'Which annotation enables compile-time dependency injection in Spring?',
        options: ['@Autowired', '@Component', '@Service', '@Bean'],
        answerIndex: 0,
        tags: ['spring', 'dependency-injection', 'annotations'],
        explanation: '@Autowired tells Spring to inject dependencies automatically. It can be used on fields, constructors, and setters.',
        codeExample: '@Service\npublic class UserService {\n    @Autowired\n    private UserRepository userRepository;\n}',
      },
      {
        id: 'java-100-3',
        question: 'What does the `volatile` keyword guarantee in Java?',
        options: ['Atomic operations', 'Visibility of writes across threads', 'Mutual exclusion', 'Memory allocation'],
        answerIndex: 1,
        tags: ['volatile', 'concurrency', 'visibility'],
        explanation: 'volatile ensures that writes to a variable are visible to all threads, preventing compiler optimizations that might hide updates.',
        codeExample: 'volatile int counter = 0;\n\n// Without volatile, thread B might never see counter > 0\n// With volatile, thread B will eventually see the update',
      },
      {
        id: 'java-100-4',
        question: 'Which Java feature allows multiple inheritance of behavior?',
        options: ['Abstract classes', 'Interfaces with default methods', 'Inner classes', 'Anonymous classes'],
        answerIndex: 1,
        tags: ['interfaces', 'default-methods', 'java8'],
        explanation: 'Java 8 introduced default methods in interfaces, allowing multiple inheritance of behavior while avoiding the diamond problem.',
        codeExample: 'interface A { default void method() { System.out.println("A"); } }\ninterface B { default void method() { System.out.println("B"); } }\n\nclass C implements A, B {\n    public void method() { A.super.method(); } // Explicit resolution\n}',
      },
      {
        id: 'java-100-5',
        question: 'What is the purpose of the `try-with-resources` statement?',
        options: ['Exception handling', 'Automatic resource management', 'Memory allocation', 'Thread synchronization'],
        answerIndex: 1,
        tags: ['try-with-resources', 'auto-closeable', 'java7'],
        explanation: 'try-with-resources automatically closes resources that implement AutoCloseable, ensuring proper cleanup even if exceptions occur.',
        codeExample: 'try (FileInputStream fis = new FileInputStream("file.txt")) {\n    // Use fis\n} // Automatically closed here\ncatch (IOException e) {\n    // Handle exception\n}',
      },
      {
        id: 'java-100-6',
        question: 'Which collection provides O(1) access time?',
        options: ['ArrayList', 'LinkedList', 'HashMap', 'TreeMap'],
        answerIndex: 2,
        tags: ['collections', 'hashmap', 'complexity'],
        explanation: 'HashMap provides average O(1) time complexity for get() and put() operations through hashing.',
        codeExample: 'Map<String, Integer> map = new HashMap<>();\nmap.put("key", 42); // O(1) average\nInteger value = map.get("key"); // O(1) average',
      },
      {
        id: 'java-100-7',
        question: 'What does the `synchronized` keyword prevent?',
        options: ['Memory leaks', 'Race conditions', 'Deadlocks', 'Stack overflows'],
        answerIndex: 1,
        tags: ['synchronized', 'concurrency', 'race-conditions'],
        explanation: 'synchronized creates a monitor lock, preventing multiple threads from executing the synchronized block simultaneously.',
        codeExample: 'public synchronized void increment() {\n    counter++; // Only one thread at a time\n}',
      },
      {
        id: 'java-100-8',
        question: 'Which Java 8 feature enables functional programming?',
        options: ['Lambda expressions', 'Method references', 'Streams API', 'All of the above'],
        answerIndex: 3,
        tags: ['java8', 'functional-programming', 'lambdas'],
        explanation: 'Java 8 introduced lambda expressions, method references, and the Streams API to support functional programming paradigms.',
        codeExample: 'List<String> names = Arrays.asList("Alice", "Bob", "Charlie");\nnames.stream()\n     .filter(s -> s.length() > 3)\n     .map(String::toUpperCase)\n     .forEach(System.out::println);',
      },
      {
        id: 'java-100-9',
        question: 'What is the purpose of the `transient` keyword?',
        options: ['Method synchronization', 'Serialization control', 'Memory optimization', 'Thread safety'],
        answerIndex: 1,
        tags: ['transient', 'serialization', 'object-persistence'],
        explanation: 'transient marks fields that should not be serialized, excluding them from object persistence.',
        codeExample: 'class User implements Serializable {\n    private String name;\n    private transient String password; // Not serialized\n}',
      },
      {
        id: 'java-100-10',
        question: 'Which pattern does the `Observer` interface in Java represent?',
        options: ['Factory Pattern', 'Observer Pattern', 'Singleton Pattern', 'Decorator Pattern'],
        answerIndex: 1,
        tags: ['observer-pattern', 'design-patterns', 'event-handling'],
        explanation: 'The Observer pattern defines a one-to-many dependency where changes in one object notify all dependent objects.',
        codeExample: 'interface Observer {\n    void update(Observable o, Object arg);\n}\n\nclass ConcreteObserver implements Observer {\n    public void update(Observable o, Object arg) {\n        // React to change\n    }\n}',
      },
    ],
  },
};

const MAX_LEVEL = 100;

// Add sample coding questions with test cases for levels 61-100
function addCodingQuestions() {
  // JavaScript coding questions
  if (!QUIZ_BANK.javascript[61]) {
    QUIZ_BANK.javascript[61] = [{
      id: 'js-61-1',
      type: 'short_code',
      question: 'Write a function that returns the sum of two numbers.',
      description: 'Create a function named "sum" that takes two parameters and returns their sum.',
      tags: ['functions', 'basics'],
      explanation: 'A simple function that adds two numbers together.',
      codeExample: 'function sum(a, b) {\n  return a + b;\n}',
      testCases: [
        { input: '5\n3', expectedOutput: '8' },
        { input: '10\n20', expectedOutput: '30' },
        { input: '-5\n5', expectedOutput: '0' }
      ]
    }];
  }

  if (!QUIZ_BANK.javascript[86]) {
    QUIZ_BANK.javascript[86] = [{
      id: 'js-86-1',
      type: 'full_problem',
      question: 'Implement a function to reverse a string.',
      description: 'Write a function that takes a string as input and returns the reversed string.',
      constraints: ['Input string length: 1 ≤ n ≤ 1000'],
      tags: ['strings', 'algorithms'],
      explanation: 'You can reverse a string using various methods like split-reverse-join or iteration.',
      codeExample: 'function reverseString(str) {\n  return str.split("").reverse().join("");\n}',
      testCases: [
        { input: 'hello', expectedOutput: 'olleh' },
        { input: 'world', expectedOutput: 'dlrow' },
        { input: 'a', expectedOutput: 'a' }
      ]
    }];
  }

  // Python coding questions
  if (!QUIZ_BANK.python[61]) {
    QUIZ_BANK.python[61] = [{
      id: 'py-61-1',
      type: 'short_code',
      question: 'Write a function that returns the sum of two numbers.',
      description: 'Create a function named "sum" that takes two parameters and returns their sum.',
      tags: ['functions', 'basics'],
      explanation: 'A simple function that adds two numbers together.',
      codeExample: 'def sum(a, b):\n    return a + b',
      testCases: [
        { input: '5\n3', expectedOutput: '8' },
        { input: '10\n20', expectedOutput: '30' },
        { input: '-5\n5', expectedOutput: '0' }
      ]
    }];
  }

  if (!QUIZ_BANK.python[86]) {
    QUIZ_BANK.python[86] = [{
      id: 'py-86-1',
      type: 'full_problem',
      question: 'Implement a function to reverse a string.',
      description: 'Write a function that takes a string as input and returns the reversed string.',
      constraints: ['Input string length: 1 ≤ n ≤ 1000'],
      tags: ['strings', 'algorithms'],
      explanation: 'You can reverse a string using slicing or other methods.',
      codeExample: 'def reverse_string(s):\n    return s[::-1]',
      testCases: [
        { input: 'hello', expectedOutput: 'olleh' },
        { input: 'world', expectedOutput: 'dlrow' },
        { input: 'a', expectedOutput: 'a' }
      ]
    }];
  }
}

// Call this to add coding questions
addCodingQuestions();

// Dynamic question generation for missing levels
function generateQuestionForLevel(language, level) {
  const baseQuestions = {
    javascript: {
      basics: [
        { q: 'What is the result of 2 + "2" in JavaScript?', opts: ['"22"', '4', 'NaN', 'undefined'], ans: 0, exp: 'JavaScript concatenates strings with + operator.' },
        { q: 'Which method adds an element to the end of an array?', opts: ['push()', 'pop()', 'shift()', 'unshift()'], ans: 0, exp: 'push() adds elements to the end of an array.' },
        { q: 'What does NaN stand for?', opts: ['Not a Number', 'No and Nothing', 'Null and None', 'Never a Null'], ans: 0, exp: 'NaN represents Not a Number in JavaScript.' },
      ],
      intermediate: [
        { q: 'What is a closure in JavaScript?', opts: ['A way to close functions', 'A function with access to outer scope', 'A method to end loops', 'A type of loop'], ans: 1, exp: 'Closures allow functions to access variables from their outer scope.' },
        { q: 'Which keyword declares a constant?', opts: ['var', 'let', 'const', 'static'], ans: 2, exp: 'const declares variables that cannot be reassigned.' },
      ],
      advanced: [
        { q: 'What is the purpose of the Promise object?', opts: ['To create loops', 'To handle asynchronous operations', 'To define classes', 'To manage memory'], ans: 1, exp: 'Promises handle asynchronous operations and avoid callback hell.' },
        { q: 'What does the "this" keyword refer to in an arrow function?', opts: ['The function itself', 'The global object', 'The lexical scope', 'The prototype'], ans: 2, exp: 'Arrow functions inherit "this" from their lexical scope.' },
      ]
    },
    python: {
      basics: [
        { q: 'What is the output of print(2**3)?', opts: ['6', '8', '9', '16'], ans: 1, exp: '** is the exponentiation operator in Python.' },
        { q: 'Which data type is immutable in Python?', opts: ['list', 'dict', 'tuple', 'set'], ans: 2, exp: 'Tuples are immutable sequences in Python.' },
      ],
      intermediate: [
        { q: 'What does the "with" statement do?', opts: ['Creates loops', 'Manages resources', 'Defines functions', 'Imports modules'], ans: 1, exp: '"with" ensures proper resource management.' },
        { q: 'How do you create a list comprehension?', opts: ['[x for x in range(5)]', '(x for x in range(5))', '{x for x in range(5)}', '<x for x in range(5)>'], ans: 0, exp: 'List comprehensions use square brackets.' },
      ],
      advanced: [
        { q: 'What is the purpose of decorators in Python?', opts: ['To decorate functions', 'To modify function behavior', 'To create classes', 'To manage memory'], ans: 1, exp: 'Decorators modify or extend function behavior.' },
        { q: 'What does "yield" do in a function?', opts: ['Returns a value', 'Creates a generator', 'Ends the function', 'Raises an exception'], ans: 1, exp: '"yield" makes a function a generator.' },
      ]
    },
    cpp: {
      basics: [
        { q: 'What is the correct way to declare a variable in C++?', opts: ['var x = 5;', 'int x = 5;', 'x := 5;', 'declare x = 5;'], ans: 1, exp: 'Variables are declared with type in C++.' },
        { q: 'What does "cout" do?', opts: ['Reads input', 'Writes output', 'Creates files', 'Manages memory'], ans: 1, exp: 'cout is used for output in C++.' },
      ],
      intermediate: [
        { q: 'What is a pointer in C++?', opts: ['A variable type', 'A memory address holder', 'A function', 'A class'], ans: 1, exp: 'Pointers store memory addresses.' },
        { q: 'What is the purpose of "new" keyword?', opts: ['Creates variables', 'Allocates memory', 'Defines functions', 'Imports libraries'], ans: 1, exp: '"new" allocates dynamic memory.' },
      ],
      advanced: [
        { q: 'What is RAII in C++?', opts: ['Resource Allocation Is Important', 'Resource Acquisition Is Initialization', 'Random Access Is Impossible', 'Runtime Array Initialization'], ans: 1, exp: 'RAII manages resource lifetime through object lifetime.' },
        { q: 'What does "virtual" keyword do?', opts: ['Creates functions', 'Enables polymorphism', 'Allocates memory', 'Manages threads'], ans: 1, exp: '"virtual" enables runtime polymorphism.' },
      ]
    },
    java: {
      basics: [
        { q: 'What is the main method signature in Java?', opts: ['public static void main(String[] args)', 'public void main(String args)', 'static void main()', 'void main(String[] args)'], ans: 0, exp: 'The main method must be public, static, void, with String[] args.' },
        { q: 'Which keyword creates objects?', opts: ['class', 'new', 'object', 'create'], ans: 1, exp: '"new" instantiates objects in Java.' },
      ],
      intermediate: [
        { q: 'What is inheritance in Java?', opts: ['Copying code', 'Extending classes', 'Creating interfaces', 'Managing memory'], ans: 1, exp: 'Inheritance allows classes to extend other classes.' },
        { q: 'What does "static" mean?', opts: ['Instance variable', 'Class-level member', 'Local variable', 'Global variable'], ans: 1, exp: '"static" members belong to the class, not instances.' },
      ],
      advanced: [
        { q: 'What is the purpose of interfaces?', opts: ['Define implementations', 'Define contracts', 'Create objects', 'Manage memory'], ans: 1, exp: 'Interfaces define method contracts without implementation.' },
        { q: 'What does "synchronized" do?', opts: ['Speeds up code', 'Prevents race conditions', 'Creates threads', 'Manages memory'], ans: 1, exp: '"synchronized" prevents concurrent access to critical sections.' },
      ]
    }
  };

  const langData = baseQuestions[language];
  if (!langData) return null;

  let category;
  if (level <= 30) category = 'basics';
  else if (level <= 60) category = 'intermediate';
  else category = 'advanced';

  const questions = langData[category];
  if (!questions || questions.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * questions.length);
  const baseQ = questions[randomIndex];

  return {
    id: `${language}-${level}-${Date.now()}`,
    question: baseQ.q,
    options: baseQ.opts,
    answerIndex: baseQ.ans,
    tags: [category, language],
    explanation: baseQ.exp,
    codeExample: `// Example for level ${level}`
  };
}

function getLevelsForLanguage(lang) {
  const definedLevels = QUIZ_BANK[lang] ? Object.keys(QUIZ_BANK[lang]).map((n) => parseInt(n, 10)) : [];
  const maxDefined = definedLevels.length ? Math.max(...definedLevels) : 0;
  // We conceptually support up to MAX_LEVEL, but content may not yet exist for all levels.
  return { definedLevels, maxDefined };
}

// Function to get questions for a level, with dynamic generation fallback
function getQuestionsForLevel(language, level) {
  // First check if we have predefined questions for this level
  if (QUIZ_BANK[language] && QUIZ_BANK[language][level]) {
    return QUIZ_BANK[language][level];
  }

  // Generate dynamic questions for missing levels
  const generated = [];
  for (let i = 0; i < 3; i++) { // Generate 3 questions per level
    const q = generateQuestionForLevel(language, level);
    if (q) generated.push(q);
  }

  // Cache the generated questions so they remain consistent
  if (generated.length > 0) {
    if (!QUIZ_BANK[language]) {
      QUIZ_BANK[language] = {};
    }
    QUIZ_BANK[language][level] = generated;
    return generated;
  }

  return null;
}

// Pre-generate questions for all levels 3-100 to ensure consistency
function initializeAllLevels() {
  LANGUAGES.forEach(lang => {
    for (let level = 3; level <= 100; level++) {
      // Skip levels that already have questions
      if (QUIZ_BANK[lang.key] && QUIZ_BANK[lang.key][level]) {
        continue;
      }
      // Generate questions for this level
      getQuestionsForLevel(lang.key, level);
    }
  });
}

// Initialize all levels on startup
initializeAllLevels();

module.exports = {
  LANGUAGES,
  QUIZ_BANK,
  MAX_LEVEL,
  getLevelsForLanguage,
  getQuestionsForLevel,
};
