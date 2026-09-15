---
title: 通配符与 PECS：? extends 与 ? super 到底在限制谁
description: 泛型不变性、? extends / ? super 的读写边界、PECS 原则、CAP#1 捕获错误与 Collections.swap 的取舍、Comparable<? super T> 为什么长这样，附 javac 实测报错、JDK 真实签名与源码。
published: 2026-09-15
---

> 所属：Java 面试笔记 / 01-Java基础 / 01-泛型 ｜ 学习计划：D1
> 前置：[02-擦除之后](/notes/01-Java基础/01-泛型/02-擦除之后/) ｜ 后续：04-泛型在框架中的应用（待写）

---

## 0. 本文要解决什么

前两篇讲的是**运行期**：泛型被擦除了，于是有桥方法、`checkcast`、堆污染。

这一篇换个角度，只看**编译期**：既然擦除后大家都是 `List`，javac 凭什么还能在编译期把类型错误拦住？靠的就是通配符这套"方向性"规则。

要回答的问题：

- 为什么 `List<String>` 能赋给 `List<?>`，却不能赋给 `List<Object>`？
- `List<? extends Number>` 为什么"能读不能写"？到底是谁在禁止 `add`？
- `List<? super Integer>` 为什么"能写不能读"？读出来为什么只能是 `Object`？
- PECS 是什么？看到一个方法签名怎么判断方向写得对不对？
- 编译错误里的 `CAP#1`（capture）是什么？
- `swap(List<?>, int, int)` 为什么编译不过，JDK 自己怎么绕过去？
- `Comparable<? super T>` 里的 `? super` 到底解决了什么问题？
- 泛型方法什么时候该写 `<T>`、什么时候只用通配符？

运行环境：JDK 17（Temurin 17.0.16）。下面所有报错和输出都是真跑出来的，JDK 源码摘自 `lib/src.zip`。

---

## 1. 泛型是不变的（invariant）

### 1.1 一个编译不过的赋值

```java
List<Object> list = new ArrayList<String>();   // 想当然的写法
```

```bash
javac BadInvariant.java
```

```text
BadInvariant.java:4: 错误: 不兼容的类型: ArrayList<String>无法转换为List<Object>
        List<Object> list = new ArrayList<String>();
                            ^
1 个错误
```

直觉上 `String` 是 `Object` 的子类，`List<String>` 就该是 `List<Object>` 的子类。Java 偏偏不允许——这不叫"没实现"，叫**不变性（invariance）**：`List<A>` 与 `List<B>` 之间，除了通配符，没有任何继承关系。

### 1.2 为什么必须这样设计：数组的教训

数组是**协变**的，Java 允许这样写，于是留下一个运行期漏洞：

```java
Object[] arr = new String[3];    // 编译通过
arr[0] = 1;                      // 编译通过！类型错误被推迟到运行期
```

```text
运行期: java.lang.ArrayStoreException: java.lang.Integer
```

`arr` 的静态类型是 `Object[]`，看起来什么都能放；但它的运行期类型是 `String[]`，JVM 直到执行 `aastore` 才发现类型不对。**数组的协变等于把类型检查推迟到了运行期。**

如果 `List<Object> list = new ArrayList<String>()` 合法，同样的漏洞会出现，而且更糟——擦除之后连"运行期类型"都没得查：

```java
List<Object> list = new ArrayList<String>();   // 假设合法
list.add(1);                                   // 编译期看是 List<Object>，合法
String s = list.get(0);                        // 运行期 checkcast：Integer -> String，炸
```

所以泛型选了不变：**编译期能拒绝的错误，绝不留到运行期。**

### 1.3 四条赋值规则（先记方向）

| 声明 | 能接受哪些实参 | 说明 |
|---|---|---|
| `List<Object> a` | 只有 `List<Object>` | 不变，最严格 |
| `List<?> b` | 任何 `List<X>` | 无界通配符，所有 `List` 的父类型 |
| `List<? extends Number> c` | `List<Number>`、`List<Integer>`、`List<Double>`… | 上界通配符，向下兼容所有子类型 |
| `List<? super Integer> d` | `List<Integer>`、`List<Number>`、`List<Object>` | 下界通配符，向上兼容所有父类型 |

实测：

```java
List<?> anything = new ArrayList<String>();                  // 可以
List<? extends Number> producer = new ArrayList<Integer>();  // 可以
producer = new ArrayList<Double>();                          // 换个子类型也行
producer = new ArrayList<Number>();                          // 上界本身也行
List<? super Integer> consumer = new ArrayList<Integer>();
consumer = new ArrayList<Number>();
consumer = new ArrayList<Object>();
```

一句话：**通配符是用来"放宽接收范围"的，方向由 `extends` / `super` 决定。**

---

## 2. `? extends`：只读的生产者

### 2.1 能读到什么

```java
List<? extends Number> list = new ArrayList<Integer>();
Number n = list.get(0);      // 编译通过，静态类型是上界 Number
```

`get` 的静态返回类型是 `? extends Number` 捕获后的类型，编译器统一读成上界 `Number`：不管实际是 `Integer` 还是 `Double`，都是 `Number` 的子类型，读出来安全。

### 2.2 为什么不能写

```java
list.add(1);       // 编译不过
list.add(1.0);     // 编译不过
list.add(null);    // 唯一合法的写入
```

```bash
javac BadExtends.java
```

```text
BadExtends.java:6: 错误: 不兼容的类型: int无法转换为CAP#1
        list.add(1);                         // 写：编译不过
                 ^
  其中, CAP#1是新类型变量:
    CAP#1从? extends Number的捕获扩展Number
BadExtends.java:7: 错误: 不兼容的类型: double无法转换为CAP#1
（第 7 行 list.add(1.0) 报同样的错，略）
2 个错误
```

关键点：**报错的主体不是 `Number`，而是 `CAP#1`。**

`list` 声明成 `List<? extends Number>` 时，真实元素类型对调用方是未知的——可能是 `Integer`，也可能是 `Double`。编译器用一个内部符号 `CAP#1` 表示"某个具体的、但此处不知道是谁的 `Number` 子类型"，而 `add` 的形参就是这个 `CAP#1`。既然不知道它是谁，任何具体值都塞不进去：

- 塞 `Integer`：万一是 `List<Double>`，就堆污染了；
- 塞 `Double`：万一是 `List<Integer>`，同样堆污染；
- 塞 `null`：`null` 是所有引用类型的值，与具体类型无关，唯一安全。

所以"上界通配符只能读、不能写"的准确含义是：**不是限制你，是编译器真的不知道往哪个类型里写。**

### 2.3 和数组协变对照

| | 数组 | 泛型 + `? extends` |
|---|---|---|
| 语法 | `Number[] a = new Integer[2];` | `List<? extends Number> l = new ArrayList<Integer>();` |
| 是否协变 | 是 | 是 |
| 写 | `a[0] = 1.5;` 编译通过，运行期 `ArrayStoreException` | `l.add(1.5)` 编译期直接拒绝 |
| 读 | `Number n = a[0];` | `Number n = l.get(0);` |

同一个协变想法，数组靠运行期兜底，泛型靠编译期拦下——区别就是泛型把"写的时候不能做什么"记录进了类型。

---

## 3. `? super`：只写的消费者

### 3.1 能写什么

```java
List<? super Integer> list = new ArrayList<Number>();
list.add(1);                          // 编译通过
list.add(Integer.valueOf(2));         // 编译通过
```

`? super Integer` 表示"某个 `Integer` 的父类型"：可能是 `Integer`、`Number`、`Object`。不管具体是哪个，**`Integer` 一定是它的子类型**，所以写入 `Integer` 永远合法。

### 3.2 为什么读出来只能是 `Object`

```java
Object o = list.get(0);      // 可以
Integer i = list.get(0);     // 编译不过
```

```bash
javac BadSuper.java
```

```text
BadSuper.java:5: 错误: 不兼容的类型: CAP#1无法转换为Integer
        Integer i = list.get(0);             // 读：编译不过，只能当 Object
                            ^
  其中, CAP#1是新类型变量:
    CAP#1从? super Integer的捕获扩展Object 超 Integer
1 个错误
```

注意报错里的描述：`CAP#1 扩展 Object 超 Integer`。`? super Integer` 的**上界是 `Object`**（`Integer` 只是下界），所以取值只能保证是 `Object`。想拿到具体类型，只能强转，或者改用泛型方法（见第 5 节）。

### 3.3 对照表

| | `List<? extends Number>` | `List<? super Integer>` |
|---|---|---|
| 实际可能是 | `List<Number>`、`List<Integer>`、`List<Double>` | `List<Integer>`、`List<Number>`、`List<Object>` |
| `get(0)` | `Number` ✓ | `Object` ✓ |
| `add(1)` | ✗ CAP#1 | ✓ |
| `add(1.0)` | ✗ CAP#1 | ✗（`Double` 不是 `Integer` 的子类型） |
| `add(null)` | ✓ | ✓ |
| 角色 | 生产者（只读） | 消费者（只写） |

---

## 4. PECS：Producer Extends, Consumer Super

### 4.1 规则

> **参数是"生产者"（方法从它读数据）→ 用 `? extends T`；参数是"消费者"（方法往它写数据）→ 用 `? super T`。**

判断只有一句话：**站在方法体里看，这个集合是被读还是被写？**

- 被读 → `extends`
- 被写 → `super`
- 既读又写 → 不能用通配符，改用方法级类型参数 `<T>`（第 5 节）

### 4.2 自己写三个签名

```java
/** 只读：生产者用 extends */
static double sum(List<? extends Number> src) { ... }

/** 只写：消费者用 super */
static void fill(List<? super Integer> dest, int n) { ... }

/** 一读一写：src 是生产者、dest 是消费者，各用各的 */
static <T> void copy(List<? super T> dest, List<? extends T> src) { ... }
```

```text
$ java PecsDemo
sum(List<Integer>) = 6.0
sum(List<Double>)  = 4.0
sum(List.of(1, 2L, 3.0f, 4.0)) = 10.0
fill -> [0, 1, 2]
copy -> [a, b]
before sort: [3, 1, 2]
after sort:  [3, 2, 1]
copied:      [3, 2, 1]
```

`sum` 一行通吃 `List<Integer>` / `List<Double>` / 混合数字列表；写成 `sum(List<Number>)` 就没有这个能力（`List<Integer>` 不是 `List<Number>`，回到第 1 节的不变性）。

`copy` 是最能说明 PECS 的例子：`dest` 用 `super`、`src` 用 `extends`，一次同时用上两条规则，而且**调用方不需要指定 `T`**——编译器从两个实参推断出 `T = String`。

### 4.3 JDK 里到处都是 PECS

用反射把 JDK 的真实签名打出来（`JdkSignatures.java`）：

```text
Collection.addAll  boolean addAll(java.util.Collection<? extends E>)
List.sort          void sort(java.util.Comparator<? super E>)
Collections.copy   <T extends java.lang.Object> void copy(java.util.List<? super T>, java.util.List<? extends T>)
Collections.fill   <T extends java.lang.Object> void fill(java.util.List<? super T>, T)
Collections.max    <T extends java.lang.Object extends java.lang.Comparable<? super T>> T max(java.util.Collection<? extends T>)
Collections.sort   <T extends java.lang.Comparable<? super T>> void sort(java.util.List<T>)
Collections.addAll <T extends java.lang.Object> boolean addAll(java.util.Collection<? super T>, T[])
Stream.forEach     void forEach(java.util.function.Consumer<? super T>)
Stream.map         <R extends java.lang.Object> java.util.stream.Stream<R> map(java.util.function.Function<? super T, ? extends R>)
```

翻译成人话：

| JDK API | 为什么是这个方向 |
|---|---|
| `Collection.addAll(Collection<? extends E> c)` | 参数是元素来源（生产者）→ `extends` |
| `Collections.addAll(Collection<? super T> c, T... elements)` | 参数是被填充的目标（消费者）→ `super` |
| `Collections.copy(List<? super T> dest, List<? extends T> src)` | 教科书式的一读一写 |
| `Collections.fill(List<? super T> list, T obj)` | 只写 → `super` |
| `List.sort(Comparator<? super E> c)` | 比较器**消费**集合元素 → `super` |
| `Stream.forEach(Consumer<? super T> action)` | 同上，动作消费元素 → `super` |
| `Stream.map(Function<? super T, ? extends R> mapper)` | 入参消费 `super T`、出参生产 `extends R` |
| `Collections.max(Collection<? extends T>)` | 只读（生产者）→ `extends`，返回值就是 `T` |

记法：**看到 `? extends` 就知道它在读，看到 `? super` 就知道它在写。**

顺带解释一个老问题：为什么 `Stream.map` 的参数里同时出现 `? super T` 和 `? extends R`？因为一个 `Function` **既消费又生产**——入参是消费者，出参是生产者，一个参数位就要写两条规则。

`Collections.copy` 的源码最能说明问题（JDK 17，`java.base/java/util/Collections.java`）：

```java
public static <T> void copy(List<? super T> dest, List<? extends T> src) {
    int srcSize = src.size();
    if (srcSize > dest.size())
        throw new IndexOutOfBoundsException("Source does not fit in dest");

    if (srcSize < COPY_THRESHOLD ||
        (src instanceof RandomAccess && dest instanceof RandomAccess)) {
        for (int i=0; i<srcSize; i++)
            dest.set(i, src.get(i));        // ← T 从 src 来、进 dest 去，两个方向都对得上
    } else { ... }
}
```

`src.get(i)` 静态类型是 `? extends T`（是 `T`），`dest.set(i, T)` 要求 `? super T`（能接 `T`）。**PECS 的本质就是让这一行能编译**。另外注意 `dest` 必须预先有足够长度，否则抛 `IndexOutOfBoundsException`——这也是它和 `addAll` 的分工差别。

### 4.4 方向写反了会怎样

```java
static void sum(List<Number> src)                                    // 太窄：List<Integer> 传不进来
static <T> void copy(List<? extends T> dest, List<? super T> src)    // 方向反了
```

第二种会在**方法体里**报错：`dest` 的 `add`/`set` 形参是 `CAP#2`，`src` 的元素是 `CAP#1`，编译器无法证明两者相同。所以有个好用自检法：**方法体能编译过，就说明签名方向写对了。**

---

## 5. 通配符捕获：`CAP#1` 与 `<T>` 辅助方法

### 5.1 一个"看起来显然"却编译不过的 swap

```java
static void swap(List<?> list, int i, int j) {
    list.set(i, list.get(j));      // 想让 i 位置存原来 j 位置的值
}
```

```bash
javac BadCapture.java
```

```text
BadCapture.java:4: 错误: 不兼容的类型: Object无法转换为CAP#1
        list.set(i, list.get(j));
                            ^
  其中, CAP#1是新类型变量:
    CAP#1从?的捕获扩展Object
1 个错误
```

`get` 返回 `Object`，而 `set` 要的是 `CAP#1`（`List<?>` 里那个未知的元素类型）。编译器无法证明"取出来的东西"和"塞进去的位置"是同一个类型，于是拒绝。

### 5.2 两种解法：`<T>` 辅助方法 vs 原始类型

**解法一：私有辅助方法把捕获类型"命名"下来**（Effective Java 第 31 条的写法）

```java
static void swap(List<?> list, int i, int j) {
    swapHelper(list, i, j);            // 对外保持最宽松的签名
}

private static <T> void swapHelper(List<T> list, int i, int j) {
    T tmp = list.get(i);               // 类型被命名成 T，get/set 就对上了
    list.set(i, list.get(j));
    list.set(j, tmp);
}
```

**解法二：JDK 自己用的是原始类型**（`java.base/java/util/Collections.java`）

```java
@SuppressWarnings({"rawtypes", "unchecked"})
public static void swap(List<?> list, int i, int j) {
    // instead of using a raw type here, it's possible to capture
    // the wildcard but it will require a call to a supplementary
    // private method
    final List l = list;
    l.set(i, l.set(j, l.get(i)));
}
```

JDK 的注释把这个取舍写得很清楚：**通配符是可以捕获的，但代价是加一个辅助方法**；标准库为了少一个方法、多一个 `@SuppressWarnings`，选了原始类型。（`l.set(j, l.get(i))` 还能把返回值当"原来 j 位置的值"用，顺手完成交换。）

两种解法都对，面试时能把取舍讲出来就是加分项：

| 解法 | 优点 | 代价 |
|---|---|---|
| `<T>` 辅助方法 | 全程类型安全，无 `@SuppressWarnings` | 多一个私有方法 |
| 原始类型 `List` | 代码短 | 关掉类型检查，必须自己保证安全 |

```text
$ java CaptureDemo
swap -> [3, 2, 1]
size=3, get(0)=3, class=Integer
after remove(0): [2, 1]
after clear(): []
```

**捕获的本质是"编译器在调用点推断出一个具体类型"，而 `<T>` 让这个推断结果能被写出来、被复用。**

### 5.3 `List<?>` 到底能干什么

```java
List<?> unknown = ints;
unknown.size();          // ✓
unknown.get(0);          // ✓ 结果是 Object
unknown.remove(0);       // ✓ 调的是 remove(int index)，与元素类型无关
unknown.clear();         // ✓
unknown.add(null);       // ✓ 只有 null
unknown.add(1);          // ✗ 编译不过
```

所以 `List<?>` 的语义是：**"我不关心元素类型，也绝不往里放东西"**——常出现在只用 `size`、判空、遍历打印的 API 上。

### 5.4 `List<Object>`、`List<?>`、`List<? extends Object>`

```java
static void a(List<?> list) { }
static void a(List<? extends Object> list) { }   // 与方法一冲突
```

```text
BadOnes.java:5: 错误: 已在类 BadOnes中定义了方法 a(List<?>)
        static void a(List<? extends Object> list) { }      // ① 通配符没带来任何区别：签名冲突
```

`<?>` 与 `<? extends Object>` 是同一个类型，重载直接冲突——**写 `? extends Object` 没有任何额外表达力**，多写只是噪音。

| 类型 | 能 add 什么 | 能接受哪些实参 | 什么时候用 |
|---|---|---|---|
| `List<Object>` | 任何对象 | 只有 `List<Object>` | 真的需要往同一个列表里放各种类型 |
| `List<?>` | 只能 `null` | 所有 `List<X>` | 只读：`size` / 判空 / 遍历 |
| `List<? extends Object>` | 同 `List<?>` | 同 `List<?>` | 别写，等价于 `List<?>` |

### 5.5 什么时候用 `<T>`、什么时候用通配符

判据（Effective Java 第 31 条）：**类型参数在方法签名的多个位置出现、需要把它们关联起来时用 `<T>`；只出现一个位置、只为放宽接收范围时用通配符。**

| 场景 | 写法 |
|---|---|
| 参数只读，与返回值无关 | `void print(List<?> list)` |
| 参数只读，返回值跟元素类型挂钩 | `<T> T first(List<? extends T> list)` |
| 两个参数类型必须一致 | `<T> void copy(List<? super T> dest, List<? extends T> src)` |
| 参数既读又写 | `<T> void sort(List<T> list)` |

一个常被追问的点：**`static <T> void print(List<T> list)` 也能编译，为什么不算好签名？** 因为 `T` 在方法体里没有任何用途，调用方却多了一层推断负担；语义上它和 `print(List<?>)` 完全等价。这种属于"为了泛型而泛型"，评审时应改回 `List<?>`。

---

## 6. `Comparable<? super T>`：`? super` 最经典的用法

### 6.1 先把问题摆出来

```java
class Base implements Comparable<Base> { ... }
class Sub extends Base { }        // 自己没实现 Comparable，继承来的是 Comparable<Base>
```

写一个取最大值的泛型方法，先按直觉写：

```java
static <T extends Comparable<T>> T max(List<? extends T> list) { ... }

Sub s = max(List.of(new Sub(3), new Sub(1)));   // 希望 T = Sub
```

```bash
javac BadComparable.java
```

```text
BadComparable.java:20: 错误: 不兼容的类型: 推论变量 T 具有不兼容的上限
        Sub s = max(List.of(new Sub(3), new Sub(1)));   // 要求 T = Sub
                   ^
    等式约束条件：Base
    下限：Sub,Comparable<T>
  其中, T是类型变量:
    T扩展已在方法 <T>max(List<? extends T>)中声明的Comparable<T>
1 个错误
```

`T extends Comparable<T>` 要求"`T` 自己实现了 `Comparable<T>`"。`Sub` 只实现了 `Comparable<Base>`，不满足，推断失败。真实项目里最常见的触发场景是 `java.sql.Timestamp`：它 `extends java.util.Date`，而 `Date implements Comparable<Date>`，所以 `Timestamp` 并不实现 `Comparable<Timestamp>`。

### 6.2 把 `T` 放宽成"能比较 `T` 的类型"

```java
static <T extends Comparable<? super T>> T max(List<? extends T> list) {
    T best = list.get(0);
    for (T t : list) if (t.compareTo(best) > 0) best = t;
    return best;
}

Sub s = max(List.of(new Sub(3), new Sub(1), new Sub(2)));   // 编译通过，返回类型就是 Sub
```

```text
$ java ComparableDemo
max(Sub)     = Sub(3)  运行期类型=Sub
max(String)  = c
max(Integer) = 9
```

`Comparable<? super T>` 的意思是"**`T` 的某个父类型实现了 `Comparable`**"：

- `Sub` → `Comparable<Base>` ✓（`Base` 是 `Sub` 的父类）
- `String` → `Comparable<String>` ✓（`T` 自己也算 `? super T`）
- `Integer` → `Comparable<Integer>` ✓

换成 `Comparable<T>`，只有第二、三种能过。**`? super` 在这里买到的是"允许沿继承链比较"，代价只是签名长一点。**

### 6.3 JDK 的原始签名与那个 `Object &`

```java
public static <T extends Object & Comparable<? super T>> T max(Collection<? extends T> coll) {
    Iterator<? extends T> i = coll.iterator();
    T candidate = i.next();
    while (i.hasNext()) {
        T next = i.next();
        if (next.compareTo(candidate) > 0)
            candidate = next;
    }
    return candidate;
}
```

- `Comparable<? super T>`：逻辑需要，理由见 6.2。
- `Object &`：擦除后 `T extends Comparable<? super T>` 的上界是 `Comparable`，返回类型会变成 `Comparable`；写上 `Object &` 之后上界变成 `Object`，才能与泛型时代之前 `max(Collection)` 的签名保持**二进制兼容**。这是给老字节码兜底的产物，不是逻辑需要。

被追问"这个 `Object &` 是干嘛的"，答"保持与擦除前签名的兼容"就够了。

### 6.4 记忆钩子

`? super` 出现在边界里，永远在说同一件事：**"我只需要一个能接受 `T` 的容器/比较器，不需要它精确等于 `T`。"**

---

## 7. 嵌套通配符：外层不变、内层才放开

泛型不变性对嵌套同样成立，而且很容易踩：

```java
List<List<? extends Number>> outer = new ArrayList<List<Integer>>();   // 编译不过！
```

```bash
javac MoreRules.java
```

```text
MoreRules.java:21: 错误: 不兼容的类型: ArrayList<List<Integer>>无法转换为List<List<? extends Number>>
        List<List<? extends Number>> outer = new ArrayList<List<Integer>>();
                                             ^
1 个错误
```

因为 `new ArrayList<List<Integer>>()` 的类型是 `ArrayList<List<Integer>>`，外层实参是 `List<Integer>`，而要求的是 `List<? extends Number>`——**外层没写通配符，就必须精确相等**，`List<Integer>` 不等于 `List<? extends Number>`。

两种正确写法：

```java
// 写法一：外层不放通配符 → 先建空表，再往里 add（元素类型正是 List<? extends Number>）
List<List<? extends Number>> outer = new ArrayList<>();
outer.add(new ArrayList<Integer>(List.of(1, 2)));

// 写法二：外层也放开 → 可以直接用子类型初始化
List<? extends List<? extends Number>> outer2 = new ArrayList<List<Integer>>();
```

```text
outer -> [[1, 2]]
outer2 -> []
```

规则一句话：**通配符只放宽它所在的那一层，不向下传递。**

---

## 8. 完整验证代码

### 8.1 文件清单

```text
gen03/
├── CovarianceDemo.java      # 数组协变 vs 泛型不变
├── PecsDemo.java            # sum / fill / copy + JDK 自带 API
├── CaptureDemo.java         # swap 的捕获辅助方法
├── ComparableDemo.java      # Comparable<? super T>
├── JdkSignatures.java       # 反射打印 JDK 真实签名
├── MoreRules.java           # 赋值规则、嵌套通配符
├── BadInvariant.java        # 故意编译失败：不变性
├── BadExtends.java          # 故意编译失败：? extends 不能写
├── BadSuper.java            # 故意编译失败：? super 只能读成 Object
├── BadCapture.java          # 故意编译失败：CAP#1
├── BadComparable.java       # 故意编译失败：Comparable<T> 太严
└── BadOnes.java             # 故意编译失败：4 个常见错误合集
```

```bash
javac CovarianceDemo.java PecsDemo.java CaptureDemo.java ComparableDemo.java JdkSignatures.java MoreRules.java
java  CovarianceDemo && java PecsDemo && java CaptureDemo && java ComparableDemo && java MoreRules && java JdkSignatures
javac BadInvariant.java BadExtends.java BadSuper.java BadCapture.java BadComparable.java BadOnes.java   # 看报错
```

### 8.2 CovarianceDemo.java

```java
public class CovarianceDemo {
    public static void main(String[] args) {
        // 数组是协变的：编译通过，运行期才炸
        Object[] arr = new String[3];
        try {
            arr[0] = 1;                      // 把 Integer 塞进 String[]
        } catch (ArrayStoreException e) {
            System.out.println("运行期: " + e);
        }
        // 泛型是不变的：下面这行连编译都过不了（见 BadInvariant.java）
        // List<Object> list = new ArrayList<String>();
    }
}
```

```text
运行期: java.lang.ArrayStoreException: java.lang.Integer
```

### 8.3 PecsDemo.java

```java
import java.util.*;

public class PecsDemo {
    /** 只读：生产者用 extends */
    static double sum(List<? extends Number> src) {
        double s = 0;
        for (Number n : src) s += n.doubleValue();
        return s;
    }

    /** 只写：消费者用 super */
    static void fill(List<? super Integer> dest, int n) {
        for (int i = 0; i < n; i++) dest.add(i);
    }

    /** 一读一写：src 是生产者、dest 是消费者，各用各的 */
    static <T> void copy(List<? super T> dest, List<? extends T> src) {
        for (T t : src) dest.add(t);
    }

    public static void main(String[] args) {
        System.out.println("sum(List<Integer>) = " + sum(List.of(1, 2, 3)));
        System.out.println("sum(List<Double>)  = " + sum(List.of(1.5, 2.5)));
        System.out.println("sum(List.of(1, 2L, 3.0f, 4.0)) = " + sum(List.of(1, 2L, 3.0f, 4.0)));

        List<Number> numbers = new ArrayList<>();
        fill(numbers, 3);                    // List<Number> 是 List<? super Integer>
        System.out.println("fill -> " + numbers);

        List<Object> objects = new ArrayList<>();
        copy(objects, List.of("a", "b"));    // List<Object> dest + List<String> src
        System.out.println("copy -> " + objects);

        // JDK 自带的同一原则：
        List<Integer> ints = new ArrayList<>();
        Collections.addAll(ints, 3, 1, 2);   // addAll(Collection<? extends E>)
        System.out.println("before sort: " + ints);
        ints.sort(Comparator.reverseOrder()); // sort(Comparator<? super E>)
        System.out.println("after sort:  " + ints);
        List<Integer> copyTarget = Arrays.asList(new Integer[3]);
        Collections.copy(copyTarget, ints);  // copy(List<? super T>, List<? extends T>)
        System.out.println("copied:      " + copyTarget);
    }
}
```

```text
sum(List<Integer>) = 6.0
sum(List<Double>)  = 4.0
sum(List.of(1, 2L, 3.0f, 4.0)) = 10.0
fill -> [0, 1, 2]
copy -> [a, b]
before sort: [3, 1, 2]
after sort:  [3, 2, 1]
copied:      [3, 2, 1]
```

### 8.4 CaptureDemo.java

```java
import java.util.*;

public class CaptureDemo {
    /** 对外保持最宽松的签名 */
    static void swap(List<?> list, int i, int j) {
        swapHelper(list, i, j);
    }

    /** 私有辅助方法用 <T> 把这个 capture 命名下来 */
    private static <T> void swapHelper(List<T> list, int i, int j) {
        T tmp = list.get(i);
        list.set(i, list.get(j));
        list.set(j, tmp);
    }

    public static void main(String[] args) {
        List<Integer> ints = new ArrayList<>(List.of(1, 2, 3));
        swap(ints, 0, 2);
        System.out.println("swap -> " + ints);

        List<?> unknown = ints;
        System.out.println("size=" + unknown.size() + ", get(0)=" + unknown.get(0)
                + ", class=" + unknown.get(0).getClass().getSimpleName());
        unknown.remove(0);
        System.out.println("after remove(0): " + unknown);
        unknown.clear();
        System.out.println("after clear(): " + unknown);
        // unknown.add(1);                   // 编译不过：捕获类型无法确定
    }
}
```

```text
swap -> [3, 2, 1]
size=3, get(0)=3, class=Integer
after remove(0): [2, 1]
after clear(): []
```

### 8.5 ComparableDemo.java

```java
import java.util.*;

public class ComparableDemo {
    static class Base implements Comparable<Base> {
        final int v;
        Base(int v) { this.v = v; }
        @Override public int compareTo(Base o) { return Integer.compare(v, o.v); }
        @Override public String toString() { return getClass().getSimpleName() + "(" + v + ")"; }
    }

    static class Sub extends Base {
        Sub(int v) { super(v); }
    }

    /** 子类自己没实现 Comparable<Sub>，只从父类继承了 Comparable<Base>，所以必须写 ? super T */
    static <T extends Comparable<? super T>> T max(List<? extends T> list) {
        T best = list.get(0);
        for (T t : list) if (t.compareTo(best) > 0) best = t;
        return best;
    }

    public static void main(String[] args) {
        Sub s = max(List.of(new Sub(3), new Sub(1), new Sub(2)));   // T = Sub，返回值就是 Sub，不用强转
        System.out.println("max(Sub)     = " + s + "  运行期类型=" + s.getClass().getSimpleName());
        System.out.println("max(String)  = " + max(List.of("b", "c", "a")));
        System.out.println("max(Integer) = " + max(List.of(5, 9, 7)));
    }
}
```

```text
max(Sub)     = Sub(3)  运行期类型=Sub
max(String)  = c
max(Integer) = 9
```

### 8.6 JdkSignatures.java

```java
import java.lang.reflect.*;
import java.util.*;
import java.util.stream.Stream;

public class JdkSignatures {
    static void show(Class<?> owner, String name, Class<?>... params) {
        try {
            Method m = owner.getMethod(name, params);
            StringBuilder sb = new StringBuilder();
            for (TypeVariable<Method> tv : m.getTypeParameters()) {
                sb.append("<").append(tv.getName());
                for (Type b : tv.getBounds()) sb.append(" extends ").append(b.getTypeName());
                sb.append("> ");
            }
            String ps = Stream.of(m.getGenericParameterTypes()).map(Type::getTypeName).reduce((a, b) -> a + ", " + b).orElse("");
            System.out.printf("%-34s %s%s %s(%s)%n", owner.getSimpleName() + "." + name, sb, m.getGenericReturnType().getTypeName(), name, ps);
        } catch (Exception e) {
            System.out.println("ERR " + name + ": " + e);
        }
    }

    public static void main(String[] args) {
        show(Collection.class, "addAll", Collection.class);
        show(List.class, "sort", Comparator.class);
        show(Collections.class, "copy", List.class, List.class);
        show(Collections.class, "fill", List.class, Object.class);
        show(Collections.class, "max", Collection.class);
        show(Collections.class, "sort", List.class);
        show(Collections.class, "addAll", Collection.class, Object[].class);
        show(Stream.class, "forEach", java.util.function.Consumer.class);
        show(Stream.class, "map", java.util.function.Function.class);
    }
}
```

### 8.7 MoreRules.java

```java
import java.util.*;

public class MoreRules {
    public static void main(String[] args) {
        // 通配符是「父类型」的方向：? extends 让多个具体实参都能赋给同一个变量
        List<? extends Number> producer = new ArrayList<Integer>();
        System.out.println(producer.getClass().getSimpleName() + " -> " + producer.size());
        producer = new ArrayList<Double>();          // 换一个实现类也行
        producer = new ArrayList<Number>();          // 上界本身也行
        producer.add(null);                          // 唯一的合法写入
        System.out.println("add(null) 之后 size=" + producer.size());

        // ? super 同理
        List<? super Integer> consumer = new ArrayList<Integer>();
        consumer = new ArrayList<Number>();
        consumer = new ArrayList<Object>();
        consumer.add(42);
        System.out.println("consumer -> " + consumer);

        // 嵌套：外层不变，声明成 List<List<? extends Number>> 之后，只能先建空表再 add
        List<List<? extends Number>> outer = new ArrayList<>();
        outer.add(new ArrayList<Integer>(List.of(1, 2)));   // 元素类型正是 List<? extends Number>
        // 外层也放开，才能直接用 ArrayList<List<Integer>> 初始化
        List<? extends List<? extends Number>> outer2 = new ArrayList<List<Integer>>();
        System.out.println("outer -> " + outer);
        System.out.println("outer2 -> " + outer2);

        // List<Object> 与 List<?> 的区别
        List<Object> objects = new ArrayList<>();
        objects.add("随便放");                        // List<Object> 能写
        List<?> anything = objects;                  // 任何 List<X> 都能赋给它
        Object first = anything.get(0);              // 只能读成 Object
        System.out.println("anything.size=" + anything.size() + ", first=" + first);
        System.out.println("List<Object> 能 add，List<?> 只能读、remove、clear");

        // 数组协变 vs 泛型不变，放一起对比
        Number[] nums = new Integer[2];              // 数组：编译通过，运行期可能炸
        try { nums[0] = 1.5; } catch (ArrayStoreException e) { System.out.println("数组协变: " + e); }
        System.out.println("数组协变是编译期'允许'、运行期兜底；泛型是编译期直接拒绝");
    }
}
```

```text
ArrayList -> 0
add(null) 之后 size=1
consumer -> [42]
outer -> [[1, 2]]
outer2 -> []
anything.size=1, first=随便放
List<Object> 能 add，List<?> 只能读、remove、clear
数组协变: java.lang.ArrayStoreException: java.lang.Double
数组协变是编译期'允许'、运行期兜底；泛型是编译期直接拒绝
```

### 8.8 故意编译失败的文件

```java
import java.util.*;

public class BadOnes {
    static void a(List<?> list) { }
    static void a(List<? extends Object> list) { }      // ① 通配符没带来任何区别：签名冲突

    static void b(List<?> list) {
        list.add("x");                                  // ② 无界通配符不能写入（null 除外）
    }

    static Number c(List<? extends Number> list) {
        List<Number> copy = list;                       // ③ 通配符不能反向赋给具体实参
        return copy.get(0);
    }

    static void d() {
        List<Object> objects = new ArrayList<String>(); // ④ 泛型不变：List<String> 不是 List<Object>
    }
}
```

```text
BadOnes.java:5: 错误: 已在类 BadOnes中定义了方法 a(List<?>)
BadOnes.java:8: 错误: 不兼容的类型: String无法转换为CAP#1
  其中, CAP#1是新类型变量:
    CAP#1从?的捕获扩展Object
BadOnes.java:12: 错误: 不兼容的类型: List<CAP#1>无法转换为List<Number>
  其中, CAP#1是新类型变量:
    CAP#1从? extends Number的捕获扩展Number
BadOnes.java:17: 错误: 不兼容的类型: ArrayList<String>无法转换为List<Object>
4 个错误
```

③ 那条尤其值得记：`List<? extends Number>` 只能**读**，想把它当 `List<Number>` 用是反向赋值，编译器连类型都不认。

---

## 9. 面试问法

**Q1：为什么 `List<String>` 不能赋给 `List<Object>`？**

> 泛型是不变的。如果允许，就会出现 `List<Object> l = new ArrayList<String>(); l.add(1);` 这种编译期合法、运行期 `checkcast` 爆炸的代码。数组是协变的，正好演示了这个后果——`Object[] a = new String[3]; a[0] = 1;` 编译通过、运行期 `ArrayStoreException`。泛型选择了"编译期就拒绝"，代价是需要通配符来表达协变/逆变。

**Q2：`List<? extends Number> l = new ArrayList<Integer>(); l.add(1);` 为什么编译不过？**

> 因为 `? extends Number` 的实际元素类型对调用方未知，编译器用 `CAP#1` 表示"某个 `Number` 的子类型"，`add` 的形参就是这个 `CAP#1`。塞 `Integer` 万一是 `List<Double>` 就污染了，所以只有在类型确定时才允许写。读没问题，`l.get(0)` 静态类型是 `Number`；`add(null)` 也允许，因为 `null` 与具体类型无关。

**Q3：`List<? super Integer>` 能写什么、能读成什么？**

> 能写 `Integer`（以及它的子类），因为 `? super Integer` 的每个可能取值（`Integer`/`Number`/`Object`）都能接受 `Integer`。读出来只能保证是 `Object`，因为上界是 `Object`；想要具体类型得强转或改用泛型方法。

**Q4：PECS 是什么？怎么判断方向？**

> Producer Extends, Consumer Super：参数是数据来源（被读）用 `? extends T`，参数是数据去向（被写）用 `? super T`。站在方法体里看"这个集合是被读还是被写"即可。JDK 里例子很多：`Collections.copy(List<? super T> dest, List<? extends T> src)`、`List.sort(Comparator<? super E>)`、`Stream.map(Function<? super T, ? extends R>)`（一个参数位既消费又生产，所以两条规则同时出现）。签名方向写反，方法体编译不过——这也是自检手段。

**Q5：编译错误里的 `CAP#1` 是什么？**

> 通配符捕获（capture conversion）。编译器把 `?` 或 `? extends X` 换成一个内部的、调用点唯一的类型变量。`List<?> l; l.set(i, l.get(j))` 报 `Object无法转换为CAP#1` 就是它：`get` 给的是 `Object`，`set` 要的是那个未知的 `CAP#1`。解法是用 `<T>` 辅助方法把这个类型命名下来，或者像 `Collections.swap` 那样用原始类型 + `@SuppressWarnings`。

**Q6：`Collections.swap(List<?>, int, int)` 是怎么实现的？**

> JDK 17 用的是原始类型：`final List l = list; l.set(i, l.set(j, l.get(i)));`，并加 `@SuppressWarnings({"rawtypes","unchecked"})`。源码注释写得很直白："通配符是可以捕获的，但那需要额外的私有辅助方法"——所以标准库选了原始类型这条捷径。自己写代码时更推荐 `<T>` 辅助方法，全程类型安全。

**Q7：`Comparable<? super T>` 里的 `? super` 能不能去掉？**

> 不能，去掉会明显收窄适用范围。`T extends Comparable<T>` 要求元素类型自己实现 `Comparable<自己>`；现实里大量类的比较能力来自父类（典型：`java.sql.Timestamp extends Date`，`Date implements Comparable<Date>`），此时 `Comparable<T>` 不成立、推断直接报"推论变量 T 具有不兼容的上限"。写成 `Comparable<? super T>` 就是允许"某个父类型实现了 `Comparable`"。`Collections.max`/`Collections.sort` 都是这个签名；`max` 里那个 `Object &` 是为了与泛型前 `max(Collection)` 的擦除签名保持二进制兼容。

**Q8：方法参数什么时候用通配符、什么时候用 `<T>`？**

> 类型参数在签名的多个位置出现、需要建立关联（参数与参数、参数与返回值）时用 `<T>`，例如 `<T> void copy(List<? super T>, List<? extends T>)`、`<T> T first(List<? extends T>)`；只出现在一个位置、纯为放宽接收范围时用通配符，例如 `void print(List<?>)`。写成 `static <T> void print(List<T>)` 能编译，但 `T` 毫无用途，等价于 `List<?>`，属于噪音。

---

## 10. 小结

- 泛型**不变**：`List<String>` 不是 `List<Object>`；数组是协变的，代价是 `ArrayStoreException` 留到运行期。
- `? extends T` = **只读**：`get` 得到 `T`，`add` 除 `null` 外一律编译不过，报错主体是 `CAP#1`。
- `? super T` = **只写**：`add(T)` 可以，`get` 只能读成 `Object`（上界是 `Object`）。
- **PECS**：Producer Extends, Consumer Super；`Stream.map(Function<? super T, ? extends R>)` 一个参数位同时体现两条规则。
- 捕获（`CAP#1`）用 `<T>` 辅助方法命名下来；`Collections.swap` 用原始类型 + `@SuppressWarnings` 走捷径，取舍写在源码注释里。
- `List<?>`：只读、`remove`/`clear`/`size` 可用、只能 `add(null)`；`<? extends Object>` 与它完全等价。
- 边界里的 `? super`：`<T extends Comparable<? super T>>` 让子类继承父类比较能力时也能用，`Collections.max` 就是这么写的。

记忆钩子：**"extends 读、super 写；`CAP#1` 不认识，`<T>` 帮它起个名。"**

---

## 11. 下一步

- [ ] 手跑第 8 节代码，对照参考输出。
- [ ] 故意编译失败的那几个文件，逐个把报错读一遍，确认自己能解释 `CAP#1`。
- [ ] 随便挑一个 JDK 泛型 API（`Stream.map`、`Collections.addAll`）解释它为什么是这个方向。
- [ ] 闭卷复述第 9 节 8 个问题。
- [ ] 写下一篇：`04-泛型在框架中的应用`（Spring `ResolvableType`、`Class<T>` 的 API 设计、Jackson `TypeReference`、MyBatis 的泛型 Mapper）。
