---
title: 从 getClass 说起：理解 Class 对象与泛型擦除
description: 从 getClass() 切入，讲透 Class 对象、运行时真实类型与泛型擦除的边界，附可运行验证代码与 7 道面试问法。
date: 2026-09-15
---

> 所属：Java 面试笔记 / 01-Java基础 / 01-泛型 ｜ 学习计划：D1
> 前置：无 ｜ 后续：[02-擦除之后](/notes/01-Java基础/01-泛型/02-擦除之后/)（这篇讲「擦除是什么」，那篇讲「擦除之后怎么办」）

---

## 0. 本文要解决什么

面试里问泛型擦除，很多人上来就背"运行时被擦除"。但如果你连 `getClass()` 返回的是什么、`Class` 对象是什么都说不清，后面全是空中楼阁。

本文从 `getClass()` 切入，把下面这条链讲透：

```
getClass() → Class 对象 → 运行时真实类型 → 泛型擦除
```

学完你应该能回答：

- `getClass()` 返回什么？
- 同一个类的 `Class` 对象是不是同一个？
- `getClass()`、`.class`、`instanceof` 有什么区别？
- 为什么 `List<String>` 和 `List<Integer>` 的 `getClass()` 相等？
- 泛型信息到底还在不在？

---

## 1. getClass() 是什么

`getClass()` 定义在 `Object` 里：

```java
public final native Class<?> getClass();
```

拆开看：

| 修饰 | 含义 |
|---|---|
| `public` | 所有类都能调用 |
| `final` | 不能被子类重写 |
| `native` | 由 JVM 底层实现 |
| 返回 `Class<?>` | 返回运行时真实类型对应的 Class 对象 |

示例：

```java
String s = "abc";
Class<?> c = s.getClass();
System.out.println(c.getName()); // java.lang.String
```

**一句话**：`getClass()` 返回对象在运行时的真实类型对应的 `Class` 对象。

---

## 2. Class 对象是什么

JVM 加载每个类时，会在方法区（JDK 8+ 是 Metaspace）里为它建立一份类元数据，同时在堆上创建一个 `java.lang.Class` 对象作为这份元数据的入口。我们平时拿到的就是这个 `Class` 对象，它对外暴露：

- 类名、包名
- 父类、实现的接口
- 字段、方法、构造器
- 注解
- 泛型签名（部分）

可以把它理解成：**某个类在内存里的说明书**。

```java
Class<?> c = String.class;
System.out.println(c.getName());       // java.lang.String
System.out.println(c.getSimpleName()); // String
System.out.println(c.getSuperclass()); // class java.lang.Object
```

`Class` 本身也是类，全名 `java.lang.Class`。`Class` 对象也是对象，只不过它代表的是"类"。

> 面试加分点：严格说，**类元数据在 Metaspace 的 `InstanceKlass` 里，堆上的 `Class` 对象只是它的镜像**（HotSpot 中 `Class` 对象的 `_klass` 指针回指 `InstanceKlass`）。说"Class 对象保存在方法区"是不准确的——它是堆对象，强引用着方法区的元数据。

---

## 3. 同一个类只有一个 Class 对象

在**同一个类加载器**下，一个类只会对应一个 `Class` 对象。

```java
String s1 = "a";
String s2 = "b";
System.out.println(s1.getClass() == s2.getClass()); // true
```

```java
String s = "abc";
System.out.println(s.getClass() == String.class); // true
```

> 补充：不同类加载器加载同一个类名，会得到不同的 `Class` 对象。这是类加载隔离的基础，后面 JVM 篇再展开。

---

## 4. getClass()、.class、instanceof 的区别

```java
String s = "abc";

Class<?> c1 = s.getClass();      // 运行时通过对象获取
Class<?> c2 = String.class;      // 编译期类字面量
boolean b = s instanceof String; // 判断是不是某类型（含子类）
```

| 写法 | 时机 | 判断依据 | 是否含子类 |
|---|---|---|---|
| `obj.getClass()` | 运行时 | 真实类型 | 否，精确匹配 |
| `X.class` | 编译期 | 类字面量 | — |
| `obj instanceof X` | 运行时 | 是否属于 X 或子类 | 是 |

关键对比：

```java
Object o = new String("abc");

System.out.println(o instanceof String);          // true
System.out.println(o.getClass() == String.class); // true
System.out.println(o.getClass() == Object.class); // false
```

`o` 的静态类型是 `Object`，运行时真实类型是 `String`。`getClass()` 看运行时真实类型，所以返回 `String.class`。

---

## 5. 泛型擦除

Java 泛型是**编译期**的。编译完之后，泛型参数被擦除，运行时不存在。

```java
List<String> a = new ArrayList<>();
List<Integer> b = new ArrayList<>();
```

编译后，字节码里都是原始类型（raw type）：

```java
List a = new ArrayList();
List b = new ArrayList();
```

擦除规则（**擦到第一个上界**）：

| 声明 | 擦除后 |
|---|---|
| `<T>` | `Object` |
| `<T extends Number>` | `Number` |
| `<T extends Comparable<T>>` | `Comparable` |

```java
class Box<T> { T value; }
// 擦除后 ≈ class Box { Object value; }

class NumBox<T extends Number> { T value; }
// 擦除后 ≈ class NumBox { Number value; }
```

**一句话**：泛型是给编译器看的，运行时不存在。

---

## 6. 为什么 `List<String>` 和 `List<Integer>` 的 getClass() 相等

```java
List<String> a = new ArrayList<>();
List<Integer> b = new ArrayList<>();

System.out.println(a.getClass());                 // class java.util.ArrayList
System.out.println(b.getClass());                 // class java.util.ArrayList
System.out.println(a.getClass() == b.getClass()); // true
System.out.println(a.getClass() == List.class);   // false
System.out.println(a instanceof List);            // true
```

逐条解释：

- `a`、`b` 都是 `new ArrayList<>()` 创建，运行时真实类型都是 `ArrayList`。
- 同一个类加载器下，`ArrayList` 只有一个 `Class` 对象。
- 所以 `a.getClass() == b.getClass()` 为 `true`。
- `a.getClass()` 是 `ArrayList.class`，不是 `List.class`，所以和 `List.class` 不等。
- `a instanceof List` 为 `true`，因为 `ArrayList` 实现了 `List`。

**核心结论**：泛型参数不影响运行时类型，`getClass()` 只看真实类。

---

## 7. 泛型信息真的全没了吗

不是。分两个层面：

| 层面 | 泛型信息 |
|---|---|
| 对象实例 | 没有 |
| 类文件声明（字段、方法、父类） | 可能保留在 `Signature` 属性里 |
| 反射读取声明处 | 可以读到 |

示例：

```java
public class Demo {
    private List<String> names;
}
```

```java
Field f = Demo.class.getDeclaredField("names");

System.out.println(f.getType());        // interface java.util.List
System.out.println(f.getGenericType()); // java.util.List<java.lang.String>
```

- `getType()`：擦除后的原始类型 `List`。
- `getGenericType()`：带泛型签名的 `ParameterizedType`。

进一步拿泛型参数：

```java
if (f.getGenericType() instanceof ParameterizedType) {
    ParameterizedType pt = (ParameterizedType) f.getGenericType();
    Type[] args = pt.getActualTypeArguments();
    System.out.println(args[0]); // class java.lang.String
}
```

> JDK 16+ 可以写成 `instanceof ParameterizedType pt` 的模式匹配，省掉强转。

### 这和 Spring 依赖注入是什么关系（一个常见错误说法）

不少笔记写"Spring 通过 `getGenericType` 知道要注入 `UserService`"，**这是错的**：

```java
@Autowired
private UserService userService; // 这个字段根本没有泛型参数
```

这里 Spring 用的是 `Field.getType()`（即 `UserService.class`）做 byType 匹配，**和 `getGenericType` 无关**。

`getGenericType` 真正起作用的场景是**字段类型本身带类型参数**时：

```java
@Autowired
private List<UserService> services;      // 要先知道元素类型，才能筛出候选 bean

@Autowired
private Repository<User> userRepository; // Spring Data 按泛型生成代理

abstract class BaseService<T> {          // 泛型父类声明的字段，
    @Autowired                           // 需要沿继承链解析 T
    protected T dao;
}
```

这些场景 Spring 走的是 `ResolvableType`：内部会调 `getGenericType()`，并把父类/接口上的类型变量一并解析出来，而不是简单看 `getType()`。

**一句话**：`getType()` 拿擦除后的类型，`getGenericType()` 拿带签名的类型；Spring 只在需要解析类型参数时才用后者。

---

## 8. 为什么不能 new T[]

```java
class Box<T> {
    T[] arr = new T[10]; // 编译不通过
}
```

原因有两层：

1. **数组是具体化类型（reified）**：数组在运行时必须知道元素类型，才能做存取检查（`ArrayStoreException` 就是这么来的）。
2. **泛型被擦除**：运行时不知道 `T` 是什么，JVM 无法创建"类型正确"的数组。

而且数组是**协变**的（`String[]` 是 `Object[]` 的子类型），泛型是**不变**的，两者混用会破坏类型安全，所以 Java 直接从编译期禁止。

硬写：

```java
T[] arr = (T[]) new Object[10]; // 编译警告，运行时堆污染
```

这叫**堆污染**。运行时它只是 `Object[]`，你往里放 `String`，别人当成 `Integer[]` 用就会 `ClassCastException`：

```java
static <T> T[] wrong() {
    return (T[]) new Object[]{"a", "b"}; // 擦除后退化为 Object[]
}

Integer[] ints = wrong(); // 运行时 ClassCastException
```

正确做法：

```java
T[] arr = (T[]) Array.newInstance(clazz, 10);
```

`clazz` 是 `Class<T>`，从外部传入。这也是很多框架要求传 `Class` 对象的原因。

另外，可变参数 `T...` 底层也是数组，编译器同样会给警告；`@SafeVarargs` 能抑制警告的前提是**方法不往这个数组里写东西**。完整实验见 [02-擦除之后](/notes/01-Java基础/01-泛型/02-擦除之后/)。

---

## 9. 擦除带来的两个连锁反应

### 9.1 重载冲突

擦除后签名相同，编译直接报错：

```java
void m(List<String> a) {}
void m(List<Integer> b) {} // 编译错误：name clash，擦除后都是 m(List)
```

想区分只能换方法名，或者把参数容器换成不同类型。

### 9.2 桥方法（bridge method）

```java
class Node<T> {
    public T get() { return null; }
}

class StringNode extends Node<String> {
    @Override
    public String get() { return "s"; }
}
```

擦除后父类方法签名是 `Object get()`。为了让"父类引用调用子类实现"的多态成立，编译器会在子类合成一个桥方法：

```java
class StringNode extends Node<String> {
    public String get() { return "s"; }

    // 编译器合成，字节码里真实存在
    // public Object get() { return this.get(); }
}
```

用 `javap -c -p StringNode` 能看到两个 `get`。这解释了"重写后反射 `getDeclaredMethods()` 为什么会多一个方法"，也是"泛型擦除后多态仍然有效"的底层原因。字节码长什么样、`Method.isBridge()` 怎么用，见 [02-擦除之后](/notes/01-Java基础/01-泛型/02-擦除之后/)。

---

## 10. 完整验证代码

```java
import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;

public class ErasureDemo {

    public static void main(String[] args) throws Exception {
        test1();
        test2();
        test3();
        test4();
    }

    // getClass / .class / instanceof
    static void test1() {
        Object o = new String("abc");
        System.out.println(o instanceof String);          // true
        System.out.println(o.getClass() == String.class); // true
        System.out.println(o.getClass() == Object.class); // false
    }

    // 泛型擦除
    static void test2() {
        List<String> a = new ArrayList<>();
        List<Integer> b = new ArrayList<>();

        System.out.println(a.getClass());                 // class java.util.ArrayList
        System.out.println(b.getClass());                 // class java.util.ArrayList
        System.out.println(a.getClass() == b.getClass()); // true
        System.out.println(a.getClass() == List.class);   // false
        System.out.println(a instanceof List);            // true
    }

    // 反射读取声明处泛型
    public static class Demo {
        private List<String> names;
    }

    static void test3() throws Exception {
        Field f = Demo.class.getDeclaredField("names");
        System.out.println(f.getType());        // interface java.util.List
        System.out.println(f.getGenericType()); // java.util.List<java.lang.String>

        if (f.getGenericType() instanceof ParameterizedType pt) {
            Type[] args = pt.getActualTypeArguments();
            System.out.println(args[0]); // class java.lang.String
        }
    }

    // 堆污染：能编译，运行时才炸
    @SuppressWarnings("unchecked")
    static <T> T[] wrong() {
        return (T[]) new Object[]{"a", "b"};
    }

    static void test4() {
        try {
            Integer[] ints = wrong();
            System.out.println(ints[0]);
        } catch (ClassCastException e) {
            System.out.println("ClassCastException: " + e.getMessage());
        }
    }
}
```

`javac -Xlint:unchecked ErasureDemo.java` 会提示 `test4` 里的堆污染。`test1` 里的 `new String("abc")` 只是为了制造"静态类型 ≠ 运行时类型"的对比，真实代码里不要这么写。

---

## 11. 面试问法

**Q1：`getClass()` 返回什么？**

> 返回对象运行时真实类型对应的 `Class` 对象。同一个类加载器下，一个类只有一个 `Class` 对象。

**Q2：`getClass()`、`.class`、`instanceof` 有什么区别？**

> `getClass()` 运行时通过对象拿真实类型，精确匹配、不含子类；`.class` 是编译期类字面量；`instanceof` 运行时判断是否属于某类型或子类。

**Q3：为什么 `List<String>` 和 `List<Integer>` 的 `getClass()` 相等？**

> 泛型编译期被擦除，运行时 `a`、`b` 都是 `ArrayList` 实例；同一个类加载器下 `ArrayList` 只有一个 `Class` 对象，所以相等。

**Q4：泛型信息运行时真的没有吗？**

> 对象实例上没有。但字段、方法、父类声明处的泛型签名保留在 Class 文件的 `Signature` 属性里，通过 `getGenericType()` 等反射 API 可以读到。注意：Spring 的普通字段注入用的是 `getType()`，不是 `getGenericType()`；后者只在解析类型参数（`List<UserService>`、`Repository<User>`、泛型父类字段）时才用得上。

**Q5：为什么不能 `new T[]`？**

> 数组是具体化类型，运行时需要元素类型来做存取检查；泛型被擦除，运行时不知道 `T`。要创建泛型数组得用 `Array.newInstance(clazz, n)` 显式传 `Class`，否则 `(T[]) new Object[n]` 只是把风险推迟成堆污染。

**Q6：Java 为什么要擦除泛型？**

> 向后兼容。泛型是 Java 5 引入的，为了不改 JVM 指令集、让新代码能和老库（`List`、`Collection` 这类没有泛型的旧字节码）在同一套类型系统里互操作，语言层选择了"编译期检查 + 运行期擦除"。代价就是运行时拿不到泛型实参，才会有 `new T[]` 被禁止、重载冲突、需要桥方法这些现象。

**Q7：擦除带来了哪些连锁问题？**

> 四类：① 运行时无法判断泛型实参（`instanceof List<String>` 非法）；② 不能创建泛型数组（`new T[]`）；③ 擦除后签名相同导致重载冲突（`m(List<String>)` 与 `m(List<Integer>)` 不能共存）；④ 子类重写泛型方法时编译器要合成桥方法维持多态。

---

## 12. 小结

- `getClass()` 返回运行时真实类型的 `Class` 对象；同一个类加载器下，一个类只有一个 `Class` 对象。
- `Class` 对象是堆对象，类元数据本体在 Metaspace 的 `InstanceKlass` 里。
- 泛型是编译期的，运行时被擦除，擦到第一个上界。
- `List<String>` 和 `List<Integer>` 的实例运行时都是 `ArrayList`，`getClass()` 相等。
- 声明处的泛型签名保留在 Class 文件里，反射可读；但 Spring 普通字段注入用的是 `getType()`。
- 不能 `new T[]`，要 `Array.newInstance(clazz, n)`。
- 擦除的连锁反应：重载冲突、桥方法、堆污染、无法 `instanceof` 泛型实参。

记忆钩子一句话：**"泛型只活在编译期，`Class` 对象只认运行时真实类型。"**

---

## 13. 下一步

- [ ] 手跑第 10 节代码（含 `javac -Xlint:unchecked`），确认全部输出。
- [ ] 用 `javap -c -p` 看一眼桥方法的字节码。
- [ ] 闭卷复述第 11 节 7 个问题。
- [ ] 写下一篇：[02-擦除之后](/notes/01-Java基础/01-泛型/02-擦除之后/)——桥方法字节码、重载冲突、堆污染完整实验、泛型数组与 `@SafeVarargs`、`instanceof` 泛型实参、静态成员为什么不能用 `T`。
